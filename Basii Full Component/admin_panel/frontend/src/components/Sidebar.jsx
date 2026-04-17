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
    <aside className="w-72 bg-slate-900 border-r border-indigo-500/10 flex flex-col flex-shrink-0 relative z-30 shadow-2xl">
      {/* Background flare inside sidebar */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none"></div>

      {/* Logo */}
      <div className="px-8 py-8 flex items-center gap-4 relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-2xl drop-shadow-md">🏛️</span>
        </div>
        <div>
          <div className="font-bold text-white font-serif tracking-wide">Curator Admin</div>
          <div className="text-xs text-indigo-300 font-medium tracking-wider">{user?.role?.toUpperCase()}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-4 overflow-y-auto relative">
        {NAV.map((item, i) =>
          item.section ? (
            <div key={i} className="pt-6 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
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
              <span className="text-xl w-6 text-center">{item.label.split(' ')[0]}</span>
              <span>{item.label.split(' ').slice(1).join(' ')}</span>
            </NavLink>
          )
        )}

        {isAdmin && (
          <>
            <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Admin Only
            </div>
            <NavLink
              to="/auditlog"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="text-xl w-6 text-center">📜</span>
              <span>Audit Log</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-6 m-4 mt-auto bg-slate-800/50 rounded-2xl border border-slate-700/50 flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-violet-500/20 to-transparent blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 border border-slate-600">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{user?.username}</span>
            <span className="text-[10px] text-slate-400">Authenticated</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 w-full py-2 bg-slate-700/50 hover:bg-red-500/10 hover:text-red-400 text-xs font-semibold text-slate-300 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/20 flex items-center justify-center gap-2"
        >
           Sign Out
        </button>
      </div>
    </aside>
  )
}
