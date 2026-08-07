# Skills Architecture

## Routing — there is no separate router

Claude Code itself is the Conductor. Each skill's `description` frontmatter field is what Claude Code matches a request against to decide which skill to invoke — there's no additional routing layer to build or maintain. This was a deliberate simplification versus the "Optimal Engine" reference, which used an explicit Conductor agent routing to department sub-agents; here, one engine (Claude Code) plus well-written `description` fields does the same job with a tenth of the complexity.

## Departments are skill groups, not agents

Each department in `vault/wiki/org-chart.md` is a folder of related skills (`skills/<department>/`), not a standing autonomous worker. A department "exists" the moment it has one real skill; it stays an empty stub (just a `vault/wiki/departments/<name>.md` note) until there's an actual workflow to automate. This is why Engineering, Health, and Concierge only got built once specific triggers came up (active GitHub repos, a wearable, a booking request) rather than upfront.

## Full skill inventory

See `vault/wiki/org-chart.md` for the live, authoritative table — department, skill list, and maturity stage. As of this baseline: 13 departments (11 active, 2 intentionally empty — Home/Environment and HR), 23+ skills.

## Cross-cutting skills

Three skills aren't owned by any one department and are meant to be called from anywhere:

- **`vault-write`** / **`vault-health`** (`skills/vault/`) — the read/write interface to the Obsidian vault, and a hygiene auditor (link-checking, orphan-finding, frontmatter-linting) borrowed from the "Optimal Engine" reference's brain-store health skill.
- **`remember`** (`skills/vault/remember.md`) — maintains `vault/wiki/profile.md`, the persistent user-profile note every other skill should read for personalization context.
- **`council`** (`skills/council/council.md`) — structured multi-perspective deliberation (Logic/Strategy/First Principles/Ethics/Systems/Risk lenses, challenge-then-synthesize), borrowed from the "Council of High Intelligence" reference. Originally scoped to Strategy as `deliberate`, generalized to cross-cutting because a big Finance call or a Legal signature deserves the same rigor as a strategic one.
- **`digest`** (`skills/vault/digest.md`) — proactive flagging, distinct from `data/report`'s full weekly rollup.

## Skill maturity ladder

Every skill carries a `stage`:

1. **human-led** — the user triggers it, reviews everything it produces.
2. **human-assisted** — runs on its own, flags things for the user rather than waiting to be asked.
3. **fully-autonomous** — runs and acts without review.

Borrowed directly from the "Optimal Engine" reference's skill cards. No skill starts above human-led without a deliberate decision to promote it, tracked in `org-chart.md`.

## Handoff map (skill-to-skill, the closest thing to a call graph this project has)

- `marketing/research` → `marketing/hooks` → `marketing/scripts` → (external: recording/design) → `marketing/analyze` → feeds back into `research`.
- `finance/research-score` is called per-ticker by `finance/watchlist-scan` for a full-watchlist rollup.
- `finance/news-monitor` cross-references tickers and, when something material comes up, hands off to `research-score` for a deeper look.
- `news/global-scan` flags anything relevant to the Finance watchlist for `news-monitor` to pick up, rather than duplicating ticker-specific monitoring.
- `data/report` reads every other department's `wiki/departments/*.md` and recent `vault/outputs/` — it generates no raw data of its own.
- `operations/inbox` and `operations/calendar` combine into one morning brief when run together.
- `engineering/docs-init` (one-time baseline) precedes `engineering/document-commit` (incremental, diff-scoped updates) — the latter assumes the former has already run.
- Every skill that drafts something user-facing (`sales/draft-outreach`, `support/client-response`, `concierge/book-appointment`, `concierge/plan-travel`) checks `vault/wiki/profile.md` first, maintained by `remember`.

## Hard boundaries by design (not gaps to close)

- Finance department: research/score/track/alert only, never trade execution.
- `draft-outreach`, `client-response`: draft only, never send.
- `book-appointment`, `plan-travel`: research/draft only; submitting/paying needs explicit per-instance confirmation, every time.
- `review-contract`: flags risk, explicitly not legal advice.
- Home/Environment (if ever built out): monitoring only; lock/arm/disarm stays manual regardless of integration.
