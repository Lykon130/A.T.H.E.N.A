---
name: research-score
department: finance
stage: human-led
description: Use when the user wants to research or score an investment/company/opportunity against a defined framework. Research and scoring only — never places, executes, or recommends executing a trade.
---

Modeled on the "AI Investing" reference loop (screen → filter → score), scoped down to research only.

1. **Screen** — given a universe or a specific target, gather the relevant facts (financials, growth, competitive position — whatever's defined in `vault/wiki/departments/finance.md`).
2. **Filter** — flag anything that doesn't meet baseline criteria, note why.
3. **Score** — rate against a fixed framework (define the categories and weights once in `vault/wiki/departments/finance.md`, reuse every time — consistency matters more than the specific weights).
4. Write the research and score to `vault/outputs/research-{target}-{date}.md`. Never place an order, submit a trade, or take any executable action — this skill produces a written recommendation for the user to act on manually, nothing more.

This is a hard boundary, not a configuration option: no version of this skill should be extended to auto-execute trades.
