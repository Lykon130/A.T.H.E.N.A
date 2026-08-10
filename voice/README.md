# Voice module

Always-on local voice assistant for A.T.H.E.N.A: wake word ("Hey Athena") →
speaker verification (only responds to your enrolled voice) → speech-to-text
(faster-whisper) → Claude Code (headless, continuing one dedicated session) →
text-to-speech (Piper). Fully local — no audio leaves the machine, no cloud
accounts required.

Don't hand-run this module directly the first time — use the
`engineering/voice-setup` skill (`skills/engineering/voice-setup.md`) from
Claude Code, which installs dependencies, fetches models, and runs
enrollment for you. This README documents what that skill does and how to
run things manually afterward.

## How it works

1. `listen.py` streams the mic continuously through `wake.py` (openWakeWord).
   Nothing is recorded or sent anywhere until the wake word fires.
2. On trigger, `capture.py` records until you stop talking (VAD-based
   trailing-silence detection, `webrtcvad`).
3. `verify.py` embeds the utterance (SpeechBrain's ECAPA-TDNN,
   `spkrec-ecapa-voxceleb` — a model purpose-built for speaker verification)
   and compares it against your enrolled voiceprint (`voiceprint.npy`, built
   once by `enroll.py`). Anything below the similarity threshold is silently
   dropped — no transcription, no Claude call, no spoken reply. Only a
   timestamped rejection event is logged (no audio or text content). An
   earlier version used resemblyzer's GE2E encoder here; it produced a real
   false accept in testing (a different voice scored 0.82 similarity against
   the enrolled voiceprint, above the 0.78 threshold at the time) — GE2E is
   designed for voice-cloning conditioning, not telling two people apart.
4. Verified audio goes to `stt.py` (faster-whisper, CPU by default) for
   transcription.
5. `bridge.py` sends the text to Claude Code headlessly (`claude -p`),
   resuming a dedicated session (`.session_id`, separate from any
   interactive terminal session you might have open) so voice turns keep
   context across the conversation.
6. The reply is logged to `vault/raw/engineering/voice-sessions/<date>.md`
   and spoken aloud via `tts.py` (Piper).

## Setup

Run the `voice-setup` skill once. It will:

- `pip install -r voice/requirements.txt`
- Download a faster-whisper model (auto, on first transcription)
- Download a Piper English voice model into `voice/models/`
- Attempt to train (or fall back to a pre-trained) openWakeWord model for
  "Hey Athena" into `voice/models/`
- Run `python voice/enroll.py` interactively to build your voiceprint
- Write `voice/config.yaml` from `voice/config.example.yaml`

### Windows

- Requires a working microphone/speaker recognized by `sounddevice`
  (PortAudio ships with the `sounddevice` wheel — no extra install needed).
- Run everything from a regular terminal (PowerShell or Git Bash) with the
  repo's Python environment active.

### Fedora

- `sounddevice` needs PortAudio's system library: `sudo dnf install
  portaudio portaudio-devel` before `pip install sounddevice`.
- If running under Wayland, audio capture via PortAudio/ALSA/PulseAudio
  still works normally — this module never relies on global-hotkey/input
  injection (which is what Wayland restricts), only audio I/O, so there's
  no platform-specific activation path to maintain.
- Same `voice-setup` skill applies; same `voice/config.yaml` shape.

## Running

```
python voice/listen.py
```

Say the wake word, then your command. Ctrl+C to stop the process — that's
the only way to stop it; there is no keypress-based mute in this module by
design (activation is voice-only, per the security requirement it's meant
to satisfy).

## Files kept out of git

`voice/models/`, `voice/voiceprint.npy`, `voice/config.yaml`, and
`voice/.session_id` are all gitignored — they're local device/model/session
state, and the voiceprint is biometric data that should never be committed.
