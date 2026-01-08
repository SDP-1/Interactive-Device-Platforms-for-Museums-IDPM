import { useState, useEffect } from 'react'
import { askQuestion, getExampleQuestions, checkHealth } from './services/api'
import StoryAnswer from './components/StoryAnswer'
import HomePage from './components/HomePage'
import { 
  Landmark, 
  Mic, 
  Send, 
  Play, 
  Globe, 
  Triangle, 
  Crown, 
  Bell, 
  TreePine, 
  Drum,
  Loader2,
  CircleHelp,
  ArrowLeft
} from 'lucide-react'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'ask', 'answer'
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [examples, setExamples] = useState([])
  const [backendStatus, setBackendStatus] = useState('checking')
  const [isPlaying, setIsPlaying] = useState(false)

  // Check backend health with retry
  const checkBackendHealth = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await checkHealth()
        setBackendStatus('connected')
        return true
      } catch (err) {
        console.log(`Health check attempt ${i + 1} failed, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
      }
    }
    setBackendStatus('disconnected')
    return false
  }

  // Check backend health on mount and periodically
  useEffect(() => {
    checkBackendHealth()
    
    // Load example questions
    getExampleQuestions()
      .then(data => setExamples(data.examples || []))
      .catch(err => console.error('Failed to load examples:', err))

    // Periodically check backend health every 10 seconds
    const healthInterval = setInterval(() => {
      checkHealth()
        .then(() => setBackendStatus('connected'))
        .catch(() => setBackendStatus('disconnected'))
    }, 10000)

    return () => clearInterval(healthInterval)
  }, [])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError(null)
    setAnswer(null)

    try {
      const response = await askQuestion(question)
      setAnswer(response)
      setCurrentPage('answer')
    } catch (err) {
      setError('Failed to get answer. Please make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (example) => {
    setQuestion(example)
  }

  const handleListenClick = () => {
    if (!question.trim()) {
      handleSubmit()
    }
    setIsPlaying(!isPlaying)
  }

  const handleAskAnother = () => {
    setAnswer(null)
    setQuestion('')
    setError(null)
    setCurrentPage('ask')
  }

  // Navigation handler for HomePage
  const handleNavigate = (page, prefillQuestion = null) => {
    if (prefillQuestion) {
      setQuestion(`Tell me about ${prefillQuestion}`)
    }
    setCurrentPage(page)
  }

  const handleGoHome = () => {
    setCurrentPage('home')
    setAnswer(null)
    setQuestion('')
    setError(null)
  }

  // Default examples if API fails
  const displayExamples = examples.length > 0 ? examples : [
    "Why was Sigiriya built on a rock?",
    "What happened during King Dutugemunu's reign?"
  ]

  // Show HomePage (Dashboard)
  if (currentPage === 'home') {
    return (
      <HomePage 
        onNavigate={handleNavigate}
        backendStatus={backendStatus}
      />
    )
  }

  // Show Story Answer page when we have an answer
  if (answer && currentPage === 'answer') {
    return (
      <StoryAnswer 
        answer={answer}
        question={question}
        onAskAnother={handleAskAnother}
      />
    )
  }

  // Show Question Screen (Ask Page)
  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D97706] rounded-lg flex items-center justify-center">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-stone-800">
              Ask About Sri Lankan History
            </h1>
      </div>
          <div className="flex items-center gap-4">
            <button className="text-[#D97706] hover:text-[#B45309] transition-colors">
              <Globe className="w-6 h-6" />
            </button>
            <button 
              onClick={handleGoHome}
              className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#D97706] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CircleHelp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-stone-800 mb-4">
            Discover Sri Lankan History
          </h2>
          <p className="text-stone-600 text-lg max-w-xl mx-auto">
            Ask any question about our rich heritage and let AI bring the stories to life through immersive narration
        </p>
      </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 className="text-xl font-semibold text-stone-800 text-center mb-6">
            What would you like to know?
          </h3>
          
          {/* Question Input */}
          <div className="relative mb-6">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your question..."
              className="w-full px-5 py-4 pr-14 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] outline-none transition-all duration-200 resize-none text-stone-700 placeholder-stone-400"
              rows={3}
              disabled={loading}
            />
            <button 
              onClick={question.trim() ? handleSubmit : undefined}
              className={`absolute right-3 top-3 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                question.trim() 
                  ? 'bg-[#D97706] hover:bg-[#B45309] hover:scale-105' 
                  : 'bg-[#D97706] hover:bg-[#B45309]'
              }`}
              title={question.trim() ? "Send question" : "Voice input"}
              disabled={loading}
            >
              {question.trim() ? (
                <Send className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Example Questions */}
          <div className="mb-6">
            <p className="text-stone-500 text-center mb-4">Try these example questions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleExampleClick(displayExamples[0])}
                className="flex items-start gap-3 p-4 bg-stone-50 hover:bg-stone-100 rounded-xl text-left transition-colors border border-stone-200"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Triangle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-stone-700 text-sm">"{displayExamples[0]}"</span>
              </button>
              <button
                onClick={() => handleExampleClick(displayExamples[1] || displayExamples[0])}
                className="flex items-start gap-3 p-4 bg-stone-50 hover:bg-stone-100 rounded-xl text-left transition-colors border border-stone-200"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-stone-700 text-sm">"{displayExamples[1] || "What happened during King Dutugemunu's reign?"}"</span>
              </button>
            </div>
          </div>

          {/* Listen Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
            className="w-full bg-[#D97706] hover:bg-[#B45309] disabled:opacity-100 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Listen to the Story
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* AI Narration Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-stone-800 text-center mb-6">
            AI Narration Status
          </h3>
          
          {/* Sound Wave Animation */}
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 bg-[#FDBA74] rounded-full ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
                style={{
                  height: `${20 + Math.random() * 30}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>

          {/* Sound Options */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm text-stone-600">Temple Bells</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <TreePine className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm text-stone-600">Forest Sounds</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                <Drum className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm text-stone-600">Traditional Drums</span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex justify-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              backendStatus === 'connected' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span className="text-sm font-medium">
                {backendStatus === 'connected' 
                  ? 'Ready to narrate your story' 
                  : 'Backend disconnected'}
              </span>
              {backendStatus === 'disconnected' && (
                <button
                  onClick={() => {
                    setBackendStatus('checking')
                    checkBackendHealth()
                  }}
                  className="ml-2 text-xs underline hover:no-underline"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-800 text-white py-6 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D97706] rounded-lg flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">Sri Lankan Heritage</span>
          </div>
          <p className="text-stone-400 text-sm">
            Preserving our rich cultural heritage through technology
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
