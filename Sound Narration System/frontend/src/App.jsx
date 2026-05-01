import { useState, useEffect, useMemo, useRef } from 'react'
import { askQuestion, getExampleQuestions, checkHealth } from './services/api'
import StoryAnswer from './components/StoryAnswer'
import HomePage from './components/HomePage'
import logo from './assets/logo.png'
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

// Start on Ask screen when opened from kiosk (e.g. ?page=ask)
function getInitialPage() {
  if (typeof window === 'undefined') return 'home'
  const params = new URLSearchParams(window.location.search)
  return params.get('page') === 'ask' ? 'ask' : 'home'
}

function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage) // 'home', 'ask', 'answer'
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [examples, setExamples] = useState([])
  const [backendStatus, setBackendStatus] = useState('checking')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const equalizerHeights = useMemo(() => [22, 34, 28, 38, 26], [])
  const recognitionRef = useRef(null)

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setQuestion(transcript.trim())
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
      setError('Voice input failed. Please try again.')
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
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
    if (!speechSupported || !recognitionRef.current) {
      setError('Voice input is not supported in this browser.')
      return
    }

    setError(null)

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
      setError('Could not start voice input. Please try again.')
    }
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
    "What happened during King Dutugemunu's reign?",
    "How did the Kingdom of Kandy resist colonial rule?"
  ]

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

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
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur py-3 px-4 md:px-6 shadow-sm sticky top-0 z-30">
        <div className="w-full max-w-[1780px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl border border-stone-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
              <img src={logo} alt="Museum logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-stone-800 leading-tight">
                Sri Lankan History Narrator
              </h1>
              <p className="text-xs md:text-sm text-stone-500">
                Interactive Museum Kiosk
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50">
              <span className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
              <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                {backendStatus === 'connected' ? 'Online' : 'Offline'}
              </span>
            </div>
            <button className="w-10 h-10 rounded-xl border border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </button>
            <a 
              href="http://localhost:8000/kiosk_home.html"
              className="bg-white hover:bg-orange-500 border-2 border-orange-500 text-orange-500 hover:text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors no-underline font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1780px] mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col">
        <section className="mb-5 bg-[#292524] rounded-3xl p-6 md:p-8 xl:p-10 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-wider mb-4">
                <CircleHelp className="w-4 h-4" />
                Museum Kiosk Assistant
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                Ask and listen instantly
              </h2>
              <p className="text-white/80 text-lg">
                Touch a sample question or type your own. The AI narrator will generate an immersive story in seconds.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[220px] xl:min-w-[260px]">
              <div className="col-span-2 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-orange-300 leading-none">
                  {formatTime(currentTime)}
                </p>
                <p className="text-sm md:text-base font-semibold text-orange-200 mt-1">
                  {formatDate(currentTime)}
                </p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-white/70">Session</p>
                <p className="text-sm font-semibold">Walk-in Visitor</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-white/70">Mode</p>
                <p className="text-sm font-semibold">Touch + Audio</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6 mb-5">
          <div className="xl:col-span-8 2xl:col-span-9 bg-white border border-stone-200 rounded-3xl shadow-xl p-5 md:p-7 xl:p-8">
            <h3 className="text-2xl font-semibold text-stone-800 mb-4">
              What do you want to explore?
            </h3>

            <div className="relative mb-5">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: Why was Sigiriya built on a rock fortress?"
                className="w-full px-5 py-5 pr-16 border-2 border-stone-300 bg-white rounded-2xl focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500 outline-none transition-all duration-200 resize-none text-stone-700 placeholder-stone-400 text-lg"
                rows={4}
                disabled={loading}
              />
              <button
                onClick={question.trim() ? handleSubmit : handleListenClick}
                className={`absolute right-4 top-4 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  question.trim()
                    ? 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
                    : isListening
                    ? 'bg-orange-700 hover:bg-orange-800 animate-pulse'
                    : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
                }`}
                title={question.trim() ? "Send question" : isListening ? "Stop voice input" : "Start voice input"}
                disabled={loading}
              >
                {question.trim() ? (
                  <Send className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            <p className="text-stone-500 mb-3 text-sm uppercase tracking-wide">
              Quick start prompts
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              <button
                onClick={() => handleExampleClick(displayExamples[0])}
                className="flex items-start gap-3 p-4 bg-stone-50 hover:bg-orange-50 rounded-2xl text-left transition-colors border border-stone-200 hover:border-orange-200"
              >
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Triangle className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-stone-700">"{displayExamples[0]}"</span>
              </button>
              <button
                onClick={() => handleExampleClick(displayExamples[1] || displayExamples[0])}
                className="flex items-start gap-3 p-4 bg-stone-50 hover:bg-orange-50 rounded-2xl text-left transition-colors border border-stone-200 hover:border-orange-200"
              >
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-stone-700">"{displayExamples[1] || "What happened during King Dutugemunu's reign?"}"</span>
              </button>
              <button
                onClick={() => handleExampleClick(displayExamples[2] || displayExamples[0])}
                className="flex items-start gap-3 p-4 bg-stone-50 hover:bg-orange-50 rounded-2xl text-left transition-colors border border-stone-200 hover:border-orange-200"
              >
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-stone-700">"{displayExamples[2] || "How did the Kingdom of Kandy resist colonial rule?"}"</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading || !question.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-orange-900/20 hover:-translate-y-0.5 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Story...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Narration
                  </>
                )}
              </button>
              <button
                onClick={() => setQuestion('')}
                className="w-full bg-white hover:bg-stone-50 text-stone-700 font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors border border-stone-300 text-lg"
              >
                Clear Question
              </button>
            </div>
          </div>

          <div className="xl:col-span-4 2xl:col-span-3 bg-white border border-stone-200 rounded-3xl shadow-xl p-5 md:p-6 xl:p-7">
            <h3 className="text-xl font-semibold text-stone-800 mb-2">Narration Console</h3>
            <p className="text-sm text-stone-500 mb-6">Audio mood presets and backend health</p>

            <div className="flex justify-center gap-1 mb-6">
              {equalizerHeights.map((barHeight, i) => (
                <div
                  key={i}
                  className={`w-2 bg-orange-300 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                  style={{ height: `${barHeight}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-800">Temple Bells</p>
                  <p className="text-xs text-stone-500">Traditional ambience</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-800">Forest Sounds</p>
                  <p className="text-xs text-stone-500">Calm environmental tone</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Drum className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-800">Traditional Drums</p>
                  <p className="text-xs text-stone-500">Festive story atmosphere</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                backendStatus === 'connected'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  backendStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}></span>
                <span className="text-sm font-medium">
                  {backendStatus === 'connected' ? 'System Ready' : 'Backend Offline'}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-stone-500">Audience</p>
                <p className="text-sm font-semibold text-stone-800">General Public</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-stone-500">Session</p>
                <p className="text-sm font-semibold text-stone-800">Kiosk Touch</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-stone-200 rounded-3xl shadow-xl p-5 md:p-6 flex-1 min-h-[220px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-stone-800">How to use this kiosk</h3>
            <p className="text-sm text-stone-500">Fast 3-step flow for visitors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500 mb-2">Step 1</p>
              <p className="font-semibold text-stone-800">Ask a question</p>
              <p className="text-sm text-stone-500 mt-1">Type your own or tap from the inspiration stream.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500 mb-2">Step 2</p>
              <p className="font-semibold text-stone-800">Start narration</p>
              <p className="text-sm text-stone-500 mt-1">Press Start Narration to generate the audio story.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500 mb-2">Step 3</p>
              <p className="font-semibold text-stone-800">Enjoy immersive playback</p>
              <p className="text-sm text-stone-500 mt-1">Use fullscreen and replay controls for kiosk mode.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-[#57534E] p-4 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm md:text-base font-medium">Narration engine is optimized for museum walk-in visitors.</p>
              <div className="flex items-center gap-1.5">
                {[...Array(6)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-orange-300 animate-pulse"
                    style={{ height: `${10 + i * 3}px`, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl mb-6">
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white text-stone-800 py-6 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">Sri Lankan Heritage</span>
          </div>
          <p className="text-stone-500 text-sm">
            Preserving our rich cultural heritage through technology
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
