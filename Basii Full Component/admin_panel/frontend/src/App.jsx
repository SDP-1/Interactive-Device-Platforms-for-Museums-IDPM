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
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-800">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-64 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[100px] pointer-events-none z-0"></div>
      
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto relative z-10">
        <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-8 py-5 sticky top-0 z-20 shadow-sm">
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">{title}</h1>
        </header>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
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
