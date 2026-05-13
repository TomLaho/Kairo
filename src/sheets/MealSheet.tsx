import { useState, useEffect, useRef } from 'react'
import { BottomSheet } from '../components/BottomSheet'
import { saveMeal } from '../hooks/useMeals'
import { useMeals } from '../hooks/useMeals'
import { newId, nowIso, MEAL_TAGS, TAG_COLORS, type MealEntry } from '../db'
import { toDatetimeLocal, fromDatetimeLocal, hoursBetween } from '../utils/time'
import { analyzeWithGemini, getGeminiKey } from '../utils/gemini'

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
      setTimestamp(toDatetimeLocal(editEntry.timestamp))
      setTimestampEdited(false)
      setFastedHours(editEntry.fasted_period_before !== undefined ? String(editEntry.fasted_period_before) : '')
      setShowFasted(editEntry.fasted_period_before !== undefined)
    } else {
      const now = nowIso()
      setDescription('')
      setTimestamp(toDatetimeLocal(now))
      setTimestampEdited(false)
      setShowFasted(false)
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
      tags: editEntry?.tags ?? [],
      fasted_period_before: fastedHours !== '' ? parseFloat(fastedHours) : undefined,
      created_at: editEntry?.created_at ?? nowIso(),
    }
    await saveMeal(entry)
    onClose()

    // Auto-tag in background if adding a new entry and API key is set
    if (!editEntry) {
      const apiKey = getGeminiKey()
      if (apiKey) {
        analyzeWithGemini(description.trim(), apiKey)
          .then(tags => saveMeal({ ...entry, tags }))
          .catch(() => {/* silent fail — tags stay empty */})
      }
    }
  }

  async function handleReanalyze() {
    if (!editEntry) return
    const apiKey = getGeminiKey()
    if (!apiKey) return
    analyzeWithGemini(editEntry.description, apiKey)
      .then(tags => saveMeal({ ...editEntry, tags }))
      .catch(() => {})
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

        {/* AI tags (edit mode only — read-only display) */}
        {editEntry && editEntry.tags.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              AI-detected tags
            </label>
            <div className="flex flex-wrap gap-2">
              {editEntry.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: TAG_COLORS[tag] + '33', color: TAG_COLORS[tag] }}
                >
                  {MEAL_TAGS.find(t => t.value === tag)?.label}
                </span>
              ))}
            </div>
          </div>
        )}

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

        {/* Re-analyze (edit mode only, requires API key) */}
        {editEntry && getGeminiKey() && (
          <button
            type="button"
            onClick={handleReanalyze}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-xl transition-colors"
          >
            Re-analyze with AI
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
