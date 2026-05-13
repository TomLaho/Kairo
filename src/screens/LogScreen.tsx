import { useState } from 'react'
import { MealSheet } from '../sheets/MealSheet'
import { BrainFogSheet } from '../sheets/BrainFogSheet'
import { SleepSheet } from '../sheets/SleepSheet'

type SheetType = 'meal' | 'brain_fog' | 'sleep' | null

const ENTRY_CARDS = [
  {
    type: 'meal' as SheetType,
    icon: '🍽',
    label: 'Log Meal',
    sub: 'What did you eat?',
    color: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/30',
    iconBg: 'bg-indigo-600/30',
  },
  {
    type: 'brain_fog' as SheetType,
    icon: '🧠',
    label: 'Log Brain Fog',
    sub: 'Rate your clarity right now',
    color: 'from-purple-600/20 to-purple-600/5 border-purple-500/30',
    iconBg: 'bg-purple-600/30',
  },
  {
    type: 'sleep' as SheetType,
    icon: '🌙',
    label: 'Log Sleep',
    sub: 'Last night\'s sleep',
    color: 'from-blue-600/20 to-blue-600/5 border-blue-500/30',
    iconBg: 'bg-blue-600/30',
  },
]

export function LogScreen() {
  const [open, setOpen] = useState<SheetType>(null)

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-bold text-slate-100 pt-2 pb-1">Log entry</h1>
      {ENTRY_CARDS.map(card => (
        <button
          key={card.type}
          onClick={() => setOpen(card.type)}
          className={`w-full text-left bg-gradient-to-br ${card.color} border rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform`}
        >
          <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0`}>
            {card.icon}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-100">{card.label}</div>
            <div className="text-sm text-slate-400">{card.sub}</div>
          </div>
          <span className="ml-auto text-slate-600 text-lg">›</span>
        </button>
      ))}

      <MealSheet isOpen={open === 'meal'} onClose={() => setOpen(null)} />
      <BrainFogSheet isOpen={open === 'brain_fog'} onClose={() => setOpen(null)} />
      <SleepSheet isOpen={open === 'sleep'} onClose={() => setOpen(null)} />
    </div>
  )
}
