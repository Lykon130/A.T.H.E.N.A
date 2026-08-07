---
name: watchlist-scan
department: finance
stage: human-led
description: Use when the user wants a full scan of their watchlist — runs research-score across every tracked ticker and produces one rollup, instead of scoring one at a time.
---

1. Read the watchlist from `vault/wiki/departments/finance.md`.
2. Run the `research-score` process (screen → filter → score) across every ticker on it.
3. Cross-reference against any open `news-monitor` alerts for the same tickers.
4. Write one rollup report to `vault/outputs/watchlist-{date}.md`, ranked by score.
5. Same hard boundary as every other Finance skill: research and ranking only, never execution.
