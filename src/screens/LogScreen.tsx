import { useState, useMemo } from 'react'
import { MealSheet } from '../sheets/MealSheet'
import { BrainFogSheet } from '../sheets/BrainFogSheet'
import { SleepSheet } from '../sheets/SleepSheet'
import { WaterSheet } from '../sheets/WaterSheet'
import { useMeals } from '../hooks/useMeals'
import type { MealEntry } from '../db'

type SheetType = 'meal' | 'brain_fog' | 'sleep' | 'water' | null

const ENTRY_CARDS = [
  {
    type: 'meal' as SheetType,
    icon: '🍽',
    label: 'Log Meal',
    sub: 'What did you eat?',
    accent: 'border-l-stage',
    glow: 'bg-stage/8',
    iconBg: 'bg-stage/20',
  },
  {
    type: 'brain_fog' as SheetType,
    icon: '🧠',
    label: 'Log Brain Fog',
    sub: 'Rate your mental clarity',
    accent: 'border-l-spotlight',
    glow: 'bg-spotlight/8',
    iconBg: 'bg-spotlight/15',
  },
  {
    type: 'sleep' as SheetType,
    icon: '🌙',
    label: 'Log Sleep',
    sub: "Last night's sleep",
    accent: 'border-l-moon',
    glow: 'bg-moon/8',
    iconBg: 'bg-moon/20',
  },
  {
    type: 'water' as SheetType,
    icon: '💧',
    label: 'Log Water',
    sub: 'Track your hydration',
    accent: 'border-l-cyan-500',
    glow: 'bg-cyan-500/8',
    iconBg: 'bg-cyan-500/20',
  },
]

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/30">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

function useRecentUniqueMeals(count: number): MealEntry[] {
  const meals = useMeals(20)
  return useMemo(() => {
    const seen = new Set<string>()
    return meals.filter(m => {
      if (seen.has(m.description)) return false
      seen.add(m.description)
      return true
    }).slice(0, count)
  }, [meals, count])
}

export function LogScreen() {
  const [open, setOpen] = useState<SheetType>(null)
  const [templateMeal, setTemplateMeal] = useState<MealEntry | undefined>()
  const recentMeals = useRecentUniqueMeals(3)

  function openRepeat(meal: MealEntry) {
    setTemplateMeal(meal)
    setOpen('meal')
  }

  function closeMeal() {
    setOpen(null)
    setTemplateMeal(undefined)
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-2">
      <div className="mb-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Track</p>
        <h1 className="text-3xl font-bold text-white">Log entry</h1>
      </div>

      {ENTRY_CARDS.map(card => (
        <button
          key={card.type}
          onClick={() => { setTemplateMeal(undefined); setOpen(card.type) }}
          className={`w-full text-left ${card.glow} border border-white/5 border-l-4 ${card.accent} rounded-2xl px-5 py-4 flex items-center gap-4 active:scale-[0.985] transition-transform`}
        >
          <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
            {card.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-white">{card.label}</div>
            <div className="text-xs text-white/55 mt-0.5">{card.sub}</div>
          </div>
          <ChevronRight />
        </button>
      ))}

      {/* Repeat recent meals */}
      {recentMeals.length > 0 && (
        <div className="pt-3">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">Log again</p>
          <div className="flex flex-col gap-2">
            {recentMeals.map(meal => (
              <button
                key={meal.id}
                onClick={() => openRepeat(meal)}
                className="w-full text-left bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 active:bg-white/[0.08] transition-colors"
              >
                <span className="text-lg">↩</span>
                <span className="text-sm text-white/70 truncate flex-1">{meal.description}</span>
                <span className="text-[10px] text-stage font-semibold flex-shrink-0">+ leftovers</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <MealSheet isOpen={open === 'meal'} onClose={closeMeal} templateMeal={templateMeal} />
      <BrainFogSheet isOpen={open === 'brain_fog'} onClose={() => setOpen(null)} />
      <SleepSheet isOpen={open === 'sleep'} onClose={() => setOpen(null)} />
      <WaterSheet isOpen={open === 'water'} onClose={() => setOpen(null)} />
    </div>
  )
}
