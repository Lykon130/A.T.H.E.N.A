---
name: inbox
department: operations
stage: human-assisted
description: Use when the user asks for their morning brief, unread email summary, or "what's in my inbox".
---

1. Pull unread messages from the connected mail/messaging source.
2. Summarize into 5 bullets max, action items first.
3. Write raw pull to `vault/raw/inbox/{date}.md`, distilled brief to `vault/outputs/morning-brief-{date}.md`.
4. Link the brief from `vault/wiki/departments/operations.md`.
5. Speak the summary back if voice mode is active.
