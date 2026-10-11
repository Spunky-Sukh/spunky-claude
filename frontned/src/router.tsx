import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { ChatPage } from './pages/ChatPage'
import { CommandsPage } from './pages/CommandsPage'
import { ErrorPage } from './pages/ErrorPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <ErrorPage /> },
  {
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/chat', element: <ChatPage /> },
      { path: '/commands', element: <CommandsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
