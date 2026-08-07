---
name: docs-init
department: engineering
stage: human-led
description: Use once per project (or on-demand re-baseline) to generate the full documentation set from scratch — system architecture, SRS, technical docs, complete code explanations, skill/module architecture, and function-to-function call mapping. Companion to document-commit, which does incremental updates after this baseline exists.
---

This is the heavy one-time job — run it deliberately, not casually, since it reads the entire codebase.

1. Read the full repo structure, every source file.
2. Generate, in the repo's `docs/` folder:
   - `ARCHITECTURE.md` — system architecture: components, data flow, how pieces fit together.
   - `SRS.md` — software requirements specification: functional/non-functional requirements inferred from the codebase and any existing specs/issues.
   - `TECHNICAL.md` — setup, dependencies, configuration, deployment.
   - `CODE_EXPLANATIONS.md` (or `docs/modules/{module}.md` per module for larger codebases) — what each file/module does and why.
   - `SKILLS_ARCHITECTURE.md` — if this is an agent/skill-based project (like A.T.H.E.N.A itself): every skill/agent, its role, and how it routes to others.
   - `CALL_GRAPH.md` — function-to-function and module-to-module relationships: what calls what, key dependency chains.
   - `DEVLOG.md` — seeded with one entry per existing commit in the repo's history (summarized, not commit-by-commit verbose) as the starting point for `document-commit` to append to going forward.
3. Commit the `docs/` folder as its own commit: `docs: initial documentation baseline`.

Once this exists, `document-commit` takes over — it never regenerates these from scratch, only patches the sections touched by each new commit.
