import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { fmtDate } from '../api'
import StatusBadge from '../components/StatusBadge'

function TopicCard({ topic, desc }) {
  if (!topic) return null
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-xs">
      <div className="font-semibold text-gray-700 mb-1">{topic}</div>
      <div className="text-gray-500 whitespace-pre-wrap leading-relaxed">{desc ?? ''}</div>
    </div>
  )
}

export default function Scenarios() {
  const api    = useApi()
  const toast  = useToast()
  const { isAdmin } = useAuth()
  const [items, setItems]   = useState([])
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    let data = await api('GET', '/admin/scenarios' + (filter ? `?status=${filter}` : '')).catch(() => [])
    if (!filter) data = (data ?? []).filter(s => ['ai_generated','pending_review'].includes(s.status))
    setItems(data ?? [])
  }, [filter])

  useEffect(() => { load() }, [load])

  const doAction = async (id, action) => {
    if (action === 'delete' && !window.confirm('Delete this scenario? This cannot be undone.')) return
    const notes = (action === 'reject' || action === 'regenerate')
      ? window.prompt(`Notes for ${action} (optional):`) ?? ''
      : ''
    const paths = {
      approve:    `/admin/scenarios/${id}/approve`,
      reject:     `/admin/scenarios/${id}/reject`,
      publish:    `/admin/scenarios/${id}/publish`,
      regenerate: `/admin/scenarios/${id}/regenerate`,
      delete:     `/admin/scenarios/${id}/delete`,
    }
    try {
      await api('POST', paths[action], { notes })
      toast(`Scenario ${action}d`)
      load()
    } catch (err) {
      toast(`Error: ${err.message}`, true)
    }
  }

  return (
    <div className="p-8 fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Scenario Review Queue</h2>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
            <option value="">Pending Review (Default)</option>
            <option value="ai_generated">AI Generated</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved (History)</option>
            <option value="rejected">Rejected</option>
            <option value="published">Published</option>
          </select>
        </div>

        {items.length === 0
          ? <p className="text-sm text-gray-400">No scenarios in this queue.</p>
          : (
            <div className="space-y-4">
              {items.map(s => {
                const c = s.content ?? {}
                return (
                  <div key={s.id} className="border border-gray-200 rounded-xl p-5">
                    {/* Header */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{s.scenario_name ?? s.scenario_id}</span>
                        <StatusBadge status={s.status} />
                        <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          artifact: {s.artifact_id}
                        </code>
                      </div>
                      <div className="text-xs text-gray-400">
                        Generated {fmtDate(s.created_at)} · model: {s.model_used ?? '–'} · v{s.version}
                      </div>
                      {s.reviewed_by && (
                        <div className="text-xs text-gray-400">
                          Reviewed by {s.reviewed_by} on {fmtDate(s.reviewed_at)}
                        </div>
                      )}
                    </div>

                    {/* Topics — prefer edited_content over raw content */}
                    {(() => { const ec = s.edited_content ?? c; return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <TopicCard topic={ec.answerTopic1} desc={ec.answerDescription1} />
                      <TopicCard topic={ec.answerTopic2} desc={ec.answerDescription2} />
                      <TopicCard topic={ec.answerTopic3} desc={ec.answerDescription3} />
                    </div>
                    )})()}

                    {s.curator_notes && (
                      <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                        📝 Notes: {s.curator_notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => doAction(s.id,'approve')}
                        className="action-btn bg-green-100 text-green-800 hover:bg-green-200">✅ Approve</button>
                      <button onClick={() => doAction(s.id,'reject')}
                        className="action-btn bg-red-100 text-red-800 hover:bg-red-200">❌ Reject</button>
                      <button onClick={() => doAction(s.id,'regenerate')}
                        className="action-btn bg-yellow-100 text-yellow-800 hover:bg-yellow-200">🔄 Regenerate</button>
                      {isAdmin && (
                        <button onClick={() => doAction(s.id,'publish')}
                          className="action-btn bg-blue-100 text-blue-800 hover:bg-blue-200">🚀 Publish</button>
                      )}
                      <button onClick={() => doAction(s.id,'delete')}
                        className="action-btn bg-gray-200 text-gray-700 hover:bg-gray-300">🗑️ Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}
