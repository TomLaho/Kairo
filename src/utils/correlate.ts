import type { MealEntry, BrainFogEntry, MealTag } from '../db'
import { hoursBetween } from './time'

export type DominantTag = MealTag | 'untagged'

export interface CorrelationPoint {
  fogScore: number
  timeSinceMealHours: number
  dominantTag: DominantTag
  fogId: string
  mealId: string
}

export function buildCorrelationPoints(
  fogEntries: BrainFogEntry[],
  mealEntries: MealEntry[],
  windowHours: number,
): CorrelationPoint[] {
  const sortedMeals = [...mealEntries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  const points: CorrelationPoint[] = []

  for (const fog of fogEntries) {
    const fogTime = new Date(fog.timestamp).getTime()

    // Most recent meal strictly before this fog entry
    let priorMeal: MealEntry | null = null
    for (const meal of sortedMeals) {
      const mealTime = new Date(meal.timestamp).getTime()
      if (mealTime < fogTime) {
        priorMeal = meal
      } else {
        break
      }
    }

    if (!priorMeal) continue

    const gap = hoursBetween(priorMeal.timestamp, fog.timestamp)
    if (gap > windowHours) continue

    const dominantTag: DominantTag =
      priorMeal.tags.length > 0 ? priorMeal.tags[0] : 'untagged'

    points.push({
      fogScore: fog.score,
      timeSinceMealHours: Math.round(gap * 10) / 10,
      dominantTag,
      fogId: fog.id,
      mealId: priorMeal.id,
    })
  }

  return points
}
