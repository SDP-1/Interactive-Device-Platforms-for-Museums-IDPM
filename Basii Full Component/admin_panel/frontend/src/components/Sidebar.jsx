import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',             label: '📊 Dashboard' },
  { section: 'Scenario Generator' },
  { to: '/artifacts',   label: '🏺 Artifact Management' },
  { to: '/scenarios',   label: '📋 Scenario Review Queue' },
  { section: 'Artifact Explorer' },
  { to: '/explanations',label: '🔬 Explanation Validation' },
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()

  return (
    <aside className="w-64 bg-gray-900 text-gray-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700 flex items-center gap-2">
        <span className="text-2xl">🏛️</span>
        <div>
          <div className="font-bold text-white text-sm">Curator Panel</div>
          <div className="text-xs text-indigo-400">{user?.role?.toUpperCase()}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-3 overflow-y-auto">
        {NAV.map((item, i) =>
          item.section ? (
            <div key={i} className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {item.section}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          )
        )}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin Only
            </div>
            <NavLink
              to="/auditlog"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              📜 Audit Log
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-700 flex items-center justify-between">
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          🔓 Sign out
        </button>
        <span className="text-xs text-gray-500">{user?.username}</span>
      </div>
    </aside>
  )
}
