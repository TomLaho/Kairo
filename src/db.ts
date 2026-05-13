import Dexie, { type Table } from 'dexie'

export type MealTag =
  | 'contains_refined_carbs'
  | 'contains_aged_protein'
  | 'contains_leftovers'
  | 'contains_fermented'

export const MEAL_TAGS: { value: MealTag; label: string }[] = [
  { value: 'contains_refined_carbs', label: 'Refined carbs' },
  { value: 'contains_aged_protein', label: 'Aged protein' },
  { value: 'contains_leftovers', label: 'Leftovers' },
  { value: 'contains_fermented', label: 'Fermented' },
]

export interface MealEntry {
  id: string
  type: 'meal'
  timestamp: string
  description: string
  tags: MealTag[]
  fasted_period_before?: number
  created_at: string
}

export interface SleepEntry {
  id: string
  type: 'sleep'
  bedtime: string
  wake_time: string
  wakeups: number
  body_battery?: number
  created_at: string
}

export interface BrainFogEntry {
  id: string
  type: 'brain_fog'
  timestamp: string
  score: number
  note?: string
  created_at: string
}

export type Entry = MealEntry | SleepEntry | BrainFogEntry

export const CORRELATION_WINDOW_OPTIONS = [6, 8, 12, 16] as const
export type CorrelationWindow = (typeof CORRELATION_WINDOW_OPTIONS)[number]
export const DEFAULT_CORRELATION_WINDOW: CorrelationWindow = 12

export const TAG_COLORS: Record<MealTag | 'untagged', string> = {
  contains_refined_carbs: '#3b82f6',
  contains_aged_protein: '#f59e0b',
  contains_leftovers: '#10b981',
  contains_fermented: '#8b5cf6',
  untagged: '#94a3b8',
}

export const TAG_LABELS: Record<MealTag | 'untagged', string> = {
  contains_refined_carbs: 'Refined carbs',
  contains_aged_protein: 'Aged protein',
  contains_leftovers: 'Leftovers',
  contains_fermented: 'Fermented',
  untagged: 'No tag',
}

class LucidDB extends Dexie {
  entries!: Table<Entry>

  constructor() {
    super('lucid')
    this.version(1).stores({
      entries: 'id, type, timestamp, created_at, bedtime, wake_time',
    })
  }
}

export const db = new LucidDB()

export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
