# Software Requirements Specification — A.T.H.E.N.A

Reconstructed from decisions made through development, not written upfront. Update this alongside `document-commit` whenever a decision changes what's required.

## 1. Purpose

A.T.H.E.N.A (Autonomous Tactical Hub for Execution, Networking & Analysis) is a personal AI operating system built on Claude Code (engine/router), an Obsidian vault (memory), a local voice pipeline (interface), and a HUD (display) — organized into departments of small, single-purpose skills rather than standing autonomous agents.

## 2. Scope

In scope: personal operations, a solo business/freelance workflow, content creation, and investing/trading *research* (not execution). Out of scope by design: multi-employee HR (no employees), full smart-home control (no qualifying platform connected), and anything requiring standing always-on agents.

## 3. Functional Requirements

| ID | Requirement | Implemented as |
|---|---|---|
| FR-1 | Route user requests to the right skill without a separate router | Claude Code's native skill-triggering (`description` field matching) |
| FR-2 | Persist all memory as linked, human-readable notes, not a database | Obsidian vault, `raw/wiki/outputs` structure |
| FR-3 | Provide a morning brief (inbox + calendar) | `operations/inbox`, `operations/calendar` |
| FR-4 | Track and summarize financial metrics, research investments, monitor watchlist news | `finance/metrics`, `research-score`, `news-monitor`, `portfolio-track`, `watchlist-scan` |
| FR-5 | Provide global and watchlist-specific news awareness | `news/global-scan` (GDELT), `finance/news-monitor` (Finnhub) |
| FR-6 | Support structured multi-perspective deliberation for high-stakes decisions | `council/council` (cross-cutting) |
| FR-7 | Maintain a persistent user profile (preferences, people, dates, style) | `vault/remember`, `vault/wiki/profile.md` |
| FR-8 | Draft (not send) outreach and client responses | `sales/draft-outreach`, `support/client-response` |
| FR-9 | Flag risk in contracts before signing (not legal advice) | `legal/review-contract` |
| FR-10 | Research, draft, and — only with explicit per-instance confirmation — book appointments and travel | `concierge/book-appointment`, `concierge/plan-travel` |
| FR-11 | Run a content pipeline: research → hooks → scripts → analyze | `marketing/*` |
| FR-12 | Produce a cross-department weekly rollup and a proactive digest | `data/report`, `vault/digest` |
| FR-13 | Track health metrics via manual logging | `health/log-health` |
| FR-14 | Report on tracked repos (commits, PRs, CI status), read-only | `engineering/dev-digest` |
| FR-15 | Generate and incrementally maintain project documentation on every commit | `engineering/docs-init`, `engineering/document-commit` |
| FR-16 | Voice interface, local-first | `voice/` module: openWakeWord wake word + SpeechBrain ECAPA-TDNN speaker verification + faster-whisper STT + Piper TTS, bridged to headless `claude -p` |
| FR-17 | Single-screen HUD showing vitals, schedule, and department drill-ins | Built: `hud/` (Electron + React), idle neural-mesh view, Ctrl+K command palette, archetype-based department detail views (metrics/feed/pipeline/reference), polling the vault via the Obsidian Local REST API |

## 4. Non-Functional Requirements

| ID | Requirement | Rationale |
|---|---|---|
| NFR-1 | Must run inside the Claude Pro subscription's shared usage pool — no required additional API spend | User constraint: "I want to be able to use it for free" |
| NFR-2 | Claude is only invoked for reasoning/synthesis; mechanical work (data pulls, polling, scanning) is a plain script | Keeps NFR-1 true even as skill count grows |
| NFR-3 | Cross-platform: must work identically on Windows and Fedora | User runs two machines |
| NFR-4 | Voice audio never leaves the local machine (when using the DIY pipeline) | Privacy — no cloud STT/TTS in that path; confirmed by build (`voice/` module is fully local end to end) |
| NFR-5 | Data sources must be free or free-tier for personal use | GDELT (unlimited, free), Finnhub (free tier, personal use) |
| NFR-6 | Vault stays in sync across both machines | Syncthing, installed and connected |

## 5. Hard Constraints (non-negotiable, not configuration options)

- No skill ever places, executes, or recommends executing a financial trade. Research, scoring, tracking, and alerting only (Finance department).
- No skill sends a message, email, or reply on the user's behalf without explicit confirmation for that specific instance.
- No skill submits a booking, form, or payment without explicit confirmation for that specific instance; payment/ID credentials are never entered by a skill.
- `review-contract` output is explicitly labeled as not legal advice.
- No skill modifies security settings or home lock/arm state, regardless of what home-automation integration might exist in the future.

## 6. Open Requirements (not yet resolved)

- Wire real voice activity into the HUD's idle view — the speaking-reactive wave sweep currently uses a synthetic envelope, not live audio from `voice/` (see FR-17).
- HUD metrics remain honest empty states until a department's skills actually produce time-series data — no fabricated numbers.
- Custom "Hey Athena" wake-word training (GPU-oriented, deferred; `hey_jarvis` used as an interim wake word — see FR-16).
- Fedora-side live testing of the voice module (built and tested end-to-end on Windows only so far).
