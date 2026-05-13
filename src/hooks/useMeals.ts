import { useLiveQuery } from 'dexie-react-hooks'
import { db, type MealEntry } from '../db'

export function useMeals(limit?: number): MealEntry[] {
  return (
    useLiveQuery(async () => {
      const q = db.entries.where('type').equals('meal').reverse()
      const results = limit ? await q.limit(limit).toArray() : await q.toArray()
      return results as MealEntry[]
    }, [limit]) ?? []
  )
}

export function useMealsAsc(): MealEntry[] {
  return (
    useLiveQuery(async () => {
      const results = await db.entries.where('type').equals('meal').toArray()
      return (results as MealEntry[]).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
    }, []) ?? []
  )
}

export async function saveMeal(meal: MealEntry): Promise<void> {
  await db.entries.put(meal)
}

export async function deleteMeal(id: string): Promise<void> {
  await db.entries.delete(id)
}
