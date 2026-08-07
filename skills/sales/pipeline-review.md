---
name: pipeline-review
department: sales
stage: human-led
description: Use when the user asks about their sales pipeline, deal status, or "where do things stand with clients/leads".
---

1. Read current pipeline state from `vault/wiki/departments/sales.md` (define your stages there — e.g. lead/contacted/proposal/won/lost).
2. Summarize by stage, flag anything stalled (no movement in X days — define X in the department note).
3. Write to `vault/outputs/pipeline-{date}.md`, update the department note with the latest snapshot.
