import { useLiveQuery } from 'dexie-react-hooks'
import { db, type BrainFogEntry } from '../db'

export function useBrainFog(limit?: number): BrainFogEntry[] {
  return (
    useLiveQuery(async () => {
      const q = db.entries.where('type').equals('brain_fog').reverse()
      const results = limit ? await q.limit(limit).toArray() : await q.toArray()
      return results as BrainFogEntry[]
    }, [limit]) ?? []
  )
}

export function useBrainFogAsc(): BrainFogEntry[] {
  return (
    useLiveQuery(async () => {
      const results = await db.entries.where('type').equals('brain_fog').toArray()
      return (results as BrainFogEntry[]).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
    }, []) ?? []
  )
}

export async function saveBrainFog(entry: BrainFogEntry): Promise<void> {
  await db.entries.put(entry)
}

export async function deleteBrainFog(id: string): Promise<void> {
  await db.entries.delete(id)
}
