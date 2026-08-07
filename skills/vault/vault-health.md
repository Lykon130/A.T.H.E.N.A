---
name: vault-health
department: vault
stage: human-assisted
description: Use when asked to audit, clean, or check the health of the vault — finds broken links, orphaned notes, and missing frontmatter.
---

Borrowed from the "Optimal Engine" brain-store health-audit skill. Runs three checks:

1. **Link-checker** — find internal links pointing to notes that don't exist.
2. **Orphan-finder** — find notes in `wiki/` with no inbound links from `org-chart.md` or a department note.
3. **Frontmatter-linter** — flag notes missing expected frontmatter (title, department, date).

Report findings as a checklist in `vault/outputs/vault-health-{date}.md`. Don't auto-fix on first run — flag only, until this skill is promoted to fully-autonomous in `org-chart.md`.
