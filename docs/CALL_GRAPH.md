# Call Graph

## `voice/` module

Introduced in `b096e38`. First real call graph in this repo — everything else is still the skill-to-skill handoff map below.

`listen.py` (`main`) is the entry point and orchestrates the rest in a loop:

```
listen.main
  -> common.load_config / common.resolve
  -> wake.WakeWordDetector.wait_for_wake        (blocks until wake word)
  -> capture.record_utterance                    (blocks until trailing silence)
  -> verify.embed_audio -> verify.is_match        (speaker gate)
       - reject -> logger.log_rejection -> loop back to wait_for_wake
  -> stt.transcribe                               (faster-whisper)
  -> bridge.ask_claude                            (headless `claude -p`, resumes .session_id)
  -> logger.log_turn
  -> tts.speak -> tts.strip_markdown              (Piper)
```

`enroll.py` (`main`, run standalone/interactively, not part of the `listen.py` loop) calls `verify.embed_audio` directly to build `voiceprint.npy`, which `verify.load_voiceprint` later loads at `listen.py` startup.

`common.load_config` / `common.resolve` are called by every other module in `voice/` to read `voice/config.yaml`.

## Skill-to-skill handoff map

The closest call-graph analog for the rest of the repo (no other executable code exists yet) is `SKILLS_ARCHITECTURE.md` → "Handoff map", which documents which skills call/feed into which others.
