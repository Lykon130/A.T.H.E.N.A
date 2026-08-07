---
name: log-health
department: health
stage: human-led
description: Use when the user reports a workout, sleep, vitals reading, or other health metric, or asks for a health trend summary. Manual-entry based — no live wearable sync yet.
---

1. When the user reports something (workout, sleep hours, resting HR, weight, etc.), log it to `vault/raw/health/{date}.md` under the right metric category from `vault/wiki/departments/health.md`.
2. When asked for a summary/trend, read recent entries and compare against the recent baseline — flag anything notably off pattern.
3. Write trend takeaways to `vault/wiki/departments/health.md`, keep raw entries in `vault/raw/health/`.
4. This is tracking only, not medical advice — if a reading looks concerning, say so plainly and suggest checking with an actual doctor rather than assessing it yourself.
