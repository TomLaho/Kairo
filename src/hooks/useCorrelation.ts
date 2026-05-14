import { useMemo } from 'react'
import { useMealsAsc } from './useMeals'
import { useBrainFogAsc } from './useBrainFog'
import { buildCorrelationPoints, type CorrelationPoint, type DominantTag } from '../utils/correlate'
import { TAG_COLORS, TAG_LABELS, type MealTag } from '../db'

export interface CorrelationGroup {
  tag: DominantTag
  color: string
  label: string
  points: { x: number; y: number; fogId: string; mealId: string }[]
}

export interface TagFogAverage {
  tag: DominantTag
  color: string
  label: string
  avgFog: number
  count: number
}

export function useCorrelation(windowHours: number): CorrelationGroup[] {
  const meals = useMealsAsc()
  const fogEntries = useBrainFogAsc()

  return useMemo(() => {
    const points = buildCorrelationPoints(fogEntries, meals, windowHours)

    const grouped = new Map<DominantTag, CorrelationPoint[]>()
    for (const p of points) {
      const group = grouped.get(p.dominantTag) ?? []
      group.push(p)
      grouped.set(p.dominantTag, group)
    }

    return Array.from(grouped.entries()).map(([tag, pts]) => ({
      tag,
      color: TAG_COLORS[tag as MealTag | 'untagged'],
      label: TAG_LABELS[tag as MealTag | 'untagged'],
      points: pts.map(p => ({ x: p.timeSinceMealHours, y: p.fogScore, fogId: p.fogId, mealId: p.mealId })),
    }))
  }, [fogEntries, meals, windowHours])
}

export function useTagFogAverages(windowHours: number): TagFogAverage[] {
  const groups = useCorrelation(windowHours)
  return useMemo(() => {
    return groups
      .map(g => ({
        tag: g.tag,
        color: g.color,
        label: g.label,
        avgFog: g.points.length > 0
          ? Math.round((g.points.reduce((s, p) => s + p.y, 0) / g.points.length) * 10) / 10
          : 0,
        count: g.points.length,
      }))
      .sort((a, b) => b.avgFog - a.avgFog)
  }, [groups])
}
