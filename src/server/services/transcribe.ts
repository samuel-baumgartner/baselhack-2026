import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { AppError } from "../auth";

const execute = promisify(execFile);
let active = false;

// CPU-only, two threads, one request at a time. The model must be installed at setup.
const script = `
import json, sys
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio
audio = decode_audio(sys.argv[1], sampling_rate=16000)
if len(audio) > 61 * 16000:
    raise ValueError("Recording exceeds one minute")
model = WhisperModel(sys.argv[2], device="cpu", compute_type="int8", cpu_threads=2, num_workers=1, local_files_only=True)
segments, _ = model.transcribe(audio, language="en", beam_size=3, vad_filter=True, condition_on_previous_text=False)
print(json.dumps({"text": " ".join(s.text.strip() for s in segments).strip()}))
`;

export async function transcribeAudio(audio: Buffer) {
  if (active)
    throw new AppError(
      "VOICE_BUSY",
      "Another recording is being transcribed. Please try again shortly.",
      429,
    );
  if (!audio.length || audio.length > 2_000_000)
    throw new AppError(
      "INVALID_AUDIO",
      "Record a request up to one minute.",
      413,
    );
  active = true;
  let directory: string | undefined;
  try {
    directory = await mkdtemp(join(tmpdir(), "presence-voice-"));
    const path = join(directory, "request.audio");
    await writeFile(path, audio, { mode: 0o600 });
    const { stdout } = await execute(
      process.env.SPEECH_PYTHON || "python3",
      [
        "-c",
        script,
        path,
        process.env.SPEECH_MODEL_PATH || "/opt/presence-speech/model",
      ],
      {
        timeout: 45_000,
        killSignal: "SIGKILL",
        maxBuffer: 128_000,
        env: { ...process.env, OMP_NUM_THREADS: "2", HF_HUB_OFFLINE: "1" },
      },
    );
    const result = JSON.parse(stdout) as { text?: unknown };
    if (typeof result.text !== "string" || !result.text.trim())
      throw new AppError(
        "NO_SPEECH",
        "No speech was detected. Please try again.",
        422,
      );
    return result.text.trim();
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Do not expose subprocess output, environment or recording contents.
    throw new AppError(
      "TRANSCRIPTION_FAILED",
      "Voice transcription failed. Try a shorter recording, or use the suggested request.",
      503,
    );
  } finally {
    try {
      if (directory) await rm(directory, { recursive: true, force: true });
    } finally {
      active = false;
    }
  }
}
