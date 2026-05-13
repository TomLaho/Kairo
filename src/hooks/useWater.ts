import { useLiveQuery } from 'dexie-react-hooks'
import { db, type WaterEntry } from '../db'

export function useWater(limit?: number): WaterEntry[] {
  return (
    useLiveQuery(async () => {
      const q = db.entries.where('type').equals('water').reverse()
      const results = limit ? await q.limit(limit).toArray() : await q.toArray()
      return results as WaterEntry[]
    }, [limit]) ?? []
  )
}

export async function saveWater(entry: WaterEntry): Promise<void> {
  await db.entries.put(entry)
}

export async function deleteWater(id: string): Promise<void> {
  await db.entries.delete(id)
}
