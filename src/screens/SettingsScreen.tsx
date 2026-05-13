import { useState } from 'react'
import { db, CORRELATION_WINDOW_OPTIONS, DEFAULT_CORRELATION_WINDOW, type CorrelationWindow } from '../db'
import { useMeals } from '../hooks/useMeals'
import { useSleep } from '../hooks/useSleep'
import { useBrainFog } from '../hooks/useBrainFog'
import { exportMeals, exportSleep, exportBrainFog } from '../utils/export'
import { ConfirmModal } from '../components/ConfirmModal'
import { getGeminiKey, setGeminiKey } from '../utils/gemini'

function useStoredWindow(): [CorrelationWindow, (w: CorrelationWindow) => void] {
  const [value, setValue] = useState<CorrelationWindow>(() => {
    const stored = localStorage.getItem('lucid:correlationWindow')
    return (stored ? parseInt(stored) : DEFAULT_CORRELATION_WINDOW) as CorrelationWindow
  })
  function set(w: CorrelationWindow) {
    localStorage.setItem('lucid:correlationWindow', String(w))
    setValue(w)
  }
  return [value, set]
}

export function SettingsScreen() {
  const [confirmClear, setConfirmClear] = useState(false)
  const [windowHours, setWindowHours] = useStoredWindow()
  const [geminiKey, setGeminiKeyState] = useState(() => getGeminiKey())
  const [geminiSaved, setGeminiSaved] = useState(false)
  const meals = useMeals()
  const sleep = useSleep()
  const fog = useBrainFog()

  function handleSaveGeminiKey() {
    setGeminiKey(geminiKey)
    setGeminiSaved(true)
    setTimeout(() => setGeminiSaved(false), 2000)
  }

  function handleClearGeminiKey() {
    setGeminiKey('')
    setGeminiKeyState('')
  }

  async function handleClearAll() {
    await db.entries.clear()
    setConfirmClear(false)
  }

  function handleExport() {
    exportMeals(meals)
    setTimeout(() => exportSleep(sleep), 300)
    setTimeout(() => exportBrainFog(fog), 600)
  }

  const totalEntries = meals.length + sleep.length + fog.length

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Stats */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Data</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-indigo-400">{meals.length}</div>
              <div className="text-xs text-slate-500">Meals</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-400">{fog.length}</div>
              <div className="text-xs text-slate-500">Fog</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-400">{sleep.length}</div>
              <div className="text-xs text-slate-500">Sleep</div>
            </div>
          </div>
        </div>

        {/* Gemini API key */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Gemini AI (meal tagging)</h2>
          <p className="text-xs text-slate-500 mb-3">
            Stays on this device only — never sent to GitHub or any server other than Google.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={geminiKey}
              onChange={e => { setGeminiKeyState(e.target.value); setGeminiSaved(false) }}
              placeholder="AIza…"
              className="flex-1 bg-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              onClick={handleSaveGeminiKey}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap min-h-[44px]"
            >
              {geminiSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
          {geminiKey && (
            <button
              onClick={handleClearGeminiKey}
              className="mt-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear key
            </button>
          )}
        </div>

        {/* Correlation window */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Correlation window</h2>
          <p className="text-xs text-slate-500 mb-3">
            Max hours after a meal that a fog entry is linked to it in the scatter plot.
            Use 12–16h to capture overnight effects.
          </p>
          <div className="flex gap-2 flex-wrap">
            {CORRELATION_WINDOW_OPTIONS.map(h => (
              <button
                key={h}
                onClick={() => setWindowHours(h)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                  windowHours === h
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Export</h2>
          <p className="text-xs text-slate-500 mb-3">Downloads three CSV files: meals, sleep, and brain fog.</p>
          <button
            onClick={handleExport}
            disabled={totalEntries === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            Export CSV ({totalEntries} entries)
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-red-900/30">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Danger zone</h2>
          <p className="text-xs text-slate-500 mb-3">This permanently deletes all your data.</p>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={totalEntries === 0}
            className="w-full py-3 bg-red-900/40 hover:bg-red-800/60 active:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed text-red-300 font-semibold rounded-xl transition-colors border border-red-800/40"
          >
            Clear all data
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 pt-2">Lucid v0.1.0</p>
      </div>

      <ConfirmModal
        isOpen={confirmClear}
        title="Clear all data?"
        message={`This will permanently delete all ${totalEntries} entries. Export first if you want to keep them.`}
        confirmLabel="Delete everything"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}

export default SettingsScreen
