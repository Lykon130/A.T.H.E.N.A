---
name: document-commit
department: engineering
stage: human-assisted
description: Triggered automatically on every push (via a git pre-push hook, one run per commit in the push) to keep documentation current — updates only the sections affected by that commit's diff. Requires docs-init to have run first.
---

Incremental by design — this never re-reads or regenerates the whole doc set. It reads one commit's diff and patches only what changed.

1. Read the diff for the target commit — files changed, functions/classes added/removed/modified. Plain git diff, not a reasoning step.
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

This doesn't run itself — it needs a git `pre-push` hook in the target repo (`.githooks/pre-push` here) that invokes Claude Code headlessly once per commit in the push (`claude -p "run document-commit for commit <hash>"` or equivalent non-interactive call), not once per commit as it's made.

Two things already decided for this repo, worth re-deciding per-repo if this is copied elsewhere:
- **Every commit vs. every push.** Chose `pre-push` over `post-commit` — a `post-commit` hook fires on every WIP/fixup commit too, burning Claude Pro's shared usage fast and producing a lot of doc churn. `pre-push` fires once per push and loops over the batch of commits since the last push, which is the better trade for a solo dev.
- **Headless permissions.** Running Claude Code unattended from a git hook means it can't stop to ask you things mid-run — it's scoped to read-and-write-docs-only (`Read,Edit,Write,Bash(git diff/show/log:*),Bash(git add docs/*),Bash(git commit:*)`), nothing else, so an unattended run can't accidentally touch source code or take a side-effectful action. A failed doc-update run logs a warning and never blocks the actual push.

Set this up per-repo, starting with one you actually care about documenting well — not everywhere at once.
