import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App } from './App'
import { LogScreen } from './screens/LogScreen'
import './index.css'

const DashboardScreen = lazy(() => import('./screens/DashboardScreen'))
const TrendsScreen = lazy(() => import('./screens/TrendsScreen'))
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'))

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-white/40 text-sm">
      Loading…
    </div>
  )
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LogScreen /> },
      { path: 'log', element: <LogScreen /> },
      { path: 'dashboard', element: <Lazy><DashboardScreen /></Lazy> },
      { path: 'trends', element: <Lazy><TrendsScreen /></Lazy> },
      { path: 'settings', element: <Lazy><SettingsScreen /></Lazy> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
