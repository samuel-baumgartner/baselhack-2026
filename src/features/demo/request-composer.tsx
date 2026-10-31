"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_REQUEST } from "@/lib/contracts";
import { ArrowRight, Loader2, Mic, Send, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function RequestComposer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [voice, setVoice] = useState<
    "idle" | "starting" | "recording" | "transcribing"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const recording = useRef<{
    recorder: MediaRecorder | null;
    stream: MediaStream | null;
    timer?: ReturnType<typeof setTimeout>;
    cancelled: boolean;
    controller: AbortController;
  } | null>(null);

  useEffect(
    () => () => {
      const session = recording.current;
      if (!session) return;
      session.cancelled = true;
      clearTimeout(session.timer);
      session.controller.abort();
      if (session.recorder?.state === "recording") session.recorder.stop();
      session.stream?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const busy = voice !== "idle";
  const fillSuggestion = () => {
    setPrompt(DEFAULT_REQUEST);
    setError(null);
    input.current?.focus();
  };

  async function startVoice() {
    if (disabled || busy) return;
    setError(null);
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Microphone recording is unavailable here. Open this local app in Chrome or Edge, or use the suggestion below.",
      );
      return;
    }
    const session = {
      recorder: null as MediaRecorder | null,
      stream: null as MediaStream | null,
      timer: undefined as ReturnType<typeof setTimeout> | undefined,
      cancelled: false,
      controller: new AbortController(),
    };
    recording.current = session;
    setVoice("starting");
    try {
      session.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (session.cancelled) {
        session.stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        session.stream,
        mimeType ? { mimeType } : undefined,
      );
      session.recorder = recorder;
      const chunks: Blob[] = [];
      let size = 0;
      recorder.ondataavailable = (event) => {
        if (event.data.size) {
          chunks.push(event.data);
          size += event.data.size;
          if (size > 2_000_000 && recorder.state === "recording")
            recorder.stop();
        }
      };
      recorder.onerror = () => {
        session.cancelled = true;
        clearTimeout(session.timer);
        session.stream?.getTracks().forEach((track) => track.stop());
        setVoice("idle");
        setError("Recording stopped unexpectedly. Please try again.");
      };
      recorder.onstop = async () => {
        clearTimeout(session.timer);
        session.stream?.getTracks().forEach((track) => track.stop());
        if (session.cancelled) return;
        setVoice("transcribing");
        try {
          const audio = new Blob(chunks, { type: recorder.mimeType });
          if (!audio.size || audio.size > 2_000_000)
            throw new Error(
              "Please record a shorter request, up to one minute.",
            );
          const response = await fetch("/api/demo/transcribe", {
            method: "POST",
            headers: { "content-type": audio.type || "audio/webm" },
            body: audio,
            signal: session.controller.signal,
          });
          const data = (await response.json()) as {
            text?: string;
            error?: { message?: string };
          };
          if (!response.ok || !data.text)
            throw new Error(
              data.error?.message ??
                "No speech was detected. Please try again.",
            );
          if (!session.cancelled) {
            setPrompt((current) =>
              [current.trim(), data.text!.trim()].filter(Boolean).join(" "),
            );
            input.current?.focus();
          }
        } catch (cause) {
          if (!session.cancelled)
            setError(
              cause instanceof Error
                ? cause.message
                : "Could not transcribe your request. Please try again.",
            );
        } finally {
          if (!session.cancelled) setVoice("idle");
        }
      };
      recorder.start(1000);
      setVoice("recording");
      session.timer = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 60_000);
    } catch (cause) {
      session.stream?.getTracks().forEach((track) => track.stop());
      if (!session.cancelled) {
        setVoice("idle");
        setError(
          cause instanceof DOMException && cause.name === "NotAllowedError"
            ? "Microphone access was blocked. Allow the microphone for this site and try again."
            : "Could not open your microphone. Check that it is connected and try again.",
        );
      }
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (prompt.trim() && !disabled && !busy) onSend(prompt.trim());
      }}
      className="mt-7 rounded-2xl border bg-white p-4"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label
          className="block text-[10px] font-medium text-muted-foreground"
          htmlFor="traveller-prompt"
        >
          What would you like your agent to arrange?
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          disabled={
            disabled || voice === "starting" || voice === "transcribing"
          }
          aria-pressed={voice === "recording"}
          onClick={() =>
            voice === "recording"
              ? recording.current?.recorder?.stop()
              : void startVoice()
          }
        >
          {voice === "recording" ? (
            <Square className="size-3 fill-current" />
          ) : voice === "transcribing" || voice === "starting" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Mic className="size-3.5" />
          )}
          {voice === "recording"
            ? "Stop recording"
            : voice === "transcribing"
              ? "Transcribing…"
              : "Speak your request"}
        </Button>
      </div>
      <Textarea
        ref={input}
        id="traveller-prompt"
        value={prompt}
        placeholder="Tell your agent what you need. Speak or type your request…"
        onChange={(event) => setPrompt(event.target.value)}
        className="min-h-20 resize-none border-0 p-0 text-sm leading-7 shadow-none focus-visible:ring-0"
        disabled={disabled || busy}
        aria-describedby="request-help"
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (
            event.key === "ArrowRight" &&
            !prompt &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey
          ) {
            event.preventDefault();
            fillSuggestion();
          }
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!disabled && !busy && prompt.trim())
              event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      {!prompt && (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={fillSuggestion}
          aria-label="Use suggested request"
          aria-keyshortcuts="ArrowRight"
          className="mt-2 flex w-full items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold text-primary">
              Try saying
            </span>
            <span className="mt-1 block text-xs leading-6 text-muted-foreground">
              {DEFAULT_REQUEST}
            </span>
          </span>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-white text-primary">
            <ArrowRight className="size-4" />
          </span>
        </button>
      )}
      <p
        id="request-help"
        role="status"
        aria-live="polite"
        className="mt-3 text-[10px] leading-relaxed text-muted-foreground"
      >
        {voice === "starting"
          ? "Allow microphone access to start speaking."
          : voice === "recording"
            ? "Listening… Speak in English, then press Stop. Up to one minute."
            : voice === "transcribing"
              ? "Turning your voice into text…"
              : "Speak in English, or focus the empty box and press → to use the suggestion. Review before sending."}
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 text-xs leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <span className="text-[9px] text-muted-foreground">
          Review before sending
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={disabled || busy || !prompt.trim()}
          className="gap-2 text-xs"
        >
          Send to my agent <Send className="size-3" />
        </Button>
      </div>
      <p className="mt-3 text-[9px] text-muted-foreground">
        Approval required before booking. Voice is transcribed on this local
        server; the recording is then deleted.
      </p>
    </form>
  );
}
