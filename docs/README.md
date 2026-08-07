# Documentation Index

This `docs/` folder is the output of `docs-init` (baseline) and `document-commit` (incremental updates going forward). It documents A.T.H.E.N.A itself — the project this repo *is*, as opposed to output the skills produce for the user.

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — system architecture and design rationale. Predates `docs-init`; kept at repo root rather than moved, since everything else already links to it there.
- [`SRS.md`](SRS.md) — requirements, functional and non-functional, as they've actually been decided through development.
- [`TECHNICAL.md`](TECHNICAL.md) — setup, conventions, folder structure, what's wired vs. not yet.
- [`SKILLS_ARCHITECTURE.md`](SKILLS_ARCHITECTURE.md) — every skill, what department it belongs to, how routing works, the maturity ladder.
- [`CODE_EXPLANATIONS.md`](CODE_EXPLANATIONS.md) — currently a stub. There's no executable code in this repo yet (no MCP wiring, no voice pipeline scripts, no HUD) — only architecture docs and skill specifications in markdown. This fills in once real code exists.
- [`CALL_GRAPH.md`](CALL_GRAPH.md) — same story as above: function/module call graphs aren't applicable yet. The closest current analog is the skill-to-skill handoff map in `SKILLS_ARCHITECTURE.md`.
- [`DEVLOG.md`](DEVLOG.md) — chronological development history, seeded from the full build conversation (not just git commits — most of this project's history predates git being wired in).

Maintained by `skills/engineering/document-commit.md` on every commit once its git hook is installed (see `TECHNICAL.md` → Git hooks).
