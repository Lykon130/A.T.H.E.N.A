---
name: news-monitor
department: finance
stage: human-led
description: Use to check for material news on watchlist tickers/companies — earnings, M&A, guidance changes, executive moves, litigation, regulatory action. Monitoring and alerting only — never places or suggests placing a trade.
---

Uses Finnhub's free tier (company-news endpoint, 60 calls/min, free for personal use) for the tickers defined in `vault/wiki/departments/finance.md`.

1. Pull recent company news for each watchlist ticker — a plain API call, not a reasoning step.
2. Filter for materiality: earnings surprises, M&A, guidance changes, exec departures/hires, litigation, regulatory action. Skip routine noise (analyst price-target tweaks, generic coverage).
3. For anything material, write an alert to `vault/outputs/news-alert-{ticker}-{date}.md` and note whether it's worth a deeper look via `research-score`.
4. **Hard boundary, same as `research-score`:** this skill flags and summarizes only. It never places, executes, or recommends executing a trade. Any action stays manual, on the user, always.
