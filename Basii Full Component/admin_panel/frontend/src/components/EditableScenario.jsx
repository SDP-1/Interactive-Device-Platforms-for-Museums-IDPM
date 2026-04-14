import React, { useState } from 'react'

function EditableTopic({ label, topicVal, descVal, onChangeTopic, onChangeDesc }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-xs border border-indigo-200">
      <div className="font-semibold text-indigo-700 mb-1">{label}</div>
      <div className="space-y-2">
        <input 
          type="text" 
          className="w-full text-sm p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
          value={topicVal}
          onChange={e => onChangeTopic(e.target.value)}
          placeholder="Topic title"
        />
        <textarea 
          className="w-full text-sm p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[250px] resize-y"
          value={descVal}
          onChange={e => onChangeDesc(e.target.value)}
          rows={12}
          placeholder="Topic description"
        />
      </div>
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

  if (isEditing) {
    return (
      <div className="space-y-3 mb-4 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-semibold text-indigo-700">Editing Scenario Topics</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EditableTopic 
            label="Topic 1"
            topicVal={val.answerTopic1} descVal={val.answerDescription1}
            onChangeTopic={v => setVal({...val, answerTopic1: v})}
            onChangeDesc={v => setVal({...val, answerDescription1: v})}
          />
          <EditableTopic 
            label="Topic 2"
            topicVal={val.answerTopic2} descVal={val.answerDescription2}
            onChangeTopic={v => setVal({...val, answerTopic2: v})}
            onChangeDesc={v => setVal({...val, answerDescription2: v})}
          />
          <EditableTopic 
            label="Topic 3"
            topicVal={val.answerTopic3} descVal={val.answerDescription3}
            onChangeTopic={v => setVal({...val, answerTopic3: v})}
            onChangeDesc={v => setVal({...val, answerDescription3: v})}
          />
        </div>
        
        <input
          type="text"
          placeholder="Notes (optional)"
          className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-2 mt-3 p-1">
          <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-1.5 text-sm rounded hover:bg-indigo-700 font-medium">Save Changes</button>
          <button onClick={handleCancel} className="bg-gray-200 text-gray-800 px-4 py-1.5 text-sm rounded hover:bg-gray-300 font-medium">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        {editedContent && <div className="text-xs text-indigo-600 font-medium">✏️ Curator-edited version:</div>}
        {!editedContent && <div className="text-xs text-gray-500 font-medium">AI Generated Scenario:</div>}
        <button onClick={() => setIsEditing(true)} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border border-gray-200 text-gray-700 font-medium">
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