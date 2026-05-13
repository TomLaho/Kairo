import { useState, useEffect, useRef } from 'react'
import { BottomSheet } from '../components/BottomSheet'
import { TagPill } from '../components/TagPill'
import { saveMeal } from '../hooks/useMeals'
import { useMeals } from '../hooks/useMeals'
import { db, newId, nowIso, MEAL_TAGS, type MealTag, type MealEntry } from '../db'
import { toDatetimeLocal, fromDatetimeLocal, hoursBetween } from '../utils/time'

interface Props {
  isOpen: boolean
  onClose: () => void
  editEntry?: MealEntry
}

function useLatestMeal(): MealEntry | null {
  const meals = useMeals(1)
  return meals[0] ?? null
}

export function MealSheet({ isOpen, onClose, editEntry }: Props) {
  const latestMeal = useLatestMeal()

  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<MealTag[]>([])
  const [timestamp, setTimestamp] = useState('')
  const [timestampEdited, setTimestampEdited] = useState(false)
  const [fastedHours, setFastedHours] = useState('')
  const [showFasted, setShowFasted] = useState(false)
  const [error, setError] = useState('')
  const descRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) return
    if (editEntry) {
      setDescription(editEntry.description)
      setTags(editEntry.tags)
      setTimestamp(toDatetimeLocal(editEntry.timestamp))
      setTimestampEdited(false)
      setFastedHours(editEntry.fasted_period_before !== undefined ? String(editEntry.fasted_period_before) : '')
      setShowFasted(editEntry.fasted_period_before !== undefined)
    } else {
      const now = nowIso()
      setDescription('')
      setTags([])
      setTimestamp(toDatetimeLocal(now))
      setTimestampEdited(false)
      setShowFasted(false)
      // Auto-suggest fasted hours from latest meal
      if (latestMeal) {
        const hrs = Math.round(hoursBetween(latestMeal.timestamp, now) * 10) / 10
        setFastedHours(String(hrs))
        setShowFasted(true)
      } else {
        setFastedHours('')
      }
    }
    setError('')
    setTimeout(() => descRef.current?.focus(), 100)
  }, [isOpen, editEntry]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTag(tag: MealTag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSave() {
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    const entry: MealEntry = {
      id: editEntry?.id ?? newId(),
      type: 'meal',
      timestamp: fromDatetimeLocal(timestamp),
      description: description.trim(),
      tags,
      fasted_period_before: fastedHours !== '' ? parseFloat(fastedHours) : undefined,
      created_at: editEntry?.created_at ?? nowIso(),
    }
    await saveMeal(entry)
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editEntry ? 'Edit Meal' : 'Log Meal'}>
      <div className="space-y-5 pb-2">
        {/* Timestamp */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            When
            {timestampEdited && <span className="ml-2 text-indigo-400 normal-case tracking-normal">edited</span>}
          </label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={e => { setTimestamp(e.target.value); setTimestampEdited(true) }}
            className="w-full bg-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">What did you eat?</label>
          <textarea
            ref={descRef}
            value={description}
            onChange={e => { setDescription(e.target.value); setError('') }}
            placeholder="e.g. Chicken stir-fry with rice, glass of wine"
            rows={3}
            className="w-full bg-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Tags</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TAGS.map(t => (
              <TagPill key={t.value} tag={t.value} selected={tags.includes(t.value)} onToggle={toggleTag} />
            ))}
          </div>
        </div>

        {/* Fasted period */}
        {!showFasted ? (
          <button
            type="button"
            onClick={() => setShowFasted(true)}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Add fasted period
          </button>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Fasted hours before</label>
            <input
              type="number"
              min={0}
              max={72}
              step={0.5}
              value={fastedHours}
              onChange={e => setFastedHours(e.target.value)}
              placeholder="0"
              className="w-32 bg-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-base mt-2"
        >
          {editEntry ? 'Save Changes' : 'Save Meal'}
        </button>
      </div>
    </BottomSheet>
  )
}
