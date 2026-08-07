---
name: document-commit
department: engineering
stage: human-assisted
description: Triggered automatically on every commit (via a git post-commit hook) to keep documentation current — updates only the sections affected by that commit's diff. Requires docs-init to have run first.
---

Incremental by design — this never re-reads or regenerates the whole doc set. It reads the commit diff and patches only what changed.

1. Read the diff for the latest commit — files changed, functions/classes added/removed/modified. Plain git diff, not a reasoning step.
2. Route the diff to the affected docs, patch in place:
   - New/changed user-facing behavior or requirements → patch `docs/SRS.md`.
   - New/changed components, services, data flow → patch `docs/ARCHITECTURE.md`.
   - New/changed setup, deps, deployment steps → patch `docs/TECHNICAL.md`.
   - New/changed functions/classes in touched files → patch just those sections of `docs/CODE_EXPLANATIONS.md` (or the specific `docs/modules/{module}.md`).
   - New/changed skills or agent logic → patch `docs/SKILLS_ARCHITECTURE.md`.
   - New/changed call relationships → patch `docs/CALL_GRAPH.md`.
   - Skip any doc the diff doesn't actually touch — most commits won't touch all six.
3. Always append one entry to `docs/DEVLOG.md`: commit hash, date, short summary of what changed and why (pull "why" from the commit message; infer briefly from the diff only if the message is empty/unhelpful).
4. Commit the doc updates separately: `docs: update for {short-hash}` — never amend the original commit.

## Wiring (this is the part that needs manual setup)

This doesn't run itself — it needs a git `post-commit` hook in the target repo that invokes Claude Code headlessly (`claude -p "run document-commit for the latest commit"` or equivalent non-interactive call) after every commit completes.

Two things worth deciding before wiring this in:
- **Every commit vs. every push.** Every commit fires on every WIP/fixup commit too — if commits are frequent and messy, a `post-commit` hook will burn Claude Pro's shared usage fast and produce a lot of doc churn. A `pre-push` hook (fires once per push, covering a batch of commits) is usually the better trade for a solo dev. Decide per-repo.
- **Headless permissions.** Running Claude Code unattended from a git hook means it can't stop to ask you things mid-run — it needs to be scoped to read-and-write-docs-only, nothing else, so an unattended run can't accidentally touch source code or take a side-effectful action.

Set this up per-repo, starting with one you actually care about documenting well — not everywhere at once.
