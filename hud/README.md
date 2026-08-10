# HUD module

A.T.H.E.N.A's desktop command center — an Electron app that reads live from
the Obsidian vault via the Local REST API plugin and renders it as an
overview panel (department orbit) with per-department drill-in views. This
is step 6 of the project's build order in `ARCHITECTURE.md`.

## How it works

1. The Electron **main process** (`src/main/index.ts`) reads the repo root's
   `.mcp.json` for the Obsidian Local REST API's base URL and bearer token —
   the same credentials Claude Code's MCP connection already uses — and
   polls the vault every 30 seconds (`src/main/vaultClient.ts`).
2. `vaultClient.ts` fetches `wiki/org-chart.md` for the department → skill →
   maturity-stage table, then lists/reads `raw/<department>/` and
   `outputs/<department>/` for each of the 15 department folders that
   actually exist in the vault (Home/Environment and HR are named in the org
   chart but have no folders — "not built" — so they're not tracked here).
   Markdown files are parsed loosely: voice-session-style transcripts
   (`### HH:MM:SS` headers, `**You:**`/`**Athena:**` turns) become
   timestamped activity entries; anything else just becomes a filename-level
   "updated" entry — most department folders are still empty stubs, and the
   UI is expected to render that gracefully.
3. Snapshots are pushed to the renderer over IPC (`vault:update`); a
   manual refresh button sends `vault:refresh` to trigger an immediate poll
   without waiting for the 30s interval.
4. The renderer (`src/renderer/src/`) is React + Framer Motion: `App.tsx`
   holds the vault snapshot and current view, `OverviewOrbit.tsx` renders
   the department nodes radially around a central hub (active departments
   pulse, empty ones sit dim), `DepartmentDetail.tsx` is the drill-in view.

## Setup

```
cd hud
npm install
```

Requires Obsidian running locally with the Local REST API plugin enabled
(same setup used for Claude Code's vault MCP connection — see
`skills/engineering` and `ARCHITECTURE.md` for how that was wired) and a
valid `.mcp.json` at the repo root.

## Running

```
npm run dev
```

Launches the Electron app with hot reload. If the vault is unreachable
(Obsidian not running, plugin disabled), the app shows a "VAULT OFFLINE"
banner instead of failing to launch.

## Building

```
npm run build
```

Produces an unpacked build via `electron-vite build`. Packaging into a
distributable installer (electron-builder) isn't wired up yet — not needed
for local daily use.
