import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

function TopicField({ label, topicVal, descVal, onChangeTopic, onChangeDesc }) {
  const textareaRef = React.useRef(null)

  // Auto-grow each topic textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [descVal])

  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{label}</div>
      <input
        type="text"
        className="w-full text-sm font-semibold px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/50 bg-white transition-all"
        value={topicVal}
        onChange={e => onChangeTopic(e.target.value)}
        placeholder="Topic title…"
      />
      <textarea
        ref={textareaRef}
        className="w-full text-sm px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/50 bg-white overflow-hidden resize-none leading-relaxed transition-all"
        value={descVal}
        onChange={e => onChangeDesc(e.target.value)}
        style={{ minHeight: '160px' }}
        placeholder="Topic description…"
      />
    </div>
  )
}

function ReadOnlyTopic({ topic, desc }) {
  if (!topic && !desc) return null
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-xs">
      <div className="font-semibold text-gray-700 mb-1">{topic}</div>
      <div className="text-gray-500 whitespace-pre-wrap leading-relaxed">{desc ?? ''}</div>
    </div>
  )
}

export default function EditableScenario({ id, content, editedContent, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const currentContent = editedContent || content || {}

  const [val, setVal] = useState({
    answerTopic1: currentContent.answerTopic1 || '',
    answerDescription1: currentContent.answerDescription1 || '',
    answerTopic2: currentContent.answerTopic2 || '',
    answerDescription2: currentContent.answerDescription2 || '',
    answerTopic3: currentContent.answerTopic3 || '',
    answerDescription3: currentContent.answerDescription3 || '',
  })
  const [notes, setNotes] = useState('')

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
    setVal({
      answerTopic1: currentContent.answerTopic1 || '',
      answerDescription1: currentContent.answerDescription1 || '',
      answerTopic2: currentContent.answerTopic2 || '',
      answerDescription2: currentContent.answerDescription2 || '',
      answerTopic3: currentContent.answerTopic3 || '',
      answerDescription3: currentContent.answerDescription3 || '',
    })
    setIsEditing(false)
  }

  return (
    <div className="mb-4">
      {/* Full-screen modal portal */}
      {isEditing && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-serif">Edit Scenario Topics</h2>
                <p className="text-xs text-slate-500 mt-0.5">All three topics are shown at once — no scrollbar needed.</p>
              </div>
              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-600 text-sm transition-colors"
              >✕</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <TopicField
                  label="Topic 1"
                  topicVal={val.answerTopic1}
                  descVal={val.answerDescription1}
                  onChangeTopic={v => setVal({ ...val, answerTopic1: v })}
                  onChangeDesc={v => setVal({ ...val, answerDescription1: v })}
                />
                <TopicField
                  label="Topic 2"
                  topicVal={val.answerTopic2}
                  descVal={val.answerDescription2}
                  onChangeTopic={v => setVal({ ...val, answerTopic2: v })}
                  onChangeDesc={v => setVal({ ...val, answerDescription2: v })}
                />
                <TopicField
                  label="Topic 3"
                  topicVal={val.answerTopic3}
                  descVal={val.answerDescription3}
                  onChangeTopic={v => setVal({ ...val, answerTopic3: v })}
                  onChangeDesc={v => setVal({ ...val, answerDescription3: v })}
                />
              </div>

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

      {/* Read-only row */}
      <div className="flex justify-between items-center mb-2">
        {editedContent  && <div className="text-xs text-indigo-600 font-medium">✏️ Curator-edited version:</div>}
        {!editedContent && <div className="text-xs text-gray-500 font-medium">AI Generated Scenario:</div>}
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
        >
          ✏️ Edit Setup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ReadOnlyTopic topic={currentContent.answerTopic1} desc={currentContent.answerDescription1} />
        <ReadOnlyTopic topic={currentContent.answerTopic2} desc={currentContent.answerDescription2} />
        <ReadOnlyTopic topic={currentContent.answerTopic3} desc={currentContent.answerDescription3} />
      </div>

      {editedContent && content && (
        <details className="text-xs text-gray-400 mt-2">
          <summary className="cursor-pointer hover:text-gray-600">Show original AI text</summary>
          <div className="mt-2 bg-gray-100 rounded p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <ReadOnlyTopic topic={content.answerTopic1} desc={content.answerDescription1} />
            <ReadOnlyTopic topic={content.answerTopic2} desc={content.answerDescription2} />
            <ReadOnlyTopic topic={content.answerTopic3} desc={content.answerDescription3} />
          </div>
        </details>
      )}
    </div>
  )
}