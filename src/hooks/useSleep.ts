import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SleepEntry } from '../db'

export function useSleep(limit?: number): SleepEntry[] {
  return (
    useLiveQuery(async () => {
      const q = db.entries.where('type').equals('sleep').reverse()
      const results = limit ? await q.limit(limit).toArray() : await q.toArray()
      return (results as SleepEntry[]).sort(
        (a, b) => new Date(b.wake_time).getTime() - new Date(a.wake_time).getTime(),
      )
    }, [limit]) ?? []
  )
}

export async function saveSleep(entry: SleepEntry): Promise<void> {
  await db.entries.put(entry)
}

export async function deleteSleep(id: string): Promise<void> {
  await db.entries.delete(id)
}
