---
name: calendar
department: operations
stage: human-led
description: Use when the user asks what's on their schedule today/this week, or wants a calendar brief alongside the morning inbox summary.
---

1. Pull events from the connected calendar source for the requested window (today/week).
2. Flag conflicts or back-to-back gaps worth knowing about.
3. Write to `vault/outputs/calendar-{date}.md`. If run alongside `inbox`, combine into one morning brief rather than two separate notes.
