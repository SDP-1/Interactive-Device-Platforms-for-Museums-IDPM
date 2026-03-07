import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { fmtDate } from '../api'
import StatusBadge from '../components/StatusBadge'

const EMPTY_FORM = {
  artifact_key: '', title: '', description: '',
  category: '', historical_context: '', tags: '', media_assets: ''
}

export default function Artifacts() {
  const api   = useApi()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    const data = await api('GET', '/admin/artifacts' + (filter ? `?status=${filter}` : '')).catch(() => [])
    setItems(data ?? [])
  }

  useEffect(() => { load() }, [filter])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const res = await api('POST', '/admin/artifacts', {
        ...form,
        tags:         form.tags.split(',').map(t => t.trim()).filter(Boolean),
        media_assets: form.media_assets.split(',').map(t => t.trim()).filter(Boolean),
      })
      setMsg({ ok: true, text: `✅ Artifact created (ID ${res.id})` })
      setForm(EMPTY_FORM)
      toast('Artifact created successfully')
      load()
    } catch (err) {
      setMsg({ ok: false, text: `❌ ${err.message}` })
    }
  }

  const changeStatus = async (id, status) => {
    await api('PATCH', `/admin/artifacts/${id}/status`, { status })
    toast(`Artifact → ${status}`)
    load()
  }

  return (
    <div className="p-8 fade-in space-y-8">
      {/* Create form */}
      <div className="card">
        <h2 className="text-base font-bold text-gray-900 mb-5">🏺 Add New Artifact</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { name: 'artifact_key',  label: 'Artifact Key *',  placeholder: 'e.g. art015', required: true },
            { name: 'title',         label: 'Title *',          placeholder: 'e.g. Bronze Kandyan Lamp', required: true },
            { name: 'category',      label: 'Category',         placeholder: 'e.g. Ceremonial Object' },
            { name: 'tags',          label: 'Tags (comma-sep)', placeholder: 'e.g. Kandyan, Bronze' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input name={f.name} value={form[f.name]} onChange={handleChange}
                placeholder={f.placeholder} required={f.required}
                className="input" />
            </div>
          ))}
          {[
            { name: 'description',        label: 'Description',         rows: 2, placeholder: 'Short descriptive overview…' },
            { name: 'historical_context', label: 'Historical Context',  rows: 3, placeholder: 'Historical background…' },
          ].map(f => (
            <div key={f.name} className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <textarea name={f.name} value={form[f.name]} onChange={handleChange}
                rows={f.rows} placeholder={f.placeholder}
                className="input resize-none" />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Media Assets (comma-sep)</label>
            <input name="media_assets" value={form.media_assets} onChange={handleChange}
              placeholder="e.g. lamp_front.jpg, lamp_side.jpg" className="input" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
              Create Artifact
            </button>
          </div>
        </form>
        {msg && (
          <p className={`mt-3 text-sm font-medium ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>
        )}
      </div>

      {/* List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">All Artifacts</h2>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
            <option value="">All statuses</option>
            {['draft','pending_review','approved','published'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
        </div>

        {items.length === 0
          ? <p className="text-sm text-gray-400">No artifacts found.</p>
          : (
            <div className="space-y-3">
              {items.map(a => {
                let tags = []
                try { tags = typeof a.tags === 'string' ? JSON.parse(a.tags || '[]') : (a.tags ?? []) } catch { }
                return (
                  <div key={a.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{a.title}</span>
                        <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{a.artifact_key}</code>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="text-xs text-gray-500">{a.category} {tags.length ? '· ' + tags.join(', ') : ''}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Created {fmtDate(a.created_at)} by {a.created_by ?? 'system'}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => changeStatus(a.id, 'pending_review')}
                        className="action-btn bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Submit for Review</button>
                      <button onClick={() => changeStatus(a.id, 'published')}
                        className="action-btn bg-blue-100 text-blue-800 hover:bg-blue-200">Publish</button>
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
