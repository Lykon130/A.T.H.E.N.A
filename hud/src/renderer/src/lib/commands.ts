import type { DepartmentSnapshot } from '../../../shared/types'

export type Action =
  | { type: 'show-departments' }
  | { type: 'show-department'; id: string }
  | { type: 'go-idle' }
  | { type: 'speak-test' }

const SHOW_DEPARTMENTS_WORDS = new Set(['departments', 'department', 'orbit', 'show departments', 'show orbit'])
const GO_IDLE_WORDS = new Set(['hide', 'home', 'idle', 'go idle'])
const SPEAK_TEST_WORDS = new Set(['speak', 'talk', 'test speak', 'speaking'])

/**
 * Parses free text (typed now, spoken later) into a HUD navigation action.
 * Kept as a standalone pure function so a future voice-command source can
 * call the exact same parser/dispatch path the command bar uses.
 */
export function parseCommand(input: string, departments: DepartmentSnapshot[]): Action | null {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return null

  if (SHOW_DEPARTMENTS_WORDS.has(normalized)) return { type: 'show-departments' }
  if (GO_IDLE_WORDS.has(normalized)) return { type: 'go-idle' }
  if (SPEAK_TEST_WORDS.has(normalized)) return { type: 'speak-test' }

  const target = normalized.replace(/^(show|open|go to)\s+/, '')

  const exact = departments.find(
    (d) => d.id.toLowerCase() === target || d.name.toLowerCase() === target
  )
  if (exact) return { type: 'show-department', id: exact.id }

  const partial = departments.find(
    (d) => d.id.toLowerCase().includes(target) || d.name.toLowerCase().includes(target)
  )
  if (partial) return { type: 'show-department', id: partial.id }

  return null
}
