---
name: review-contract
department: legal
stage: human-led
description: Use when the user wants a contract, agreement, or terms document reviewed for risky or unusual clauses before signing.
---

1. Read the document.
2. Flag clauses worth a second look: auto-renewal, unlimited liability, unusually long notice periods, IP assignment scope, non-competes, exclusivity, indemnification.
3. Summarize each flag in plain language — what it means, why it's worth attention.
4. Write to `vault/outputs/contract-review-{name}-{date}.md`.
5. **This is not legal advice.** It's a first-pass flag list to help the user know what to ask about — anything material should go to an actual lawyer before signing. Say so explicitly in the output.
