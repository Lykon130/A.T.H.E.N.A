---
name: portfolio-track
department: finance
stage: human-led
description: Use when the user asks for their portfolio/holdings snapshot, current positions, or overall investment performance.
---

1. Pull current holdings and values from the source(s) defined in `vault/wiki/departments/finance.md`.
2. Compare to the last snapshot — note deltas by position and overall.
3. Write to `vault/raw/portfolio/{date}.md`, update the running summary in the department note.
4. Tracking only — same hard boundary as `research-score` and `news-monitor`: no trade execution, ever.
