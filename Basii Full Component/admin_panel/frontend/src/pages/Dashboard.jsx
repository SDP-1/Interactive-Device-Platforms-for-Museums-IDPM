import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import StatusBadge from '../components/StatusBadge'

function StatCard({ icon, value, label, accentColor }) {
  return (
    <div className="card group relative overflow-hidden flex items-center justify-between hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500`} style={{ backgroundColor: accentColor }}></div>
      <div>
        <div className="text-4xl font-serif font-bold text-slate-800 drop-shadow-sm">{value ?? '–'}</div>
        <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
      </div>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner relative z-10" style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}>
        <span className="text-3xl drop-shadow-md">{icon}</span>
      </div>
    </div>
  )
}

function Breakdown({ title, data }) {
  if (!data) return null
  const entries = Object.entries(data)
  return (
    <div className="card flex flex-col h-full">
      <h3 className="font-serif font-bold text-xl text-slate-800 mb-6">{title}</h3>
      {entries.length === 0
        ? <div className="flex-1 flex items-center justify-center text-slate-400 font-medium text-sm italic">No data available</div>
        : (
          <div className="space-y-4 text-sm flex-1">
            {entries.map(([s, n]) => (
              <div key={s} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <StatusBadge status={s} />
                <span className="font-bold text-slate-700 font-serif text-lg">{n}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

const WORKFLOW = [
  { step: '1', label: 'Draft',              color: 'from-slate-400 to-slate-500' },
  { step: '2', label: 'AI Generated',       color: 'from-purple-400 to-purple-500' },
  { step: '3', label: 'Pending Review',     color: 'from-amber-400 to-amber-500' },
  { step: '4', label: 'Approved / Rejected',color: 'from-emerald-400 to-emerald-500' },
  { step: '5', label: 'Published',          color: 'from-indigo-500 to-indigo-600' },
]

export default function Dashboard() {
  const api = useApi()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api('GET', '/admin/stats').then(setStats).catch(() => {})
  }, [])

  const artTotal = stats
    ? Object.values(stats.artifacts || {}).reduce((a, b) => a + b, 0)
    : null
  const scenPending = stats
    ? (stats.scenarios?.pending_review ?? 0) + (stats.scenarios?.ai_generated ?? 0)
    : null
  const explPending = stats
    ? (stats.explanations?.pending_review ?? 0) + (stats.explanations?.ai_generated ?? 0)
    : null

  return (
    <div className="p-8 fade-in space-y-8 animate-in fade-in duration-500">
      
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon="🏺" value={artTotal} label="Total Artifacts" accentColor="#6366f1" />
        <StatCard icon="📋" value={scenPending} label="Scenarios Review" accentColor="#f59e0b" />
        <StatCard icon="🔬" value={explPending} label="Explanations Review" accentColor="#8b5cf6" />
      </div>

      {/* Breakdowns + workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <Breakdown title="Scenario Overview"    data={stats?.scenarios} />
        <Breakdown title="Explanation Status" data={stats?.explanations} />

        <div className="card bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100/50 shadow-indigo-100 flex flex-col h-full">
          <h3 className="font-serif font-bold text-xl text-indigo-900 mb-6">Moderation Journey</h3>
          <div className="relative pl-4 flex-1">
            {/* Connecting Line */}
            <div className="absolute left-[27px] top-4 bottom-8 w-0.5 bg-indigo-200/50 rounded-full"></div>
            
            <ol className="space-y-6 text-sm text-indigo-800 relative z-10">
              {WORKFLOW.map((w, index) => (
                <li key={w.step} className="flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${w.color} shadow-md flex items-center justify-center text-white font-bold text-sm transform group-hover:scale-110 transition-transform duration-300`}>
                    {w.step}
                  </div>
                  <span className="font-medium">{w.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
