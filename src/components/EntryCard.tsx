import type { Entry, MealEntry, SleepEntry, BrainFogEntry, WaterEntry } from '../db'
import { MEAL_TAGS, TAG_COLORS } from '../db'
import { relativeTime, formatDuration, sleepDurationHours } from '../utils/time'

interface Props {
  entry: Entry
  onEdit: (entry: Entry) => void
  onDelete: (id: string) => void
}

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

const FOG_COLOR = (score: number) =>
  score <= 3 ? { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' }
  : score <= 6 ? { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' }
  : { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' }

function CardShell({ accentColor, children, onEdit, onDelete, entry }: {
  accentColor: string
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
  entry: Entry
}) {
  return (
    <button
      className="w-full text-left bg-slate-800/60 border border-white/4 rounded-2xl overflow-hidden flex active:bg-slate-800 transition-colors group"
      onClick={onEdit}
    >
      <div className={`w-1 self-stretch ${accentColor} flex-shrink-0`} />
      <div className="flex-1 px-4 py-3.5 flex items-start justify-between gap-3 min-w-0">
        {children}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="text-slate-700 hover:text-red-400 transition-colors p-1 flex-shrink-0 -mt-0.5 -mr-1 opacity-0 group-hover:opacity-100 group-active:opacity-100"
          aria-label="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </button>
  )
}

function MealCard({ entry, onEdit, onDelete }: { entry: MealEntry } & Omit<Props, 'entry'>) {
  const { tagsStatus, tags } = entry
  return (
    <CardShell accentColor="bg-indigo-500" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} entry={entry}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">Meal</span>
          <span className="text-xs text-slate-500">{relativeTime(entry.timestamp)}</span>
        </div>
        <p className="text-sm text-slate-200 font-medium truncate">{entry.description}</p>
        {(tags.length > 0 || tagsStatus === 'pending' || tagsStatus === 'failed') && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: TAG_COLORS[tag] + '28', color: TAG_COLORS[tag] }}
              >
                {MEAL_TAGS.find(t => t.value === tag)?.label}
              </span>
            ))}
            {tagsStatus === 'pending' && tags.length === 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-400 animate-pulse">
                AI analyzing…
              </span>
            )}
            {tagsStatus === 'failed' && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 max-w-full truncate">
                {entry.tagsError ? `AI: ${entry.tagsError}` : 'AI failed · tap to retry'}
              </span>
            )}
          </div>
        )}
      </div>
    </CardShell>
  )
}

function SleepCard({ entry, onEdit, onDelete }: { entry: SleepEntry } & Omit<Props, 'entry'>) {
  const duration = sleepDurationHours(entry.bedtime, entry.wake_time)
  return (
    <CardShell accentColor="bg-blue-500" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} entry={entry}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">Sleep</span>
          <span className="text-xs text-slate-500">{relativeTime(entry.wake_time)}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-200 font-semibold">{formatDuration(duration)}</span>
          {entry.wakeups > 0 && (
            <span className="text-slate-500 text-xs">{entry.wakeups} wake-up{entry.wakeups > 1 ? 's' : ''}</span>
          )}
          {entry.body_battery !== undefined && (
            <span className="text-emerald-400 text-xs font-medium">⚡ {entry.body_battery}</span>
          )}
        </div>
      </div>
    </CardShell>
  )
}

function FogCard({ entry, onEdit, onDelete }: { entry: BrainFogEntry } & Omit<Props, 'entry'>) {
  const { bg, text, border } = FOG_COLOR(Math.round(entry.score))
  return (
    <CardShell accentColor="bg-purple-500" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} entry={entry}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400">Brain Fog</span>
          <span className="text-xs text-slate-500">{relativeTime(entry.timestamp)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${bg} ${text} ${border}`}>
            {entry.score}/10
          </span>
          {entry.note && <p className="text-slate-400 text-xs truncate">{entry.note}</p>}
        </div>
      </div>
    </CardShell>
  )
}

function WaterCard({ entry, onEdit, onDelete }: { entry: WaterEntry } & Omit<Props, 'entry'>) {
  const displayAmount = entry.amount_ml >= 1000
    ? `${(entry.amount_ml / 1000).toFixed(entry.amount_ml % 1000 === 0 ? 0 : 1)} L`
    : `${entry.amount_ml} ml`
  return (
    <CardShell accentColor="bg-cyan-500" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} entry={entry}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Water</span>
          <span className="text-xs text-slate-500">{relativeTime(entry.timestamp)}</span>
        </div>
        <p className="text-sm text-slate-200 font-semibold">💧 {displayAmount}</p>
      </div>
    </CardShell>
  )
}

export function EntryCard({ entry, onEdit, onDelete }: Props) {
  if (entry.type === 'meal') return <MealCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
  if (entry.type === 'sleep') return <SleepCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
  if (entry.type === 'water') return <WaterCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
  return <FogCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
}
