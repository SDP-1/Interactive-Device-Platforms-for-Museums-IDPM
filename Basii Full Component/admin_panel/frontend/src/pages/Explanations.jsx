import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { fmtDate } from '../api'
import StatusBadge from '../components/StatusBadge'

export default function Explanations() {
  const api    = useApi()
  const toast  = useToast()
  const { isAdmin } = useAuth()
  const [items, setItems]   = useState([])
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    let data = await api('GET', '/admin/explanations' + (filter ? `?status=${filter}` : '')).catch(() => [])
    if (!filter) data = (data ?? []).filter(e => ['ai_generated','pending_review'].includes(e.status))
    setItems(data ?? [])
  }, [filter])

  useEffect(() => { load() }, [load])

  const doAction = async (id, action) => {
    if (action === 'delete' && !window.confirm('Delete this explanation? This cannot be undone.')) return
    const notes = (action === 'reject')
      ? window.prompt('Rejection notes (optional):') ?? ''
      : ''
    const paths = {
      approve:  `/admin/explanations/${id}/verify`,
      reject:   `/admin/explanations/${id}/reject`,
      publish:  `/admin/explanations/${id}/publish`,
      delete:   `/admin/explanations/${id}/delete`,
    }
    try {
      await api('POST', paths[action], { notes })
      toast(`Explanation ${action}d`)
      load()
    } catch (err) {
      toast(`Error: ${err.message}`, true)
    }
  }

  return (
    <div className="p-8 fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Explanation Review Queue</h2>
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
          ? <p className="text-sm text-gray-400">No explanations in this queue.</p>
          : (
            <div className="space-y-4">
              {items.map(e => (
                <div key={e.id} className="border border-gray-200 rounded-xl p-5">
                  {/* Header */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{e.artifact_name ?? e.artifact_id}</span>
                      <StatusBadge status={e.status} />
                      <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        artifact: {e.artifact_id}
                      </code>
                    </div>
                    <div className="text-xs text-gray-400">
                      Generated {fmtDate(e.created_at)} · v{e.version}
                    </div>
                    {e.reviewed_by && (
                      <div className="text-xs text-gray-400">
                        Reviewed by {e.reviewed_by} on {fmtDate(e.reviewed_at)}
                      </div>
                    )}
                  </div>

                  {/* Explanation text — prefer edited version when available */}
                  {(e.edited_explanation || e.explanation) && (
                    <div className="space-y-1 mb-3">
                      {e.edited_explanation && (
                        <div className="text-xs text-indigo-600 font-medium">✏️ Curator-edited version:</div>
                      )}
                      <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {e.edited_explanation || e.explanation}
                      </div>
                      {e.edited_explanation && (
                        <details className="text-xs text-gray-400">
                          <summary className="cursor-pointer hover:text-gray-600">Show original AI text</summary>
                          <div className="mt-1 bg-gray-100 rounded p-2 whitespace-pre-wrap">{e.explanation}</div>
                        </details>
                      )}
                    </div>
                  )}

                  {e.curator_notes && (
                    <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                      📝 Notes: {e.curator_notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => doAction(e.id,'approve')}
                      className="action-btn bg-green-100 text-green-800 hover:bg-green-200">✅ Verify &amp; Approve</button>
                    <button onClick={() => doAction(e.id,'reject')}
                      className="action-btn bg-red-100 text-red-800 hover:bg-red-200">❌ Reject</button>
                    {isAdmin && (
                      <button onClick={() => doAction(e.id,'publish')}
                        className="action-btn bg-blue-100 text-blue-800 hover:bg-blue-200">🚀 Publish</button>
                    )}
                    <button onClick={() => doAction(e.id,'delete')}
                      className="action-btn bg-gray-200 text-gray-700 hover:bg-gray-300">🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}
