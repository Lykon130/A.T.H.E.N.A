---
name: digest
department: cross-cutting
stage: human-assisted
description: Use when the user wants to know "what needs my attention" — pulls together every open flag across departments into one list. The "Sir, I think you should know..." skill.
---

Different from `report`: `report` is a full rollup, `digest` is just the things that actually need a decision or action from you right now.

1. Scan for open flags across the vault: unresolved `news-monitor` alerts, stalled entries from `pipeline-review`, unresolved `vault-health` issues, anything in `research-score`/`watchlist-scan` output flagged as high-conviction but not yet acted on, pending `book-appointment` confirmations.
2. Rank by how time-sensitive each one is.
3. Write a short, flat list — no department headers, no fluff — to `vault/outputs/digest-{date}.md`.
4. Good candidate to pair with `inbox`/`calendar` for the morning brief once this is running for real.
