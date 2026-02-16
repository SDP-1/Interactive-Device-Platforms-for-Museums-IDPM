import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Artifacts from './pages/Artifacts'
import Scenarios from './pages/Scenarios'
import Explanations from './pages/Explanations'
import AuditLog from './pages/AuditLog'

const PAGE_TITLES = {
  '/':            'Dashboard',
  '/artifacts':   'Artifact Registry',
  '/scenarios':   'Scenario Review',
  '/explanations':'Explanation Review',
  '/auditlog':    'Audit Log',
}

function ProtectedLayout() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  const title = PAGE_TITLES[location.pathname] ?? 'Admin'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </header>
        <Outlet />
      </main>
    </div>
  )
}

function AdminOnly({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/artifacts" element={<Artifacts />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/explanations" element={<Explanations />} />
              <Route path="/auditlog" element={<AdminOnly><AuditLog /></AdminOnly>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
