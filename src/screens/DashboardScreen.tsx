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
      <div className="px-4 pt-6 pb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-slate-50">Today</h1>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="mx-4 mb-5 grid grid-cols-2 gap-2">
          {/* Meals */}
          <div className="bg-slate-800/70 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🍽</div>
            <div>
              <div className="text-2xl font-bold text-slate-100 leading-none">{summary.mealCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Meals today</div>
            </div>
          </div>
          {/* Brain fog */}
          <div className="bg-slate-800/70 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🧠</div>
            <div>
              <div className="text-2xl font-bold text-slate-100 leading-none">
                {summary.latestFog ? summary.latestFog.score : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {summary.latestFog ? 'Fog score' : 'No fog logged'}
              </div>
            </div>
          </div>
          {/* Sleep */}
          <div className="bg-slate-800/70 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🌙</div>
            <div>
              <div className="text-2xl font-bold text-slate-100 leading-none">
                {summary.latestSleep
                  ? formatDuration(sleepDurationHours(summary.latestSleep.bedtime, summary.latestSleep.wake_time))
                  : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Last sleep</div>
            </div>
          </div>
          {/* Water */}
          <div className="bg-slate-800/70 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-cyan-500/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💧</div>
            <div>
              <div className="text-2xl font-bold text-slate-100 leading-none">
                {summary.totalWaterMl >= 1000
                  ? `${(summary.totalWaterMl / 1000).toFixed(summary.totalWaterMl % 1000 === 0 ? 0 : 1)}L`
                  : summary.totalWaterMl > 0
                    ? `${summary.totalWaterMl}ml`
                    : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Water today</div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="px-4">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-slate-400 text-sm font-medium">No entries yet.</p>
            <p className="text-slate-600 text-xs mt-1">Tap Log to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recent</p>
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
