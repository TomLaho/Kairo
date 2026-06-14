import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'

export function App() {
  const location = useLocation()
  if (location.pathname === '/') return <Navigate to="/log" replace />

  return (
    <div className="min-h-dvh text-white pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
      <main className="max-w-xl mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
