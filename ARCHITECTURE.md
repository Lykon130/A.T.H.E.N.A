# A.T.H.E.N.A

**Autonomous Tactical Hub for Execution, Networking & Analysis**

- **Autonomous** — skills run themselves once wired; you don't drive each tool by hand.
- **Tactical** — the strategy/planning layer (Athena: goddess of strategic warfare, not just knowledge).
- **Hub** — one HUD, one command center, no tabs.
- **Execution** — Claude Code, the engine that actually does the work.
- **Networking** — the Obsidian vault: a graph of linked notes, not a flat file dump.
- **Analysis** — department-level dashboards that turn raw activity into numbers you can act on.

This merges four references into one build: the original JARVIS OS 4-part plan, the "Optimal Engine" brain-store/Conductor demo, the "AI Headquarters" department-dashboard concept, and sagar_builds' "Ultron" edge/gesture build.

---

## The merged architecture

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
         domain           raw/wiki/        from vault
                          outputs
```

**Claude Code = the engine and the Conductor.** You don't need to build a separate router — Claude Code's own skill-triggering IS the Conductor from the Optimal Engine demo. A skill's `description` field is what lets Claude Code pick the right one, the same way their Conductor picked a department.

**Departments = skill groups, not separate agents.** The AI HQ video pitches each department (Strategy, Sales, Finance, Support, Engineering, Data) as an independent AI worker with its own dashboard. For a one-person build, that's over-engineered — you don't need eight agents, you need eight *folders of skills* under one engine, each producing output that lands in the matching vault section. Same mental model, one tenth the complexity.

**Vault = the brain-store.** Optimal Engine's "dump into the brain, text/voice/drag/upload" is exactly what the Obsidian vault + Local REST API/MCP wiring already gives you (see build guide, Step 2) — you get this for free, no separate graph database to build.

**Skill maturity ladder.** Optimal Engine's skill cards carry a stage: human-led → human-assisted → fully autonomous. Worth stealing directly — tag every `SKILL.md` with a `stage` so you always know which skills you still need to supervise.

**Vault hygiene as its own skill.** Their "audit brain-store markdown health" skill (link-checker, orphan-finder, frontmatter-linter) is a real gap in the original JARVIS plan — add it as `skills/vault/vault-health.md`.

**HUD layout.** The AI HQ dashboards (per-department metrics, a CEO Command Center rolling everything up) are a good visual model for the JARVIS "one screen" HUD — a top-level overview panel with drill-into-department views, instead of one flat dashboard.

**Voice — two tracks, not one.** Keep the DIY local pipeline (faster-whisper + Piper, push-to-talk) as the default, since it works identically on your Windows and Fedora machines. Ultron's build is a second, more ambitious track worth knowing about, not a replacement:
- Runs on a **Jetson Nano** — a small dedicated edge box instead of the same laptop doing everything. Optional upgrade path, not a requirement.
- **Hand-gesture control** in front of the monitor (webcam + hand-tracking) as an alternative input to push-to-talk.
- **Phone-call-style interface** — you call a contact named "Ultron" and talk to it like a phone call, instead of a hotkey. Interesting UX, but adds a telephony layer (e.g. Twilio) you don't need for v1.

Treat Jetson/gesture/call-UI as a v2 experiment after the core loop (skills → vault → voice → HUD) is working end to end.

---

## Department → skill map

The live, authoritative table is `vault/wiki/org-chart.md` — it changes often enough (12 skills added in one pass covering personal ops, solo business, content, and investing) that keeping a second copy here would just go stale. Check there for the current department → skill → maturity-stage list.

Standing rule, unchanged: only build department folders you'll actually use. Engineering, Data, and HR remain empty stubs on purpose — no real workflow behind them yet.

Every Finance and Sales/Support skill that touches drafting or execution carries the same two hard lines: (1) Finance skills research, score, track, and alert only — nothing places or executes a trade; (2) `draft-outreach` and `client-response` draft only — sending anything on your behalf needs your explicit go-ahead each time, not a standing permission.

---

## Engine budget — staying inside Claude Pro

Claude Code is included in the Claude Pro subscription ($20/mo) — Claude.ai chat, Claude Code, and Cowork all draw from one shared usage pool (a 5-hour rolling window plus a weekly cap). No separate API bill as long as usage stays inside the plan.

The risk isn't Claude Code itself, it's *always-on* design. Skills that poll continuously or dashboards that auto-refresh every few seconds will burn the shared pool fast — that's the AI HQ video's model (eight standing agents), and it doesn't fit a Pro-plan personal build.

The rule going forward: **Claude only gets called for the reasoning/synthesis step.** Anything mechanical — pulling numbers, scanning a market, checking a feed, polling for changes — is a plain script or scheduled task, not a skill invocation. A skill calls Claude to interpret, summarize, or decide; it doesn't call Claude to fetch or loop. This keeps every department's skills trigger-based, matching the design already in place (skills run on request, not as standing agents), and keeps the whole build free beyond the subscription you're already paying for.

If a specific workflow later needs true always-on monitoring, that's a candidate for a local model (the original JARVIS OS plan's "runs on any local model" swap-out) rather than spending shared Claude Pro capacity on it — a bridge to cross only if it comes up.

---

## Build order (updated)

1. Obsidian + Local REST API/MCP plugin, vault folders, Syncthing between Windows and Fedora. *(unchanged from the original guide)*
2. Write the `vault-write` and `vault-health` skills first — every department skill depends on them.
3. Pick 1–2 departments you'd actually use tomorrow (Operations/`inbox` and Finance/`metrics` are good first picks) and build those skills end to end.
4. Wire voice: local faster-whisper + Piper push-to-talk, or native Claude Code `/voice` if you have it.
5. Prompt Claude Code to build the HUD: overview panel + drill-into-department views, reading live from the vault.
6. Only after the loop works: consider the Ultron-style v2 (edge box, gesture, call UI).
