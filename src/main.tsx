import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { App } from './App'
import { LogScreen } from './screens/LogScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { TrendsScreen } from './screens/TrendsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import './index.css'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LogScreen /> },
      { path: 'log', element: <LogScreen /> },
      { path: 'dashboard', element: <DashboardScreen /> },
      { path: 'trends', element: <TrendsScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
