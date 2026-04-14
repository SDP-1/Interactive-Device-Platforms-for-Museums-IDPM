import React, { useState } from 'react'

export default function EditableExplanation({ id, original, edited, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(edited || original)
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    onSave(id, val, notes)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2 mb-3 bg-gray-50 p-3 rounded-lg border border-indigo-200">
        <div className="text-xs font-semibold text-indigo-700">Editing Explanation</div>
        <textarea
          className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[300px] resize-y"
          rows={16}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-indigo-600 text-white px-3 py-1 text-sm rounded hover:bg-indigo-700">Save</button>
          <button onClick={() => { setIsEditing(false); setVal(edited || original); }} className="bg-gray-200 text-gray-700 px-3 py-1 text-sm rounded hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center">
        {edited && <div className="text-xs text-indigo-600 font-medium">✏️ Curator-edited version:</div>}
        {!edited && <div className="text-xs text-gray-500 font-medium">AI Generated Explanation:</div>}
        <button onClick={() => setIsEditing(true)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-200">
          ✏️ Edit
        </button>
      </div>
      <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 overflow-y-auto whitespace-pre-wrap leading-relaxed">
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