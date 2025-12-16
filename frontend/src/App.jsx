import { useState, useEffect } from 'react'
import { askQuestion, getExampleQuestions, checkHealth } from './services/api'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [examples, setExamples] = useState([])
  const [backendStatus, setBackendStatus] = useState('checking')

  // Check backend health on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('connected'))
      .catch(() => setBackendStatus('disconnected'))
    
    // Load example questions
    getExampleQuestions()
      .then(data => setExamples(data.examples || []))
      .catch(err => console.error('Failed to load examples:', err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError(null)
    setAnswer(null)

    try {
      const response = await askQuestion(question)
      setAnswer(response)
    } catch (err) {
      setError('Failed to get answer. Please make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (example) => {
    setQuestion(example)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-800 to-orange-900 text-white py-6 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                🇱🇰 Sri Lankan History
              </h1>
              <p className="text-amber-200 mt-1">
                Interactive Museum Q&A System
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                backendStatus === 'connected' ? 'bg-green-400' : 
                backendStatus === 'disconnected' ? 'bg-red-400' : 'bg-yellow-400'
              }`}></span>
              <span className="text-sm text-amber-200">
                {backendStatus === 'connected' ? 'Backend Connected' : 
                 backendStatus === 'disconnected' ? 'Backend Offline' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Question Input Card */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">
            Ask about Sri Lankan History
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is the Anuradhapura Kingdom?"
                className="input-field text-lg"
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Ask Question'
              )}
            </button>
          </form>

          {/* Example Questions */}
          {examples.length > 0 && (
            <div className="mt-6 pt-6 border-t border-stone-200">
              <p className="text-sm text-stone-500 mb-3">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="btn-secondary text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Answer Card */}
        {answer && (
          <div className="card bg-gradient-to-br from-white to-amber-50 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📖</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                  Answer
                </h3>
                <p className="text-stone-700 leading-relaxed text-lg">
                  {answer.answer}
                </p>
                {answer.info && (
                  <p className="text-sm text-stone-500 mt-4 pt-4 border-t border-amber-200">
                    ℹ️ {answer.info}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-800 text-stone-400 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Interactive Device Platforms for Museums • 4th Year Research Project
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
