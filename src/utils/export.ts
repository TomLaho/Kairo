import type { MealEntry, SleepEntry, BrainFogEntry } from '../db'
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

export function exportMeals(meals: MealEntry[]): void {
  const headers = ['id', 'timestamp', 'description', 'tags', 'fasted_period_before_hours']
  const data = meals.map(m => [
    m.id,
    m.timestamp,
    m.description,
    m.tags.join('|'),
    String(m.fasted_period_before ?? ''),
  ])
  downloadCsv('kairo-meals.csv', rows(headers, data))
}

export function exportSleep(entries: SleepEntry[]): void {
  const headers = ['id', 'bedtime', 'wake_time', 'duration_hours', 'wakeups', 'body_battery']
  const data = entries.map(s => [
    s.id,
    s.bedtime,
    s.wake_time,
    String(Math.round(sleepDurationHours(s.bedtime, s.wake_time) * 10) / 10),
    String(s.wakeups),
    String(s.body_battery ?? ''),
  ])
  downloadCsv('kairo-sleep.csv', rows(headers, data))
}

export function exportBrainFog(entries: BrainFogEntry[]): void {
  const headers = ['id', 'timestamp', 'score', 'note']
  const data = entries.map(f => [f.id, f.timestamp, String(f.score), f.note ?? ''])
  downloadCsv('kairo-brain-fog.csv', rows(headers, data))
}
