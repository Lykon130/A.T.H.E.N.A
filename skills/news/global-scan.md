---
name: global-scan
department: news
stage: human-led
description: Use when the user asks for a news roundup, "what's happening in the world", or a scan of global events on tracked topics/regions.
---

1. Query GDELT (free, no key required) for events/themes matching the topics and regions defined in `vault/wiki/departments/news.md`.
2. This is a data pull, not a reasoning step — the GDELT query itself should be a plain script call, not something Claude does token-by-token. Claude's job starts after the data comes back.
3. Cluster results by topic, filter out noise (duplicate coverage of the same event).
4. Summarize into a digest: top 5-10 developments, one line each, source-linked.
5. Write to `vault/raw/news/{date}.md` (full pull) and `vault/outputs/news-{date}.md` (digest).
6. Flag anything relevant to tracked Finance watchlist tickers for `news-monitor` to pick up — don't duplicate the deep-dive, just cross-reference.
