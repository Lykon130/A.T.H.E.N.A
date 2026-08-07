---
name: dev-digest
department: engineering
stage: human-led
description: Use when the user asks what's happening in their repos — recent commits, open PRs/issues, CI/build status.
---

1. Pull recent activity (commits, open PRs, open issues, latest CI/build status) for the repos listed in `vault/wiki/departments/engineering.md`, via the GitHub/GitLab API — a plain API call, not a reasoning step.
2. Summarize: what shipped, what's open and stale, anything red (failing build/check).
3. Write to `vault/outputs/dev-digest-{date}.md`.
4. This is read-only reporting — it never pushes, merges, comments, or modifies anything in a repo.
