# Engineering

Skills: `dev-digest`, `docs-init`, `document-commit`.

**Repos tracked:** *(fill in — owner/repo on GitHub/GitLab)*
**Platform:** *(GitHub or GitLab — affects which API `dev-digest` calls)*

**Documentation automation:** `docs-init` builds the full baseline (architecture, SRS, technical docs, code explanations, skill/module architecture, call graph, devlog) once per repo. `document-commit` then patches only what each commit's diff actually touches — needs a git hook wired per-repo (post-commit or pre-push, see the skill for the trade-off), and start with one real repo before rolling it out everywhere.
