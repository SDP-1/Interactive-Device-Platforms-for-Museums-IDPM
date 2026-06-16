import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function EditableExplanation({ id, original, edited, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(edited || original)
  const [notes, setNotes] = useState('')
  const textareaRef = useRef(null)

  // Auto-grow textarea so all content shows without a scrollbar
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [val, isEditing])

  // Lock page scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isEditing ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isEditing])

  const handleSave = () => {
    onSave(id, val, notes)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setVal(edited || original)
    setIsEditing(false)
  }

  return (
    <div className="space-y-1 mb-3">
      {/* Full-screen modal portal — rendered outside the card's DOM to avoid clipping */}
      {isEditing && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-serif">Edit Explanation</h2>
                <p className="text-xs text-slate-500 mt-0.5">The textarea grows automatically — no scrollbar needed.</p>
              </div>
              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-600 text-sm transition-colors"
              >✕</button>
            </div>

            {/* Body — only this area scrolls if content is extremely long */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              <textarea
                ref={textareaRef}
                className="w-full text-sm p-5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-slate-50 font-serif leading-relaxed text-slate-800 overflow-hidden resize-none transition-all shadow-inner"
                value={val}
                style={{ minHeight: '300px' }}
                onChange={(e) => setVal(e.target.value)}
                placeholder="Write explanation here…"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Curator Notes (optional)
                </label>
                <input
                  type="text"
                  placeholder="Add a note about these edits…"
                  className="w-full text-sm px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-slate-50 transition-all"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Read-only view always rendered in place */}
      <div className="flex justify-between items-center">
        {edited  && <div className="text-xs text-indigo-600 font-medium">✏️ Curator-edited version:</div>}
        {!edited && <div className="text-xs text-gray-500 font-medium">AI Generated Explanation:</div>}
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
        >
          ✏️ Edit
        </button>
      </div>

      <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
        {edited || original}
      </div>

      {edited && (
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600">Show original AI text</summary>
          <div className="mt-1 bg-gray-100 rounded p-2 whitespace-pre-wrap">{original}</div>
        </details>
      )}
    </div>
  )
}