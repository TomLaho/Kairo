import { useState, useEffect, useRef } from 'react'
import { BottomSheet } from '../components/BottomSheet'
import { saveMeal } from '../hooks/useMeals'
import { useMeals } from '../hooks/useMeals'
import { newId, nowIso, MEAL_TAGS, TAG_COLORS, type MealEntry, type MealTag } from '../db'
import { toDatetimeLocal, fromDatetimeLocal, hoursBetween } from '../utils/time'
import { analyzeWithAI, getAIKey } from '../utils/ai'

interface Props {
  isOpen: boolean
  onClose: () => void
  editEntry?: MealEntry
  templateMeal?: MealEntry  // repeat-meal flow: pre-fill description, always add leftovers tag
}

function useLatestMeal(): MealEntry | null {
  const meals = useMeals(1)
  return meals[0] ?? null
}

export function MealSheet({ isOpen, onClose, editEntry, templateMeal }: Props) {
  const latestMeal = useLatestMeal()

  const [description, setDescription] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [timestampEdited, setTimestampEdited] = useState(false)
  const [fastedHours, setFastedHours] = useState('')
  const [showFasted, setShowFasted] = useState(false)
  const [error, setError] = useState('')
  const descRef = useRef<HTMLTextAreaElement>(null)

  const isRepeat = !editEntry && !!templateMeal

  useEffect(() => {
    if (!isOpen) return
    const now = nowIso()
    if (editEntry) {
      setDescription(editEntry.description)
      setTimestamp(toDatetimeLocal(editEntry.timestamp))
      setTimestampEdited(false)
      setFastedHours(editEntry.fasted_period_before !== undefined ? String(editEntry.fasted_period_before) : '')
      setShowFasted(editEntry.fasted_period_before !== undefined)
    } else {
      setDescription(templateMeal?.description ?? '')
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
  }, [isOpen, editEntry, templateMeal]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    const apiKey = getAIKey()
    const willAutoTag = !editEntry && !!apiKey

    const initialTags: MealTag[] = isRepeat ? ['contains_leftovers'] : (editEntry?.tags ?? [])

    const entry: MealEntry = {
      id: editEntry?.id ?? newId(),
      type: 'meal',
      timestamp: fromDatetimeLocal(timestamp),
      description: description.trim(),
      tags: initialTags,
      tagsStatus: willAutoTag ? 'pending' : editEntry?.tagsStatus,
      fasted_period_before: fastedHours !== '' ? parseFloat(fastedHours) : undefined,
      created_at: editEntry?.created_at ?? nowIso(),
    }
    await saveMeal(entry)
    onClose()

    if (willAutoTag) {
      analyzeWithAI(description.trim())
        .then(geminiTags => {
          // Always keep leftovers tag in repeat flow; merge with gemini results
          const merged = isRepeat
            ? [...new Set(['contains_leftovers' as MealTag, ...geminiTags])]
            : geminiTags
          return saveMeal({ ...entry, tags: merged, tagsStatus: 'done', tagsError: undefined })
        })
        .catch((e: unknown) => saveMeal({
          ...entry,
          tagsStatus: 'failed',
          tagsError: e instanceof Error ? e.message : 'Unknown error',
        }))
    }
  }

  async function handleReanalyze() {
    if (!editEntry) return
    if (!getAIKey()) return
    await saveMeal({ ...editEntry, tagsStatus: 'pending', tagsError: undefined })
    analyzeWithAI(editEntry.description)
      .then(tags => saveMeal({ ...editEntry, tags, tagsStatus: 'done', tagsError: undefined }))
      .catch((e: unknown) => saveMeal({
        ...editEntry,
        tagsStatus: 'failed',
        tagsError: e instanceof Error ? e.message : 'Unknown error',
      }))
    onClose()
  }

  const sheetTitle = editEntry ? 'Edit Meal' : isRepeat ? 'Log Again' : 'Log Meal'

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={sheetTitle}>
      <div className="space-y-5 pb-2">
        {isRepeat && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
            <span className="text-emerald-400 text-xs font-semibold">Leftovers tag will be added automatically</span>
          </div>
        )}

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

        {/* AI tags (edit mode only) */}
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

        <button
          onClick={handleSave}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-base mt-2"
        >
          {editEntry ? 'Save Changes' : isRepeat ? 'Log Again' : 'Save Meal'}
        </button>

        {editEntry && getAIKey() && (
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
