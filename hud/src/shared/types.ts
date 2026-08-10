export type DepartmentStage = string

export interface ActivityEntry {
  label: string
  timestamp?: string
}

export interface MetricPoint {
  t: string
  v: number
}

export interface Metric {
  label: string
  value?: number
  unit?: string
  series?: MetricPoint[]
}

export interface DepartmentSnapshot {
  id: string
  name: string
  stage: DepartmentStage
  skills: string[]
  rawFileCount: number
  outputFileCount: number
  recentActivity: ActivityEntry[]
  metrics?: Metric[]
}

export interface VaultSnapshot {
  fetchedAt: string
  connected: boolean
  error?: string
  departments: DepartmentSnapshot[]
}

export interface AthenaBridge {
  onVaultUpdate: (callback: (snapshot: VaultSnapshot) => void) => () => void
  refresh: () => void
}
