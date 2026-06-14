import { useState, useEffect } from 'react'
import { BottomSheet } from '../components/BottomSheet'
import { saveSleep } from '../hooks/useSleep'
import { newId, nowIso, type SleepEntry } from '../db'
import { toDatetimeLocal, fromDatetimeLocal, sleepDurationHours, formatDuration } from '../utils/time'

interface Props {
  isOpen: boolean
  onClose: () => void
  editEntry?: SleepEntry
}

function defaultBedtime(): string {
  const d = new Date()
  d.setHours(23, 0, 0, 0)
  d.setDate(d.getDate() - (d.getHours() < 12 ? 1 : 0))
  return toDatetimeLocal(d.toISOString())
}

function defaultWakeTime(): string {
  return toDatetimeLocal(nowIso())
}

export function SleepSheet({ isOpen, onClose, editEntry }: Props) {
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [wakeups, setWakeups] = useState(0)
  const [bodyBattery, setBodyBattery] = useState('')
  const [showBodyBattery, setShowBodyBattery] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (editEntry) {
      setBedtime(toDatetimeLocal(editEntry.bedtime))
      setWakeTime(toDatetimeLocal(editEntry.wake_time))
      setWakeups(editEntry.wakeups)
      setBodyBattery(editEntry.body_battery !== undefined ? String(editEntry.body_battery) : '')
      setShowBodyBattery(editEntry.body_battery !== undefined)
    } else {
      setBedtime(defaultBedtime())
      setWakeTime(defaultWakeTime())
      setWakeups(0)
      setBodyBattery('')
      setShowBodyBattery(false)
    }
    setError('')
  }, [isOpen, editEntry])

  const duration = bedtime && wakeTime
    ? sleepDurationHours(fromDatetimeLocal(bedtime), fromDatetimeLocal(wakeTime))
    : null

  async function handleSave() {
    if (!bedtime || !wakeTime) { setError('Both times are required'); return }
    const bt = fromDatetimeLocal(bedtime)
    const wt = fromDatetimeLocal(wakeTime)
    if (new Date(wt) <= new Date(bt)) { setError('Wake time must be after bedtime'); return }
    const entry: SleepEntry = {
      id: editEntry?.id ?? newId(),
      type: 'sleep',
      bedtime: bt,
      wake_time: wt,
      wakeups,
      body_battery: bodyBattery !== '' ? parseInt(bodyBattery) : undefined,
      created_at: editEntry?.created_at ?? nowIso(),
    }
    await saveSleep(entry)
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editEntry ? 'Edit Sleep' : 'Log Sleep'}>
      <div className="space-y-5 pb-2">
        {/* Bedtime */}
        <div>
          <label className="block text-xs font-medium text-white/55 mb-1.5 uppercase tracking-wide">Bedtime</label>
          <input
            type="datetime-local"
            value={bedtime}
            onChange={e => { setBedtime(e.target.value); setError('') }}
            className="w-full bg-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-spotlight"
          />
        </div>

        {/* Wake time */}
        <div>
          <label className="block text-xs font-medium text-white/55 mb-1.5 uppercase tracking-wide">Wake time</label>
          <input
            type="datetime-local"
            value={wakeTime}
            onChange={e => { setWakeTime(e.target.value); setError('') }}
            className="w-full bg-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-spotlight"
          />
        </div>

        {/* Duration preview */}
        {duration !== null && duration > 0 && (
          <p className="text-white/55 text-sm">Duration: <span className="text-white/90 font-medium">{formatDuration(duration)}</span></p>
        )}

        {error && <p className="text-tier-red text-xs">{error}</p>}

        {/* Wakeups */}
        <div>
          <label className="block text-xs font-medium text-white/55 mb-2 uppercase tracking-wide">Wake-ups</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setWakeups(w => Math.max(0, w - 1))}
              className="w-11 h-11 rounded-xl bg-white/[0.06] text-white/90 text-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              −
            </button>
            <span className="text-2xl font-bold text-white w-8 text-center tabular-nums">{wakeups}</span>
            <button
              type="button"
              onClick={() => setWakeups(w => w + 1)}
              className="w-11 h-11 rounded-xl bg-white/[0.06] text-white/90 text-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Body battery */}
        {!showBodyBattery ? (
          <button
            type="button"
            onClick={() => setShowBodyBattery(true)}
            className="text-sm text-spotlight hover:text-spotlight-soft transition-colors"
          >
            + Add body battery score
          </button>
        ) : (
          <div>
            <label className="block text-xs font-medium text-white/55 mb-1.5 uppercase tracking-wide">Body battery (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={bodyBattery}
              onChange={e => setBodyBattery(e.target.value)}
              placeholder="e.g. 72"
              autoFocus
              className="w-32 bg-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-spotlight"
            />
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-spotlight hover:bg-spotlight-soft active:opacity-90 text-ink font-semibold rounded-xl transition-colors text-base mt-2"
        >
          {editEntry ? 'Save Changes' : 'Save Sleep'}
        </button>
      </div>
    </BottomSheet>
  )
}
