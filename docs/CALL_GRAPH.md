# Call Graph

## `voice/` module

Introduced in `b096e38`. First real call graph in this repo.

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

## `hud/` module

Introduced in `87c5d77`.

Main process, on load and every 30s thereafter:

```
main/index.ts (pushSnapshot)
  -> vaultClient.getVaultSnapshot
       -> loadRestConfig                 (reads .mcp.json)
       -> parseOrgChart                  (wiki/org-chart.md -> department map)
       -> listFilesRecursive x2          (raw/<dept>/, outputs/<dept>/)
       -> parseActivityFromFile          (per file)
       -> buildDepartmentSnapshot        (per department)
  -> BrowserWindow.webContents.send('vault:update', snapshot)
```

`vault:refresh` (IPC, renderer -> main) triggers an out-of-cycle `pushSnapshot` the same way.

Preload (`preload/index.ts`) bridges main <-> renderer: exposes `window.athena.onVaultUpdate` (wraps the `vault:update` listener) and `window.athena.refresh` (sends `vault:refresh`) via `contextBridge`.

Renderer, on a user action:

```
CommandBar (Enter)
  -> commands.parseCommand(input, departments) -> Action
  -> App.runAction(action)
       -> show-department: NeuralIdle flash -> (delay) -> DepartmentDetail
       -> DepartmentDetail -> departmentArchetypes.getArchetype(id)
            -> MetricsPanel | FeedLogPanel | PipelinePanel | ReferencePanel
       -> show-departments -> OverviewOrbit -> (click) -> DepartmentDetail
```

`NeuralIdle`'s render loop (`step`, via `requestAnimationFrame`) runs independently of the above, reading `VaultSnapshot` (for zone activity) and `flash`/`speaking` state passed down from `App`.

## Skill-to-skill handoff map

The closest call-graph analog for the rest of the repo (markdown skill specs, no executable code) is `SKILLS_ARCHITECTURE.md` → "Handoff map", which documents which skills call/feed into which others.
