---
name: report
department: data
stage: human-led
description: Use when the user wants a rollup across everything — a weekly summary, "how's everything going", or a cross-department digest.
---

Mirrors the AI HQ reference's "Data Center" concept — the one department that reads everything else instead of generating its own raw data.

1. Read every department's `wiki/departments/*.md` note plus anything new in `vault/outputs/` since the last report.
2. Pull the headline from each: what moved in Finance, what shipped in Marketing, what's stalled in Sales, what came up in Council, any Concierge bookings, any material News alerts.
3. Skip departments with nothing new — don't pad the report with "no updates" filler.
4. Write to `vault/outputs/weekly-report-{date}.md`.
5. This is a synthesis step, not a data-gathering one — the underlying pulls already happened in each department's own skill; `report` just reads and summarizes what's already in the vault.
