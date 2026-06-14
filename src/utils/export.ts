import type { Entry, MealEntry, SleepEntry, BrainFogEntry, WaterEntry } from '../db'
import { sleepDurationHours } from './time'

function escapeCsv(value: string | number | undefined): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rows(headers: string[], data: string[][]): string {
  return [headers, ...data].map(row => row.map(escapeCsv).join(',')).join('\n')
}

function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Primary timestamp used to sort all entry types onto one timeline.
function primaryTime(e: Entry): string {
  return e.type === 'sleep' ? e.wake_time : e.timestamp
}

/**
 * Exports every entry — meals, sleep, brain fog, and water — into a single CSV
 * file. One row per entry, with a `type` column and the union of all fields,
 * sorted newest first. A single download avoids the browser throttling that
 * dropped files when each type was downloaded separately.
 */
export function exportAll(
  meals: MealEntry[],
  sleep: SleepEntry[],
  fog: BrainFogEntry[],
  water: WaterEntry[],
): void {
  const headers = [
    'type', 'id', 'timestamp', 'description', 'tags', 'fasted_period_before_hours',
    'bedtime', 'wake_time', 'duration_hours', 'wakeups', 'body_battery',
    'score', 'note', 'amount_ml',
  ]

  const entries: Entry[] = [...meals, ...sleep, ...fog, ...water].sort(
    (a, b) => new Date(primaryTime(b)).getTime() - new Date(primaryTime(a)).getTime(),
  )

  const data = entries.map(e => {
    if (e.type === 'meal') {
      return [
        'meal', e.id, e.timestamp, e.description, e.tags.join('|'),
        String(e.fasted_period_before ?? ''), '', '', '', '', '', '', '', '',
      ]
    }
    if (e.type === 'sleep') {
      return [
        'sleep', e.id, e.wake_time, '', '', '',
        e.bedtime, e.wake_time,
        String(Math.round(sleepDurationHours(e.bedtime, e.wake_time) * 10) / 10),
        String(e.wakeups), String(e.body_battery ?? ''), '', '', '',
      ]
    }
    if (e.type === 'water') {
      return [
        'water', e.id, e.timestamp, '', '', '', '', '', '', '', '', '', '',
        String(e.amount_ml),
      ]
    }
    return [
      'brain_fog', e.id, e.timestamp, '', '', '', '', '', '', '', '',
      String(e.score), e.note ?? '', '',
    ]
  })

  downloadCsv('lucid-export.csv', rows(headers, data))
}
