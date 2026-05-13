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
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{today}</p>
        <h1 className="text-2xl font-bold text-slate-100">Today</h1>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
          <div className="bg-indigo-600/15 border border-indigo-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-indigo-400">{summary.mealCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Meals</div>
          </div>
          <div className="bg-purple-600/15 border border-purple-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {summary.latestFog ? summary.latestFog.score : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Latest fog</div>
          </div>
          <div className="bg-blue-600/15 border border-blue-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {summary.latestSleep
                ? formatDuration(sleepDurationHours(summary.latestSleep.bedtime, summary.latestSleep.wake_time))
                : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Sleep</div>
          </div>
          <div className="bg-cyan-600/15 border border-cyan-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {summary.totalWaterMl >= 1000
                ? `${(summary.totalWaterMl / 1000).toFixed(summary.totalWaterMl % 1000 === 0 ? 0 : 1)}L`
                : summary.totalWaterMl > 0
                  ? `${summary.totalWaterMl}ml`
                  : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Water</div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="px-4 space-y-2">
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-400 text-sm">No entries yet. Tap Log to get started.</p>
          </div>
        ) : (
          entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={e => setEditEntry(e)}
              onDelete={id => setDeleteId(id)}
            />
          ))
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
