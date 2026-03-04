import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { fmtDate } from '../api'

const ACTION_COLORS = {
  create:     'bg-green-100 text-green-800',
  approve:    'bg-blue-100 text-blue-800',
  publish:    'bg-purple-100 text-purple-800',
  reject:     'bg-red-100 text-red-800',
  delete:     'bg-gray-200 text-gray-700',
  regenerate: 'bg-yellow-100 text-yellow-800',
  verify:     'bg-teal-100 text-teal-800',
}

function ActionBadge({ action }) {
  const key = (action ?? '').toLowerCase().split('_')[0]
  const cls = ACTION_COLORS[key] ?? 'bg-gray-100 text-gray-600'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{action}</span>
}

export default function AuditLog() {
  const api   = useApi()
  const toast = useToast()
  const [logs, setLogs] = useState([])

  useEffect(() => {
    api('GET', '/admin/audit-log?limit=200')
      .then(data => setLogs(data ?? []))
      .catch(err => toast(`Error loading audit log: ${err.message}`, true))
  }, [])

  return (
    <div className="p-8 fade-in">
      <div className="card overflow-x-auto">
        <h2 className="text-base font-bold text-gray-900 mb-5">Audit Log</h2>
        {logs.length === 0
          ? <p className="text-sm text-gray-400">No audit log entries.</p>
          : (
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-4 font-semibold">Timestamp</th>
                  <th className="pb-2 pr-4 font-semibold">User</th>
                  <th className="pb-2 pr-4 font-semibold">Action</th>
                  <th className="pb-2 pr-4 font-semibold">Entity</th>
                  <th className="pb-2 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{fmtDate(l.timestamp)}</td>
                    <td className="py-2 pr-4 font-medium text-gray-700">{l.user ?? '–'}</td>
                    <td className="py-2 pr-4"><ActionBadge action={l.action} /></td>
                    <td className="py-2 pr-4 text-gray-500">
                      {l.entity_type && <span className="font-medium text-gray-600">{l.entity_type}</span>}
                      {l.entity_id && <span className="ml-1 text-gray-400">#{l.entity_id}</span>}
                    </td>
                    <td className="py-2 text-gray-500 max-w-xs truncate" title={JSON.stringify(l.details)}>
                      {l.details ? JSON.stringify(l.details) : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}
