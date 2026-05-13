import { formatDistanceToNow, format, differenceInMinutes, differenceInHours } from 'date-fns'

export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'dd MMM, HH:mm')
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy')
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm')
}

export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDatetimeLocal(value: string): string {
  return new Date(value).toISOString()
}

export function sleepDurationHours(bedtime: string, wakeTime: string): number {
  const mins = differenceInMinutes(new Date(wakeTime), new Date(bedtime))
  return Math.max(0, mins / 60)
}

export function hoursBetween(earlier: string, later: string): number {
  return Math.max(0, differenceInHours(new Date(later), new Date(earlier), { roundingMethod: 'floor' }) +
    (differenceInMinutes(new Date(later), new Date(earlier)) % 60) / 60)
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
