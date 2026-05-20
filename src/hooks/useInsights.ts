import { useMemo } from 'react'
import { subDays } from 'date-fns'
import { useMealsAsc } from './useMeals'
import { useBrainFogAsc } from './useBrainFog'
import { buildCorrelationPoints } from '../utils/correlate'
import { TAG_LABELS, DEFAULT_CORRELATION_WINDOW, type CorrelationWindow } from '../db'

export function useInsights(windowHours: CorrelationWindow = DEFAULT_CORRELATION_WINDOW): string[] {
  const meals = useMealsAsc()
  const fogEntries = useBrainFogAsc()

  return useMemo(() => {
    const insights: string[] = []
    const points = buildCorrelationPoints(fogEntries, meals, windowHours)

    // Which tag most often precedes high-fog (score >= 6)?
    if (points.length >= 3) {
      const highFog = points.filter(p => p.fogScore >= 6)
      if (highFog.length >= 2) {
        const counts: Record<string, number> = {}
        for (const p of highFog) {
          if (p.dominantTag !== 'untagged') {
            counts[p.dominantTag] = (counts[p.dominantTag] ?? 0) + 1
          }
        }
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        if (top && top[1] >= 2) {
          const pct = Math.round((top[1] / highFog.length) * 100)
          const label = TAG_LABELS[top[0] as keyof typeof TAG_LABELS] ?? top[0]
          insights.push(`${label} meals preceded ${pct}% of your high-fog episodes`)
        }
      }
    }

    // Week-on-week trend
    if (insights.length < 2) {
      const now = new Date()
      const weekAgo = subDays(now, 7)
      const twoWeeksAgo = subDays(now, 14)
      const thisWeek = fogEntries.filter(e => new Date(e.timestamp) >= weekAgo)
      const lastWeek = fogEntries.filter(
        e => new Date(e.timestamp) >= twoWeeksAgo && new Date(e.timestamp) < weekAgo,
      )
      if (thisWeek.length >= 3 && lastWeek.length >= 3) {
        const thisAvg = thisWeek.reduce((s, e) => s + e.score, 0) / thisWeek.length
        const lastAvg = lastWeek.reduce((s, e) => s + e.score, 0) / lastWeek.length
        const diff = Math.round((thisAvg - lastAvg) * 10) / 10
        if (Math.abs(diff) >= 0.5) {
          insights.push(
            diff < 0
              ? `Clarity improving — avg fog down ${Math.abs(diff)} pts vs last week`
              : `Fog worsening — avg score up ${diff} pts vs last week`,
          )
        }
      }
    }

    // Typical post-meal delay before fog
    if (insights.length < 2 && points.length >= 4) {
      const avg = points.reduce((s, p) => s + p.timeSinceMealHours, 0) / points.length
      insights.push(`Brain fog typically hits ${Math.round(avg * 10) / 10}h after eating`)
    }

    return insights.slice(0, 2)
  }, [fogEntries, meals, windowHours])
}
