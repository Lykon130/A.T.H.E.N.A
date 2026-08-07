---
name: vault-write
department: vault
stage: human-assisted
description: Use whenever another skill needs to save output to the vault — appends or patches notes via the Obsidian Local REST API/MCP connection rather than guessing file paths.
---

1. Determine the target section: `raw/` for captures, `wiki/` for distilled notes, `outputs/` for anything meant to be read.
2. Call the Obsidian MCP tools (configured per ARCHITECTURE.md / build guide Step 2) to append or patch the target note.
3. Link the new note into the relevant department note in `wiki/departments/` rather than leaving it orphaned.
4. Never overwrite a `wiki/` note wholesale — patch or append.
