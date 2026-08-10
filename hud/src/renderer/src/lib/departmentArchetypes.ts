export type Archetype = 'metrics' | 'feed' | 'pipeline' | 'reference'

const ARCHETYPES: Record<string, Archetype> = {
  finance: 'metrics',
  health: 'metrics',
  data: 'metrics',
  strategy: 'metrics',

  engineering: 'feed',
  news: 'feed',
  support: 'feed',

  sales: 'pipeline',
  marketing: 'pipeline',
  concierge: 'pipeline',

  legal: 'reference',
  design: 'reference',
  operations: 'reference',
  vault: 'reference',
  council: 'reference'
}

export function getArchetype(departmentId: string): Archetype {
  return ARCHETYPES[departmentId] ?? 'reference'
}
