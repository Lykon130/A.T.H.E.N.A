# A.T.H.E.N.A

**Autonomous Tactical Hub for Execution, Networking & Analysis**

- **Autonomous** — skills run themselves once wired; you don't drive each tool by hand.
- **Tactical** — the strategy/planning layer (Athena: goddess of strategic warfare, not just knowledge).
- **Hub** — one HUD, one command center, no tabs.
- **Execution** — Claude Code, the engine that actually does the work.
- **Networking** — the Obsidian vault: a graph of linked notes, not a flat file dump.
- **Analysis** — department-level dashboards that turn raw activity into numbers you can act on.

## References merged into this build

- **JARVIS OS** (original 4-part plan) — Claude Code engine, Obsidian memory, local voice, HUD.
- **"Optimal Engine"** — brain-store knowledge graph, Conductor routing, skill maturity ladder (human-led → human-assisted → fully autonomous).
- **"AI Headquarters"** — department-dashboard concept, CEO Command Center rollup.
- **sagar_builds' "Ultron"** — edge compute (Jetson Nano), gesture control, phone-call-style voice UI. Flagged as a v2 experiment, not adopted for v1.
- **"Council of High Intelligence"** — structured multi-perspective deliberation, now the cross-cutting `council` skill.
- **"AI Content Team OS"** — the research → hooks → scripts → analyze content pipeline, now the Marketing department.
- **"One Claude, 11 Departments, 92 Skills"** — an official skill-taxonomy reference; borrowed naming conventions, not the literal skill set.
- **AI trading/investing loop references** — informed `research-score`, `news-monitor`, `watchlist-scan`, all under a hard no-execution boundary.

---

## The architecture

```
                     ┌─────────────┐
        speak/type → │ Claude Code │ → Conductor: routes to the right skill
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         Departments    Vault (memory)   HUD (face)
         = skills/      = Obsidian       = one screen,
         grouped by       graph vault,     pulls live
         domain,          raw/wiki/        from vault
         + cross-cutting  outputs
         skills callable
         from any of them
```

**Claude Code = the engine and the Conductor.** No separate router — Claude Code's own skill-triggering IS the Conductor. A skill's `description` field is what lets Claude Code pick the right one.

**Departments = skill groups, not separate agents.** Not eight independent AI workers with their own dashboards (the AI HQ model) — folders of skills under one engine, each producing output that lands in the matching vault section.

**Cross-cutting skills** aren't owned by any department, callable from all of them:
- `vault-write` / `vault-health` — the vault's read/write interface and hygiene auditor (link-checking, orphan-finding, frontmatter-linting).
- `remember` — maintains `vault/wiki/profile.md`, a persistent user profile every other skill reads for personalization (the "JARVIS knows Tony" piece).
- `council` — structured multi-lens deliberation (Logic/Strategy/First Principles/Ethics/Systems/Risk) for decisions big enough to earn it, in any department. Started Strategy-only as `deliberate`, generalized once it was clear a big Finance call or a Legal signature deserves the same rigor.
- `digest` — proactive flagging, distinct from Data's full weekly `report`.

**Vault = the brain-store.** Obsidian + Local REST API/MCP wiring gives you the "dump into the brain, text/voice/drag/upload" behavior for free — no separate graph database.

**Skill maturity ladder.** Every `SKILL.md` carries a `stage`: human-led → human-assisted → fully autonomous, tracked live in `org-chart.md`. No skill moves up the ladder by default.

**HUD layout.** Overview panel + drill-into-department views, not one flat dashboard — not yet built.

**Voice — two tracks.** DIY local pipeline (faster-whisper + Piper, push-to-talk) as the default, works identically on Windows and Fedora — not yet installed. Ultron's edge/gesture/call-UI approach stays a v2 experiment, only worth revisiting once the core loop works end to end.

---

## Department → skill map

Live, authoritative table: `vault/wiki/org-chart.md`. As of this update: **16 departments (14 with real skills, 2 intentionally empty — Home/Environment and Human Resources), 31 skills.**

Every department got built when a real trigger came up, not upfront — Engineering, Health, and Concierge, for example, only exist because specific needs (active repos, a wearable, a booking request) came up in conversation, not because the taxonomy called for them.

---

## Hard boundaries — permanent, not gaps to close

These don't loosen as skills mature up the ladder. They're where this build stops regardless of capability:

- **Finance** (`research-score`, `news-monitor`, `portfolio-track`, `watchlist-scan`, `metrics`): research, scoring, tracking, and alerting only. Nothing ever places or executes a trade.
- **Messaging** (`draft-outreach`, `client-response`): drafts only. Sending anything on your behalf needs explicit go-ahead for that specific instance, every time.
- **Concierge** (`book-appointment`, `plan-travel`): researches and drafts. Submitting a booking or payment needs explicit per-instance confirmation; never enters payment or ID details itself.
- **Legal** (`review-contract`): flags risk in plain language. Explicitly not legal advice — anything material still goes to an actual lawyer.
- **Home/Environment** (if ever built out beyond a stub): monitoring only. Lock/unlock, arm/disarm stays a manual action regardless of integration.
- **Engineering** (`dev-digest`): read-only reporting. Never pushes, merges, or comments in a repo. (`document-commit` is the one exception that writes — and it's scoped to `docs/` only, never source.)

---

## Documentation automation

`engineering/docs-init` (one-time full baseline: architecture, SRS, technical docs, code explanations, skill/module architecture, call graph, devlog) plus `engineering/document-commit` (incremental, diff-scoped updates on every commit, so it never re-reads or regenerates the whole doc set). First applied to A.T.H.E.N.A itself — see `docs/` in this repo. Requires a git hook (`.githooks/post-commit`, activated via `git config core.hooksPath .githooks`) and a local `claude` CLI login; runs headless with a scoped `--allowedTools` list rather than `--dangerously-skip-permissions`, since it's unattended.

---

## Engine budget — staying inside Claude Pro

Claude Code is included in the Claude Pro subscription ($20/mo) — Claude.ai chat, Claude Code, and Cowork share one usage pool (5-hour rolling window plus a weekly cap). No separate API bill as long as usage stays inside the plan.

The risk isn't Claude Code itself, it's *always-on* design — skills that poll continuously or dashboards that auto-refresh every few seconds burn the shared pool fast. The standing rule: **Claude only gets called for the reasoning/synthesis step.** Anything mechanical — pulling numbers, scanning a market, checking a feed, polling for changes — is a plain script, not a skill invocation. This is what let the skill count grow to 31 without changing the cost picture: every one of them is trigger-based, not a standing agent.

If a workflow later needs true always-on monitoring, that's a candidate for a local model (the original plan's "runs on any local model" swap-out), not spending shared Claude Pro capacity — cross that bridge only if it comes up.

---

## Repo status

Git-initialized with a remote: `github.com/Lykon130/A.T.H.E.N.A`. Two commits in: initial scaffold, then the Engineering docs skills. The documentation baseline (`docs/`, `.githooks/`) is written and staged, pending a commit from a real machine — a sandbox mount-bridge quirk left stale lock files that only exist in this session's cached view of the drive, not on disk; committing directly from Windows/Fedora sidesteps it.

---

## Build order — current state

1. ~~Define skills and departments~~ — done, 31 skills across 14 active departments, all reviewed against hard boundaries.
2. ~~Set up git~~ — done, remote connected.
3. ~~Apply documentation automation to this project~~ — content written, commit pending on your end (see Repo status).
4. **Obsidian + Local REST API/MCP plugin, vault folders, Syncthing between Windows and Fedora** — not started. This is the actual blocker: no skill can write anywhere real until this exists.
5. Wire voice: local faster-whisper + Piper push-to-talk, or native Claude Code `/voice` if available.
6. Prompt Claude Code to build the HUD: overview panel + drill-into-department views, reading live from the vault.
7. Activate the `document-commit` git hook for ongoing repos (this one, plus any tracked in Engineering).
8. Only after the loop works end to end: consider the Ultron-style v2 (edge box, gesture, call UI).

Step 4 has been the standing blocker since the first draft of this document — everything since has been design and skill definition, none of it executable yet.
