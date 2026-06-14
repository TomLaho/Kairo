import { useState, useEffect } from 'react'
import { BottomSheet } from '../components/BottomSheet'
import { ScoreSlider } from '../components/ScoreSlider'
import { saveBrainFog } from '../hooks/useBrainFog'
import { newId, nowIso, type BrainFogEntry } from '../db'
import { toDatetimeLocal, fromDatetimeLocal } from '../utils/time'

interface Props {
  isOpen: boolean
  onClose: () => void
  editEntry?: BrainFogEntry
}

export function BrainFogSheet({ isOpen, onClose, editEntry }: Props) {
  const [score, setScore] = useState(5)
  const [note, setNote] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [timestampEdited, setTimestampEdited] = useState(false)
  const [showNote, setShowNote] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (editEntry) {
      setScore(editEntry.score)
      setNote(editEntry.note ?? '')
      setTimestamp(toDatetimeLocal(editEntry.timestamp))
      setTimestampEdited(false)
      setShowNote(!!editEntry.note)
    } else {
      setScore(5)
      setNote('')
      setTimestamp(toDatetimeLocal(nowIso()))
      setTimestampEdited(false)
      setShowNote(false)
    }
  }, [isOpen, editEntry])

  async function handleSave() {
    const entry: BrainFogEntry = {
      id: editEntry?.id ?? newId(),
      type: 'brain_fog',
      timestamp: fromDatetimeLocal(timestamp),
      score,
      note: note.trim() || undefined,
      created_at: editEntry?.created_at ?? nowIso(),
    }
    await saveBrainFog(entry)
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editEntry ? 'Edit Brain Fog' : 'Log Brain Fog'}>
      <div className="space-y-6 pb-2">
        {/* Score */}
        <div>
          <label className="block text-xs font-medium text-white/55 mb-3 uppercase tracking-wide">Fog level</label>
          <ScoreSlider value={score} onChange={setScore} />
        </div>

        {/* Timestamp */}
        <div>
          <label className="block text-xs font-medium text-white/55 mb-1.5 uppercase tracking-wide">
            When
            {timestampEdited && <span className="ml-2 text-spotlight normal-case tracking-normal">edited</span>}
          </label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={e => { setTimestamp(e.target.value); setTimestampEdited(true) }}
            className="w-full bg-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-spotlight"
          />
        </div>

        {/* Note */}
        {!showNote ? (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="text-sm text-spotlight hover:text-spotlight-soft transition-colors"
          >
            + Add context note
          </button>
        ) : (
          <div>
            <label className="block text-xs font-medium text-white/55 mb-1.5 uppercase tracking-wide">Context</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Just woke up, 3h after dinner"
              rows={2}
              autoFocus
              className="w-full bg-white/[0.06] rounded-xl px-4 py-3 text-white/90 placeholder-white/35 text-sm focus:outline-none focus:ring-2 focus:ring-spotlight resize-none"
            />
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-spotlight hover:bg-spotlight-soft active:opacity-90 text-ink font-semibold rounded-xl transition-colors text-base mt-2"
        >
          {editEntry ? 'Save Changes' : 'Save'}
        </button>
      </div>
    </BottomSheet>
  )
}
