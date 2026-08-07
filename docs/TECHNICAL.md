# Technical Documentation

## Repo structure

```
ARCHITECTURE.md          system design + rationale (canonical, predates docs/)
docs/                     this folder — SRS, technical docs, skills architecture, devlog
vault/
  wiki/
    org-chart.md          live department -> skill -> maturity-stage table (source of truth)
    profile.md            persistent user profile, maintained by skills/vault/remember.md
    departments/*.md       one note per department: config, running knowledge, skill list
  raw/                    captured dumps (not yet created — populated once skills actually run)
  outputs/                anything skills produce for the user to read (not yet created)
skills/
  <department>/<skill>.md  one file per skill, frontmatter + numbered steps
```

## SKILL.md frontmatter schema

Every skill file uses:

```yaml
---
name: skill-name
department: which-department (or "cross-cutting")
stage: human-led | human-assisted | fully-autonomous
description: what triggers this skill — this is what Claude Code actually matches against
---
```

`stage` is tracked per-skill in `vault/wiki/org-chart.md` and should only ever move up the ladder deliberately, never by default.

## What's wired vs. not

| Component | Status |
|---|---|
| Skill definitions (23+ skills, 13 departments) | Done |
| Obsidian vault + Local REST API/MCP plugin | Not installed — blocks every skill from writing anywhere real |
| Voice (native `/voice` or faster-whisper + Piper) | Not installed |
| HUD | Not built |
| Cross-machine sync (Syncthing) | Not set up |
| Git repo + remote | Done (`github.com/Lykon130/A.T.H.E.N.A`) |
| `document-commit` git hook | Scripted (`.githooks/pre-push`), not yet activated (needs `git config core.hooksPath .githooks` locally on each machine) |

## Free/low-cost data sources in use

- **GDELT** — global news/events, completely free, unlimited, no API key. Used by `news/global-scan`.
- **Finnhub** — free tier, 60 calls/min, real-time quotes + company news, free for personal/non-commercial use. Used by `finance/news-monitor`.
- **GitHub/GitLab API** — free for personal repos. Used by `engineering/dev-digest`.
- **faster-whisper** + **Piper** — fully local, free, no API cost. Planned for voice if native Claude Code `/voice` isn't available.

## Cost model

Claude Code is included in the Claude Pro subscription; Claude.ai chat, Claude Code, and Cowork share one usage pool (5-hour rolling window + weekly cap). Design rule: Claude is only invoked for reasoning/synthesis steps; all data-fetching, polling, and scanning happens in plain scripts before Claude is ever called. See `ARCHITECTURE.md` → "Engine budget" for full rationale.

## Git hooks

`document-commit` needs to run automatically before pushes. Since `.git/hooks/` isn't tracked by git, the actual script lives at `.githooks/pre-push` in this repo and needs activating per-machine:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push   # not needed on Windows
```

Trigger is **pre-push** (fires once per push, looping over every commit since the last push that touches something outside `docs/`) — chosen over `post-commit` specifically to avoid burning Claude Pro's shared usage pool on every WIP/fixup commit. The tradeoff is documented in `skills/engineering/document-commit.md`. A failed doc-update run logs a warning but never blocks the push itself.

Requires the `claude` CLI installed and authenticated (Pro/Max plan) on whichever machine is pushing.
