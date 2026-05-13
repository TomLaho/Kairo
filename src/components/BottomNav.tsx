import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/log', label: 'Log', icon: '✚' },
  { to: '/dashboard', label: 'Today', icon: '◉' },
  { to: '/trends', label: 'Trends', icon: '↗' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700/50 safe-bottom z-40">
      <div className="flex">
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-0.5 min-h-[56px] transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`
            }
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
