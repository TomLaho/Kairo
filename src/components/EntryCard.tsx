import type { Entry, MealEntry, SleepEntry, BrainFogEntry, WaterEntry } from '../db'
import { MEAL_TAGS, TAG_COLORS } from '../db'
import { relativeTime, formatDuration, sleepDurationHours } from '../utils/time'

interface Props {
  entry: Entry
  onEdit: (entry: Entry) => void
  onDelete: (id: string) => void
}

const SCORE_BG: Record<number, string> = {}
for (let i = 0; i <= 10; i++) {
  SCORE_BG[i] = i <= 3 ? 'bg-green-900 text-green-300' : i <= 6 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
}

function MealCard({ entry, onEdit, onDelete }: { entry: MealEntry } & Omit<Props, 'entry'>) {
  return (
    <button
      className="w-full text-left bg-slate-700/50 rounded-xl p-4 active:bg-slate-700 transition-colors"
      onClick={() => onEdit(entry)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Meal</span>
            <span className="text-xs text-slate-500">{relativeTime(entry.timestamp)}</span>
          </div>
          <p className="text-slate-200 text-sm truncate">{entry.description}</p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: TAG_COLORS[tag] + '33', color: TAG_COLORS[tag] }}
                >
                  {MEAL_TAGS.find(t => t.value === tag)?.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
          className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          aria-label="Delete"
        >
          🗑
        </button>
      </div>
    </button>
  )
}

function SleepCard({ entry, onEdit, onDelete }: { entry: SleepEntry } & Omit<Props, 'entry'>) {
  const duration = sleepDurationHours(entry.bedtime, entry.wake_time)
  return (
    <button
      className="w-full text-left bg-slate-700/50 rounded-xl p-4 active:bg-slate-700 transition-colors"
      onClick={() => onEdit(entry)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-400">Sleep</span>
            <span className="text-xs text-slate-500">{relativeTime(entry.wake_time)}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span>{formatDuration(duration)}</span>
            {entry.wakeups > 0 && <span className="text-slate-400">{entry.wakeups} wake-up{entry.wakeups > 1 ? 's' : ''}</span>}
            {entry.body_battery !== undefined && <span className="text-emerald-400">⚡ {entry.body_battery}</span>}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
          className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          aria-label="Delete"
        >
          🗑
        </button>
      </div>
    </button>
  )
}

function FogCard({ entry, onEdit, onDelete }: { entry: BrainFogEntry } & Omit<Props, 'entry'>) {
  const scoreCls = SCORE_BG[Math.round(entry.score)] ?? 'bg-slate-700 text-slate-300'
  return (
    <button
      className="w-full text-left bg-slate-700/50 rounded-xl p-4 active:bg-slate-700 transition-colors"
      onClick={() => onEdit(entry)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-purple-400">Brain Fog</span>
            <span className="text-xs text-slate-500">{relativeTime(entry.timestamp)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreCls}`}>{entry.score}/10</span>
            {entry.note && <p className="text-slate-400 text-sm truncate">{entry.note}</p>}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
          className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          aria-label="Delete"
        >
          🗑
        </button>
      </div>
    </button>
  )
}

function WaterCard({ entry, onEdit, onDelete }: { entry: WaterEntry } & Omit<Props, 'entry'>) {
  const displayAmount = entry.amount_ml >= 1000
    ? `${(entry.amount_ml / 1000).toFixed(entry.amount_ml % 1000 === 0 ? 0 : 1)} L`
    : `${entry.amount_ml} ml`
  return (
    <button
      className="w-full text-left bg-slate-700/50 rounded-xl p-4 active:bg-slate-700 transition-colors"
      onClick={() => onEdit(entry)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Water</span>
            <span className="text-xs text-slate-500">{relativeTime(entry.timestamp)}</span>
          </div>
          <div className="text-slate-200 text-sm font-medium">💧 {displayAmount}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
          className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
          aria-label="Delete"
        >
          🗑
        </button>
      </div>
    </button>
  )
}

export function EntryCard({ entry, onEdit, onDelete }: Props) {
  if (entry.type === 'meal') return <MealCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
  if (entry.type === 'sleep') return <SleepCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
  if (entry.type === 'water') return <WaterCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
  return <FogCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
}
