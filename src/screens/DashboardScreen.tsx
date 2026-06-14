import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Entry, type MealEntry, type SleepEntry, type BrainFogEntry, type WaterEntry } from '../db'
import { EntryCard } from '../components/EntryCard'
import { ConfirmModal } from '../components/ConfirmModal'
import { MealSheet } from '../sheets/MealSheet'
import { BrainFogSheet } from '../sheets/BrainFogSheet'
import { SleepSheet } from '../sheets/SleepSheet'
import { WaterSheet } from '../sheets/WaterSheet'
import { formatDuration, sleepDurationHours } from '../utils/time'
import { format, startOfDay, endOfDay } from 'date-fns'
import { useInsights } from '../hooks/useInsights'
import { DEFAULT_CORRELATION_WINDOW, type CorrelationWindow } from '../db'

function useCorrelationWindow(): CorrelationWindow {
  const stored = localStorage.getItem('lucid:correlationWindow')
  return (stored ? parseInt(stored) : DEFAULT_CORRELATION_WINDOW) as CorrelationWindow
}

function useRecentEntries(): Entry[] {
  return useLiveQuery(async () => {
    const all = await db.entries.toArray()
    return all
      .sort((a, b) => {
        const ta = a.type === 'sleep' ? a.wake_time : (a as MealEntry | BrainFogEntry | WaterEntry).timestamp
        const tb = b.type === 'sleep' ? b.wake_time : (b as MealEntry | BrainFogEntry | WaterEntry).timestamp
        return new Date(tb).getTime() - new Date(ta).getTime()
      })
      .slice(0, 40)
  }, []) ?? []
}

function useTodaySummary() {
  return useLiveQuery(async () => {
    const start = startOfDay(new Date()).toISOString()
    const end = endOfDay(new Date()).toISOString()
    const all = await db.entries.toArray()
    const mealsToday = (all as MealEntry[]).filter(
      e => e.type === 'meal' && e.timestamp >= start && e.timestamp <= end,
    )
    const fogToday = (all as BrainFogEntry[])
      .filter(e => e.type === 'brain_fog' && e.timestamp >= start && e.timestamp <= end)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const sleepEntries = (all as SleepEntry[])
      .filter(e => e.type === 'sleep')
      .sort((a, b) => new Date(b.wake_time).getTime() - new Date(a.wake_time).getTime())
    const waterToday = (all as WaterEntry[]).filter(
      e => e.type === 'water' && e.timestamp >= start && e.timestamp <= end,
    )
    const totalWaterMl = waterToday.reduce((sum, e) => sum + e.amount_ml, 0)
    return {
      mealCount: mealsToday.length,
      latestFog: fogToday[0] ?? null,
      latestSleep: sleepEntries[0] ?? null,
      totalWaterMl,
    }
  }, [])
}

export function DashboardScreen() {
  const entries = useRecentEntries()
  const summary = useTodaySummary()
  const windowHours = useCorrelationWindow()
  const insights = useInsights(windowHours)
  const waterGoalMl = parseInt(localStorage.getItem('lucid:waterGoal') ?? '2000')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)

  async function handleDelete() {
    if (deleteId) {
      await db.entries.delete(deleteId)
      setDeleteId(null)
    }
  }

  const today = format(new Date(), 'EEEE, d MMM')

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-white">Today</h1>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="mx-4 mb-5 grid grid-cols-2 gap-2">
          {/* Meals */}
          <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-stage/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🍽</div>
            <div>
              <div className="text-2xl font-bold text-white leading-none">{summary.mealCount}</div>
              <div className="text-[11px] text-white/40 mt-0.5 font-medium">Meals today</div>
            </div>
          </div>
          {/* Brain fog */}
          <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-spotlight/15 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🧠</div>
            <div>
              <div className="text-2xl font-bold text-white leading-none">
                {summary.latestFog ? summary.latestFog.score : '—'}
              </div>
              <div className="text-[11px] text-white/40 mt-0.5 font-medium">
                {summary.latestFog ? 'Fog score' : 'No fog logged'}
              </div>
            </div>
          </div>
          {/* Sleep */}
          <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-moon/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🌙</div>
            <div>
              <div className="text-2xl font-bold text-white leading-none">
                {summary.latestSleep
                  ? formatDuration(sleepDurationHours(summary.latestSleep.bedtime, summary.latestSleep.wake_time))
                  : '—'}
              </div>
              <div className="text-[11px] text-white/40 mt-0.5 font-medium">Last sleep</div>
            </div>
          </div>
          {/* Water */}
          <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-400/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💧</div>
              <div>
                <div className="text-2xl font-bold text-white leading-none">
                  {summary.totalWaterMl >= 1000
                    ? `${(summary.totalWaterMl / 1000).toFixed(summary.totalWaterMl % 1000 === 0 ? 0 : 1)}L`
                    : summary.totalWaterMl > 0
                      ? `${summary.totalWaterMl}ml`
                      : '—'}
                </div>
                <div className="text-[11px] text-white/40 mt-0.5 font-medium">
                  {waterGoalMl > 0 ? `of ${waterGoalMl >= 1000 ? `${waterGoalMl / 1000}L` : `${waterGoalMl}ml`} goal` : 'Water today'}
                </div>
              </div>
            </div>
            {waterGoalMl > 0 && (
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (summary.totalWaterMl / waterGoalMl) * 100)}%`,
                    background: summary.totalWaterMl >= waterGoalMl ? '#22d3ee' : '#0891b2',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mx-4 mb-5 bg-spotlight/[0.06] border border-spotlight/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-spotlight text-sm">✦</span>
            <span className="text-[11px] font-bold text-spotlight uppercase tracking-widest">Insights</span>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-white/75 leading-relaxed">
                {insight}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="px-4">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-white/55 text-sm font-medium">No entries yet.</p>
            <p className="text-white/30 text-xs mt-1">Tap Log to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Recent</p>
            {entries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={e => setEditEntry(e)}
                onDelete={id => setDeleteId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit sheets */}
      <MealSheet
        isOpen={editEntry?.type === 'meal'}
        onClose={() => setEditEntry(null)}
        editEntry={editEntry?.type === 'meal' ? (editEntry as MealEntry) : undefined}
      />
      <BrainFogSheet
        isOpen={editEntry?.type === 'brain_fog'}
        onClose={() => setEditEntry(null)}
        editEntry={editEntry?.type === 'brain_fog' ? (editEntry as BrainFogEntry) : undefined}
      />
      <SleepSheet
        isOpen={editEntry?.type === 'sleep'}
        onClose={() => setEditEntry(null)}
        editEntry={editEntry?.type === 'sleep' ? (editEntry as SleepEntry) : undefined}
      />
      <WaterSheet
        isOpen={editEntry?.type === 'water'}
        onClose={() => setEditEntry(null)}
        editEntry={editEntry?.type === 'water' ? (editEntry as WaterEntry) : undefined}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete entry?"
        message="This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

export default DashboardScreen
