# Code Explanations

## `voice/` — local voice module

Introduced in `b096e38`. First executable code in this repo — everything else remains markdown (architecture docs, skill specs).

| File | Purpose |
|---|---|
| `common.py` | Loads `voice/config.yaml` and resolves its dotted config keys (e.g. `wake_word.model_path`) to absolute paths under `voice/`. |
| `wake.py` | `WakeWordDetector` — streams the mic in 80ms frames through openWakeWord and blocks until the configured wake word crosses its detection threshold. Nothing captured before the trigger is kept or sent anywhere. |
| `capture.py` | `record_utterance` — records one utterance after the wake word fires, using `webrtcvad` to detect 900ms of trailing silence (or a 15s hard cap) as the stop condition. |
| `verify.py` | Speaker verification gate. Embeds the utterance with SpeechBrain's ECAPA-TDNN (`spkrec-ecapa-voxceleb`) and compares it via cosine similarity against the enrolled voiceprint (`is_match`). Anything below `accept_threshold` is rejected before it reaches STT or Claude. Replaced an earlier resemblyzer/GE2E-based version after live testing produced a false accept (impostor scored 0.82 vs. the genuine owner's 0.68-0.69). |
| `stt.py` | `transcribe` — speech-to-text via faster-whisper, CPU by default. Stubs out the `av` (PyAV) import if it fails to load, since that dependency is only used for a file-decoding path this module never exercises, and PyAV's bundled FFmpeg DLLs can get blocked by Windows Application Control policy. |
| `tts.py` | `speak` — text-to-speech via Piper, played directly through `sounddevice`. `strip_markdown` removes Claude's markdown formatting first (code fences, bold/italic markers, links, headers, Windows drive-letter paths) so Piper doesn't phonetically spell out symbols like `**` or `D:\`. |
| `bridge.py` | `ask_claude` — sends verified, transcribed text to Claude Code headlessly (`claude -p --output-format text`), resuming a dedicated session ID (`.session_id`, separate from any interactive terminal session) so voice turns keep context. |
| `enroll.py` | One-time interactive enrollment: records 5 prompted samples, embeds each via `verify.embed_audio`, averages them into a voiceprint (`voiceprint.npy`), and self-checks sample consistency to flag weak enrollments before they cause false rejections. |
| `listen.py` | Entry point — the always-on loop: `wait_for_wake` → `record_utterance` → `verify` (drop and log-only if rejected) → `transcribe` → `ask_claude` → `log_turn` → `speak`. No keypress anywhere; Ctrl+C is the only way to stop it. |
| `logger.py` | `log_turn` / `log_rejection` — appends voice session activity to `vault/raw/engineering/voice-sessions/<date>.md` via direct file writes (no MCP/REST dependency, so it works even when Obsidian isn't running). Rejections log only a timestamp, never audio or transcript content. |

Local-only, gitignored state (never committed): `voice/config.yaml`, `voice/voiceprint.npy`, `voice/models/`, `voice/.session_id`.

Setup is handled by `skills/engineering/voice-setup.md`, not by hand-running these files directly — see `voice/README.md`.

Everything else in this repo is still markdown (architecture docs, skill specs) — `docs/modules/{module}.md` split-out is only needed if this file grows unwieldy as more code lands.
