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

## `hud/` — desktop HUD

Introduced in `87c5d77`. Electron + React + TypeScript app, closes `ARCHITECTURE.md` build-order step 6. Reads live from the Obsidian vault via the Local REST API plugin — the same credentials Claude Code's own MCP connection uses (`.mcp.json` at repo root).

**Main process**

| File | Purpose |
|---|---|
| `src/main/index.ts` | Creates the `BrowserWindow`, pushes an initial vault snapshot on `did-finish-load`, then polls every 30s (`POLL_INTERVAL_MS`) via `pushSnapshot`, sending `vault:update` over IPC. Listens for a `vault:refresh` IPC message to trigger an immediate out-of-cycle poll. |
| `src/main/vaultClient.ts` | `getVaultSnapshot` — the only export. `loadRestConfig` reads `.mcp.json`'s `mcpServers.obsidian` block for the REST base URL + bearer token. `parseOrgChart` turns `wiki/org-chart.md`'s markdown table into a `department -> {skills, stage}` map. `listFilesRecursive` walks `raw/<department>/` and `outputs/<department>/` (depth-limited via `MAX_RECURSE_DEPTH`). `parseActivityFromFile` recognizes voice-session-style transcripts (`### HH:MM:SS` headers, `**You:**`/`**Athena:**` turns) and turns them into timestamped `ActivityEntry` objects; anything else falls back to a filename-level "updated" entry. `buildDepartmentSnapshot` assembles one `DepartmentSnapshot` per department id in `DEPARTMENT_LABELS`. On any failure (Obsidian not running, plugin disabled), returns `{connected: false, error, departments: []}` instead of throwing. |
| `src/preload/index.ts` | `contextBridge.exposeInMainWorld('athena', ...)` — exposes `onVaultUpdate` (subscribes to `vault:update`, returns an unsubscribe fn) and `refresh` (sends `vault:refresh`) to the renderer as `window.athena`. |

**Renderer** (`src/renderer/src/`)

| File | Purpose |
|---|---|
| `App.tsx` | Top-level state: current `VaultSnapshot`, `showOrbit`/`selectedId` (which view is showing), command-bar open state, and `flash`/`speaking` for idle-view effects. `runAction` dispatches a parsed `Action` (see `commands.ts`) — `show-department` while idle first triggers a `flash` on that department's zone, then navigates after `FLASH_TO_NAV_DELAY_MS`. Ctrl+K toggles the command bar; Escape steps back one level (`stepBack`). |
| `components/NeuralIdle.tsx` | Canvas-rendered idle view: a 4-layer Fibonacci-sphere node mesh (`LAYERS`, core densest) connected by k-NN intra-layer edges (`nearestNeighborEdges`) and inner-to-outer bridge edges (`bridgeEdges`), plus a few random long-range edges, all built once by `buildMesh`. The render loop (`step`, driven by `requestAnimationFrame`) rotates the mesh (slow Y spin + irrational-period X wobble), pulses a "breath" glow, maps each department to a zone of nodes via nearest Fibonacci anchor (`maybeRebuildZones`), and layers in three additive effects: a steady glow on zones with real vault activity, a one-shot `flash` boost when a department is opened by command, and a `speaking`-driven radial wave sweep (currently a synthetic multi-sine envelope, `speakingEnvelope` — real voice amplitude wiring deferred). Traveling "spark" particles animate along random edges continuously. |
| `components/CommandBar.tsx` | Ctrl+K overlay: a single text input that calls `parseCommand` on Enter and dispatches the resulting `Action`, or shows a "no match" hint. |
| `lib/commands.ts` | `parseCommand(input, departments)` — pure function mapping free text to an `Action` (`show-departments`, `show-department`, `go-idle`, `speak-test`). Matches fixed word sets first, then strips a leading `show/open/go to` and does exact-then-partial matching against department id/name. Kept standalone and pure specifically so a future voice-command path can reuse it unchanged. |
| `components/OverviewOrbit.tsx` | Department-orbit view: nodes placed radially (`nodePosition`) around a central `A.T.H.E.N.A` hub; a department pulses (`orbit-node-active`) if it has recent activity and isn't `not built`. Clicking a node calls `onSelect`. |
| `components/DepartmentDetail.tsx` | Drill-in view: renders `DepartmentHeader` plus one of four archetype panels, chosen by `getArchetype` (`lib/departmentArchetypes.ts`) — `MetricsPanel`, `FeedLogPanel`, `PipelinePanel`, or `ReferencePanel` — rather than one generic template, because each department surfaces data differently (metrics/charts vs. a chronological log vs. pipeline stages vs. static reference cards). |
| `components/detail/MetricsPanel.tsx` | Metric tiles (`MetricTile`) plus hoverable SVG line/area charts (`MetricChart`, dataviz-skill-guided) for any metric with a `series`. Renders an explicit empty state ("no metrics yet") rather than fabricating numbers — metrics only appear once a department's skills actually produce them. |
| `components/detail/FeedLogPanel.tsx`, `PipelinePanel.tsx`, `ReferencePanel.tsx` | Skills list + vault footprint (raw/output file counts) + either a chronological log, a numbered pipeline-stage track, or a static reference-card grid, depending on archetype. All three render an explicit empty state when there's no data yet. |
| `lib/departmentArchetypes.ts` | `getArchetype(id)` — static lookup table assigning each department id one of `metrics \| feed \| pipeline \| reference`; defaults to `reference` for any unmapped id. |
| `shared/types.ts` | Shared types crossing the main/renderer boundary: `VaultSnapshot`, `DepartmentSnapshot`, `ActivityEntry`, `Metric`/`MetricPoint`, and the `AthenaBridge` interface `window.athena` implements. |

Setup/run/build instructions live in `hud/README.md`, not duplicated here.

Everything else in this repo is still markdown (architecture docs, skill specs) — `docs/modules/{module}.md` split-out is only needed if this file grows unwieldy as more code lands.
