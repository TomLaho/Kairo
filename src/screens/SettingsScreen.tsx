import { useState } from 'react'
import { db, CORRELATION_WINDOW_OPTIONS, DEFAULT_CORRELATION_WINDOW, type CorrelationWindow, type MealEntry } from '../db'
import { useMeals } from '../hooks/useMeals'
import { useSleep } from '../hooks/useSleep'
import { useBrainFog } from '../hooks/useBrainFog'
import { saveMeal } from '../hooks/useMeals'
import { exportMeals, exportSleep, exportBrainFog } from '../utils/export'
import { ConfirmModal } from '../components/ConfirmModal'
import { getAIKey, setAIKey, getAIProvider, setAIProvider, analyzeWithAI, type AIProvider } from '../utils/ai'

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
  const [aiKey, setAIKeyState] = useState(() => getAIKey())
  const [aiProvider, setAIProviderState] = useState<AIProvider>(() => getAIProvider())
  const [keySaved, setKeySaved] = useState(false)
  const meals = useMeals()
  const sleep = useSleep()
  const fog = useBrainFog()

  const [waterGoalMl, setWaterGoalMlState] = useState(() =>
    parseInt(localStorage.getItem('lucid:waterGoal') ?? '2000'),
  )

  function handleSetWaterGoal(ml: number) {
    localStorage.setItem('lucid:waterGoal', String(ml))
    setWaterGoalMlState(ml)
  }

  const [reanalyzing, setReanalyzing] = useState(false)
  const [reanalyzeProgress, setReanalyzeProgress] = useState<{ done: number; total: number } | null>(null)
  const [reanalyzeError, setReanalyzeError] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  function handleSaveKey() {
    setAIKey(aiKey)
    setAIProvider(aiProvider)
    setKeySaved(true)
    setTestStatus('idle')
    setTimeout(() => setKeySaved(false), 2000)
  }

  function handleClearKey() {
    setAIKey('')
    setAIKeyState('')
    setTestStatus('idle')
  }

  function handleProviderChange(p: AIProvider) {
    setAIProviderState(p)
    setAIProvider(p)
    setTestStatus('idle')
  }

  async function handleTestKey() {
    const apiKey = getAIKey()
    if (!apiKey) return
    setTestStatus('testing')
    setTestError('')
    try {
      await analyzeWithAI('grilled chicken with white rice')
      setTestStatus('ok')
    } catch (e) {
      setTestError(e instanceof Error ? e.message : 'Unknown error')
      setTestStatus('error')
    }
  }

  async function handleReanalyzeMeals() {
    const apiKey = getGeminiKey()
    if (!apiKey || reanalyzing) return
    setReanalyzing(true)
    const allMeals = (await db.entries.where('type').equals('meal').toArray()) as MealEntry[]
    // Mark all as pending first so cards show "AI analyzing..."
    await Promise.all(allMeals.map(m => saveMeal({ ...m, tagsStatus: 'pending' })))
    setReanalyzeProgress({ done: 0, total: allMeals.length })
    for (let i = 0; i < allMeals.length; i++) {
      try {
        const tags = await analyzeWithAI(allMeals[i].description)
        await saveMeal({ ...allMeals[i], tags, tagsStatus: 'done' })
      } catch (e) {
        await saveMeal({ ...allMeals[i], tagsStatus: 'failed', tagsError: e instanceof Error ? e.message : 'Unknown error' })
      }
      setReanalyzeProgress({ done: i + 1, total: allMeals.length })
      if (i < allMeals.length - 1) await new Promise(r => setTimeout(r, 250))
    }
    setReanalyzing(false)
    setReanalyzeProgress(null)
    // Check if any failed
    const failedMeals = (await db.entries.where('type').equals('meal').toArray()) as MealEntry[]
    const firstFailed = failedMeals.find(m => m.tagsStatus === 'failed')
    if (firstFailed?.tagsError) setReanalyzeError(firstFailed.tagsError)
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

        {/* Water goal */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Daily water goal</h2>
          <p className="text-xs text-slate-500 mb-3">Progress bar shows on the Today screen.</p>
          <div className="flex gap-2 flex-wrap">
            {[1000, 1500, 2000, 2500, 3000].map(ml => (
              <button
                key={ml}
                onClick={() => handleSetWaterGoal(ml)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                  waterGoalMl === ml
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
              </button>
            ))}
          </div>
        </div>

        {/* AI provider + key */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">AI meal tagging</h2>
          <p className="text-xs text-slate-500 mb-3">Key stays on this device only — never sent to GitHub.</p>

          {/* Provider toggle */}
          <div className="flex bg-slate-700 rounded-xl p-1 gap-1 mb-3">
            {(['gemini', 'xai'] as AIProvider[]).map(p => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  aiProvider === p ? 'bg-slate-600 text-slate-100 shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p === 'gemini' ? 'Gemini 2.0' : 'xAI Grok'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              value={aiKey}
              onChange={e => { setAIKeyState(e.target.value); setKeySaved(false) }}
              placeholder={aiProvider === 'gemini' ? 'AIza…' : 'xai-…'}
              className="flex-1 bg-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              onClick={handleSaveKey}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap min-h-[44px]"
            >
              {keySaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>

          {aiKey && (
            <div className="mt-3 space-y-2">
              <button
                onClick={handleTestKey}
                disabled={testStatus === 'testing'}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-sm font-medium rounded-xl transition-colors"
              >
                {testStatus === 'testing' ? 'Testing…' : testStatus === 'ok' ? '✓ Connected — key works' : testStatus === 'error' ? '✕ Test failed — see error below' : 'Test API key'}
              </button>
              {testStatus === 'error' && testError && (
                <p className="text-xs text-red-400 bg-red-900/20 rounded-xl px-3 py-2 break-words">{testError}</p>
              )}
              {testStatus === 'ok' && (
                <p className="text-xs text-emerald-400">Connected. Re-analyze your meals below.</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReanalyzeMeals}
                  disabled={reanalyzing || meals.length === 0}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-sm font-medium rounded-xl transition-colors"
                >
                  {reanalyzing && reanalyzeProgress
                    ? `Analyzing… ${reanalyzeProgress.done}/${reanalyzeProgress.total}`
                    : `Re-analyze all ${meals.length} meal${meals.length !== 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={handleClearKey}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1"
                >
                  Clear key
                </button>
              </div>
              {reanalyzeError && (
                <p className="text-xs text-red-400 bg-red-900/20 rounded-xl px-3 py-2 break-words">
                  Last error: {reanalyzeError}
                </p>
              )}
            </div>
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
