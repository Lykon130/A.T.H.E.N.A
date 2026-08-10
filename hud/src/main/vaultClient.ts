import { readFileSync } from 'fs'
import { resolve } from 'path'
import { app } from 'electron'
import type { ActivityEntry, DepartmentSnapshot, VaultSnapshot } from '../shared/types'

// Canonical department ids match the folder names under vault/raw/ and vault/outputs/.
// The org-chart table uses slightly different display labels for a couple of rows
// (cross-cutting departments), so this maps id -> org-chart row label.
const DEPARTMENT_LABELS: Record<string, string> = {
  concierge: 'Concierge',
  council: 'Cross-cutting',
  data: 'Data',
  design: 'Design',
  engineering: 'Engineering',
  finance: 'Finance',
  health: 'Health',
  legal: 'Legal',
  marketing: 'Marketing',
  news: 'News',
  operations: 'Operations',
  sales: 'Sales',
  strategy: 'Strategy',
  support: 'Support',
  vault: 'Vault (cross-cutting)'
}

const DEPARTMENT_IDS = Object.keys(DEPARTMENT_LABELS)
const MAX_RECURSE_DEPTH = 3
const MAX_ACTIVITY_ENTRIES = 5

interface OrgChartRow {
  skills: string[]
  stage: string
}

interface RestConfig {
  baseUrl: string
  authHeader: string
}

function loadRestConfig(): RestConfig {
  const repoRoot = resolve(app.getAppPath(), '..')
  const mcpConfigPath = resolve(repoRoot, '.mcp.json')
  const raw = readFileSync(mcpConfigPath, 'utf-8')
  const parsed = JSON.parse(raw)
  const obsidian = parsed?.mcpServers?.obsidian
  if (!obsidian?.url) {
    throw new Error(`.mcp.json missing mcpServers.obsidian.url (looked at ${mcpConfigPath})`)
  }
  const baseUrl = String(obsidian.url).replace(/\/mcp\/?$/, '')
  const authHeader = obsidian.headers?.Authorization
  if (!authHeader) {
    throw new Error('.mcp.json missing mcpServers.obsidian.headers.Authorization')
  }
  return { baseUrl, authHeader }
}

async function listDir(config: RestConfig, relPath: string): Promise<string[]> {
  const url = `${config.baseUrl}/vault/${relPath}/`
  const res = await fetch(url, { headers: { Authorization: config.authHeader } })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
  const body = (await res.json()) as { files?: string[] }
  return body.files ?? []
}

async function readFile(config: RestConfig, relPath: string): Promise<string | null> {
  const url = `${config.baseUrl}/vault/${relPath}`
  const res = await fetch(url, { headers: { Authorization: config.authHeader } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
  return res.text()
}

/** Recursively list every file (not directory) under a vault path, depth-limited. */
async function listFilesRecursive(
  config: RestConfig,
  relPath: string,
  depth = 0
): Promise<string[]> {
  if (depth >= MAX_RECURSE_DEPTH) return []
  const entries = await listDir(config, relPath)
  const files: string[] = []
  for (const entry of entries) {
    if (entry.endsWith('/')) {
      const nested = await listFilesRecursive(config, `${relPath}/${entry.slice(0, -1)}`, depth + 1)
      files.push(...nested)
    } else {
      files.push(`${relPath}/${entry}`)
    }
  }
  return files
}

function parseOrgChart(markdown: string): Map<string, OrgChartRow> {
  const rows = new Map<string, OrgChartRow>()
  const lines = markdown.split('\n')
  for (const line of lines) {
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    if (cells.length < 3) continue
    const [label, skillsRaw, stage] = cells
    if (label === 'Department' || /^-+$/.test(skillsRaw)) continue
    const skills =
      skillsRaw === '—'
        ? []
        : skillsRaw.split(',').map((s) => s.replace(/`/g, '').trim())
    rows.set(label, { skills, stage })
  }
  return rows
}

/**
 * Voice-session-style transcript files use `### HH:MM:SS` headers followed by
 * `**You:**` / `**Athena:**` turn markers. Other raw/output files are plain
 * prose stubs — fall back to a filename-level "updated" entry for those.
 */
function parseActivityFromFile(relPath: string, content: string): ActivityEntry[] {
  const timestampHeader = /^###\s+(\d{2}:\d{2}:\d{2})/
  const turnLines = content.replace(/\r\n/g, '\n').split('\n')
  const entries: ActivityEntry[] = []
  let currentTimestamp: string | undefined

  for (const line of turnLines) {
    const match = line.match(timestampHeader)
    if (match) {
      currentTimestamp = match[1]
      continue
    }
    const turnMatch = line.match(/^\*\*(You|Athena):\*\*\s*(.+)$/)
    if (turnMatch && currentTimestamp) {
      const [, speaker, text] = turnMatch
      entries.push({
        label: `${speaker}: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`,
        timestamp: currentTimestamp
      })
    }
  }

  if (entries.length > 0) return entries.slice(-MAX_ACTIVITY_ENTRIES)

  const fileName = relPath.split('/').pop() ?? relPath
  return [{ label: `${fileName} updated` }]
}

async function buildDepartmentSnapshot(
  config: RestConfig,
  orgChart: Map<string, OrgChartRow>,
  id: string
): Promise<DepartmentSnapshot> {
  const label = DEPARTMENT_LABELS[id]
  const row = orgChart.get(label)

  const [rawFiles, outputFiles] = await Promise.all([
    listFilesRecursive(config, `raw/${id}`),
    listFilesRecursive(config, `outputs/${id}`)
  ])

  const activityFiles = [...outputFiles, ...rawFiles].slice(0, 3)
  const activityLists = await Promise.all(
    activityFiles.map(async (relPath) => {
      const content = await readFile(config, relPath)
      return content ? parseActivityFromFile(relPath, content) : []
    })
  )

  return {
    id,
    name: label.replace(/\s*\(cross-cutting\)/, ''),
    stage: row?.stage ?? 'not built',
    skills: row?.skills ?? [],
    rawFileCount: rawFiles.length,
    outputFileCount: outputFiles.length,
    recentActivity: activityLists.flat().slice(-MAX_ACTIVITY_ENTRIES)
  }
}

export async function getVaultSnapshot(): Promise<VaultSnapshot> {
  const fetchedAt = new Date().toISOString()
  try {
    const config = loadRestConfig()
    const orgChartMd = await readFile(config, 'wiki/org-chart.md')
    const orgChart = parseOrgChart(orgChartMd ?? '')

    const departments = await Promise.all(
      DEPARTMENT_IDS.map((id) => buildDepartmentSnapshot(config, orgChart, id))
    )

    return { fetchedAt, connected: true, departments }
  } catch (err) {
    return {
      fetchedAt,
      connected: false,
      error: err instanceof Error ? err.message : String(err),
      departments: []
    }
  }
}
