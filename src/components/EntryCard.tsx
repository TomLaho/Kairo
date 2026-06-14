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
  score <= 3 ? { bg: 'bg-tier-green/15', text: 'text-tier-green', border: 'border-tier-green/30' }
  : score <= 6 ? { bg: 'bg-tier-amber/15', text: 'text-tier-amber', border: 'border-tier-amber/30' }
  : { bg: 'bg-tier-red/15', text: 'text-tier-red', border: 'border-tier-red/30' }

function CardShell({ accentColor, children, onEdit, onDelete, entry }: {
  accentColor: string
  children: React.ReactNode
  onEdit: () => void
  onDelete: () => void
  entry: Entry
}) {
  return (
    <button
      className="w-full text-left bg-white/[0.05] border border-white/10 rounded-2xl overflow-hidden flex active:bg-white/[0.08] transition-colors group"
      onClick={onEdit}
    >
      <div className={`w-1 self-stretch ${accentColor} flex-shrink-0`} />
      <div className="flex-1 px-4 py-3.5 flex items-start justify-between gap-3 min-w-0">
        {children}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="text-white/25 hover:text-tier-red transition-colors p-1 flex-shrink-0 -mt-0.5 -mr-1 opacity-0 group-hover:opacity-100 group-active:opacity-100"
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
    <CardShell accentColor="bg-stage" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} entry={entry}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stage">Meal</span>
          <span className="text-xs text-white/40">{relativeTime(entry.timestamp)}</span>
        </div>
        <p className="text-sm text-white/90 font-medium truncate">{entry.description}</p>
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
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/55 animate-pulse">
                AI analyzing…
              </span>
            )}
            {tagsStatus === 'failed' && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-tier-red/15 text-tier-red max-w-full truncate">
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
    <CardShell accentColor="bg-moon" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} entry={entry}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-moon">Sleep</span>
          <span className="text-xs text-white/40">{relativeTime(entry.wake_time)}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/90 font-semibold">{formatDuration(duration)}</span>
          {entry.wakeups > 0 && (
            <span className="text-white/40 text-xs">{entry.wakeups} wake-up{entry.wakeups > 1 ? 's' : ''}</span>
          )}
          {entry.body_battery !== undefined && (
            <span className="text-stage text-xs font-medium">⚡ {entry.body_battery}</span>
          )}
        </div>
      </div>
    </CardShell>
  )
}

function FogCard({ entry, onEdit, onDelete }: { entry: BrainFogEntry } & Omit<Props, 'entry'>) {
  const { bg, text, border } = FOG_COLOR(Math.round(entry.score))
  return (
    <CardShell accentColor="bg-spotlight" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} entry={entry}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-spotlight">Brain Fog</span>
          <span className="text-xs text-white/40">{relativeTime(entry.timestamp)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${bg} ${text} ${border}`}>
            {entry.score}/10
          </span>
          {entry.note && <p className="text-white/55 text-xs truncate">{entry.note}</p>}
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
    <CardShell accentColor="bg-cyan-400" onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} entry={entry}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Water</span>
          <span className="text-xs text-white/40">{relativeTime(entry.timestamp)}</span>
        </div>
        <p className="text-sm text-white/90 font-semibold">💧 {displayAmount}</p>
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
