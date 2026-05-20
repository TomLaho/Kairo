import { useState } from 'react'
import { FogLineChart } from '../charts/FogLineChart'
import { CorrelationScatter } from '../charts/CorrelationScatter'
import { SleepBarChart } from '../charts/SleepBarChart'
import { MealTagsChart } from '../charts/MealTagsChart'
import { TagFogAverageChart } from '../charts/TagFogAverageChart'
import { FogHourChart } from '../charts/FogHourChart'
import { DEFAULT_CORRELATION_WINDOW, type CorrelationWindow } from '../db'

type Tab = 'fog' | 'sleep' | 'meals'

const TABS: { id: Tab; label: string }[] = [
  { id: 'fog', label: 'Brain Fog' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'meals', label: 'Meals' },
]

function useCorrelationWindow(): CorrelationWindow {
  const stored = localStorage.getItem('lucid:correlationWindow')
  return (stored ? parseInt(stored) : DEFAULT_CORRELATION_WINDOW) as CorrelationWindow
}

export function TrendsScreen() {
  const [tab, setTab] = useState<Tab>('fog')
  const windowHours = useCorrelationWindow()

  return (
    <div className="pb-6">
      <div className="px-4 pt-6 pb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Analysis</p>
        <h1 className="text-3xl font-bold text-slate-50">Trends</h1>
      </div>

      {/* Tab bar */}
      <div className="mx-4 mb-4 flex bg-slate-800 rounded-xl p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-slate-700 text-slate-100 shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-6">
        {tab === 'fog' && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Last 7 days
              </h2>
              <div className="bg-slate-800 rounded-2xl p-3">
                <FogLineChart />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Fog vs time since meal
              </h2>
              <p className="text-xs text-slate-500 mb-3">Within {windowHours}h window · coloured by meal tag</p>
              <div className="bg-slate-800 rounded-2xl p-3">
                <CorrelationScatter windowHours={windowHours} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Time of day
              </h2>
              <p className="text-xs text-slate-500 mb-3">Avg fog score by hour · green low · red high</p>
              <div className="bg-slate-800 rounded-2xl p-3">
                <FogHourChart />
              </div>
            </div>
          </>
        )}

        {tab === 'sleep' && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Last 14 nights
            </h2>
            <div className="bg-slate-800 rounded-2xl p-3">
              <SleepBarChart />
            </div>
          </div>
        )}

        {tab === 'meals' && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Avg brain fog by tag
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Mean fog score for episodes logged within {windowHours}h of a meal with that tag
              </p>
              <div className="bg-slate-800 rounded-2xl p-3">
                <TagFogAverageChart windowHours={windowHours} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Tag frequency
              </h2>
              <div className="bg-slate-800 rounded-2xl p-3">
                <MealTagsChart />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TrendsScreen
