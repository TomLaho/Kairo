import { useState, useEffect } from 'react'
import { BottomSheet } from '../components/BottomSheet'
import { saveWater } from '../hooks/useWater'
import { newId, nowIso, type WaterEntry } from '../db'
import { toDatetimeLocal, fromDatetimeLocal } from '../utils/time'

interface Props {
  isOpen: boolean
  onClose: () => void
  editEntry?: WaterEntry
}

const PRESETS = [
  { label: '150 ml', ml: 150 },
  { label: '250 ml', ml: 250 },
  { label: '500 ml', ml: 500 },
  { label: '750 ml', ml: 750 },
  { label: '1 L', ml: 1000 },
]

export function WaterSheet({ isOpen, onClose, editEntry }: Props) {
  const [amountMl, setAmountMl] = useState(250)
  const [customInput, setCustomInput] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [timestamp, setTimestamp] = useState('')
  const [timestampEdited, setTimestampEdited] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (editEntry) {
      setAmountMl(editEntry.amount_ml)
      setCustomInput(String(editEntry.amount_ml))
      setUseCustom(true)
      setTimestamp(toDatetimeLocal(editEntry.timestamp))
      setTimestampEdited(false)
    } else {
      setAmountMl(250)
      setCustomInput('')
      setUseCustom(false)
      setTimestamp(toDatetimeLocal(nowIso()))
      setTimestampEdited(false)
    }
  }, [isOpen, editEntry])

  function selectPreset(ml: number) {
    setAmountMl(ml)
    setUseCustom(false)
  }

  const effectiveAmount = useCustom && customInput !== '' ? parseInt(customInput) || 0 : amountMl

  async function handleSave() {
    if (effectiveAmount <= 0) return
    const entry: WaterEntry = {
      id: editEntry?.id ?? newId(),
      type: 'water',
      timestamp: fromDatetimeLocal(timestamp),
      amount_ml: effectiveAmount,
      created_at: editEntry?.created_at ?? nowIso(),
    }
    await saveWater(entry)
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editEntry ? 'Edit Water' : 'Log Water'}>
      <div className="space-y-5 pb-2">
        {/* Amount display */}
        <div className="text-center py-2">
          <div className="text-5xl font-bold text-cyan-400 tabular-nums">
            {effectiveAmount >= 1000
              ? `${(effectiveAmount / 1000).toFixed(effectiveAmount % 1000 === 0 ? 0 : 1)}L`
              : `${effectiveAmount}ml`}
          </div>
        </div>

        {/* Preset buttons */}
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.ml}
              type="button"
              onClick={() => selectPreset(p.ml)}
              className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                !useCustom && amountMl === p.ml
                  ? 'bg-spotlight text-ink'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div>
          <label className="block text-xs font-medium text-white/55 mb-1.5 uppercase tracking-wide">
            Custom amount (ml)
          </label>
          <input
            type="number"
            min={1}
            max={5000}
            value={customInput}
            onChange={e => { setCustomInput(e.target.value); setUseCustom(true) }}
            placeholder="e.g. 330"
            className="w-36 bg-white/[0.06] rounded-xl px-4 py-3 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-spotlight"
          />
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

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={effectiveAmount <= 0}
          className="w-full py-4 bg-spotlight hover:bg-spotlight-soft active:opacity-90 disabled:opacity-40 text-ink font-semibold rounded-xl transition-colors text-base"
        >
          {editEntry ? 'Save Changes' : 'Log Water'}
        </button>
      </div>
    </BottomSheet>
  )
}
