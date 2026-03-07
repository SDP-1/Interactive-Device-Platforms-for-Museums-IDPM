import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import StatusBadge from '../components/StatusBadge'

function StatCard({ icon, value, label }) {
  return (
    <div className="card">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value ?? '–'}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

function Breakdown({ title, data }) {
  if (!data) return null
  const entries = Object.entries(data)
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>
      {entries.length === 0
        ? <span className="text-gray-400 text-xs">No data yet</span>
        : (
          <div className="space-y-2 text-sm">
            {entries.map(([s, n]) => (
              <div key={s} className="flex justify-between items-center">
                <StatusBadge status={s} />
                <span className="font-semibold">{n}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

const WORKFLOW = [
  { step: '1', label: 'Draft',              color: 'bg-gray-200 text-gray-700' },
  { step: '2', label: 'AI Generated',       color: 'bg-purple-200 text-purple-700' },
  { step: '3', label: 'Pending Review',     color: 'bg-yellow-200 text-yellow-700' },
  { step: '4', label: 'Approved / Rejected',color: 'bg-green-200 text-green-700' },
  { step: '5', label: 'Published',          color: 'bg-blue-200 text-blue-700' },
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
    <div className="p-8 fade-in space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon="🏺" value={artTotal} label="Total Artifacts" />
        <StatCard icon="📋" value={scenPending} label="Scenarios Pending Review" />
        <StatCard icon="🔬" value={explPending} label="Explanations Pending Review" />
      </div>

      {/* Breakdowns + workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Breakdown title="Scenario Status Breakdown"    data={stats?.scenarios} />
        <Breakdown title="Explanation Status Breakdown" data={stats?.explanations} />

        <div className="card bg-indigo-50 border-indigo-100">
          <h3 className="font-semibold text-indigo-800 mb-4">Moderation Workflow</h3>
          <ol className="space-y-2 text-sm text-indigo-700">
            {WORKFLOW.map(w => (
              <li key={w.step} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${w.color}`}>
                  {w.step}
                </span>
                {w.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
