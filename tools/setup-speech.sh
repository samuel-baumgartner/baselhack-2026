#!/usr/bin/env bash
set -euo pipefail
speech_dir="${XDG_DATA_HOME:-$HOME/.local/share}/presence-speech"
if [[ ! -x "$speech_dir/venv/bin/python" ]]; then
  uv venv "$speech_dir/venv"
fi
uv pip install --python "$speech_dir/venv/bin/python" 'faster-whisper==1.2.1' 'av==16.0.1'
"$speech_dir/venv/bin/python" - "$speech_dir/model" <<'PY'
import sys
from huggingface_hub import snapshot_download
snapshot_download('Systran/faster-whisper-tiny.en', local_dir=sys.argv[1],
                  allow_patterns=['config.json', 'model.bin', 'tokenizer.json', 'vocabulary.*'])
PY
printf '\nAdd these paths to .env.local:\nSPEECH_PYTHON=%s/venv/bin/python\nSPEECH_MODEL_PATH=%s/model\n' "$speech_dir" "$speech_dir"
