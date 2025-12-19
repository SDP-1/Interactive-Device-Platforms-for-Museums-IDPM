import { useState, useEffect, useRef } from 'react'
import { 
  Mic, 
  Play, 
  Pause,
  Settings,
  HelpCircle,
  RotateCcw,
  MessageSquare,
  MapPin,
  Calendar,
  Crown,
  Circle,
  Maximize2,
  Minimize2
} from 'lucide-react'

function StoryAnswer({ answer, question, onAskAnother }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoContainerRef = useRef(null)
  const totalTime = 208 // 3:28 in seconds

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return

    if (!document.fullscreenElement) {
      try {
        await videoContainerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } catch (err) {
        console.error('Error entering fullscreen:', err)
      }
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  // Simulate playback progress
  useEffect(() => {
    let interval
    if (isPlaying && currentTime < totalTime) {
      interval = setInterval(() => {
        setCurrentTime(prev => Math.min(prev + 1, totalTime))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentTime])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = (currentTime / totalTime) * 100

  // Extract topic info from answer (can be enhanced based on your data)
  const topicInfo = {
    location: "Sigiriya, Sri Lanka",
    era: "5th Century CE",
    period: "King Kashyapa Era"
  }

  // Get title from question or use default
  const storyTitle = question?.includes('Sigiriya') 
    ? 'The Majesty of Sigiriya' 
    : question?.includes('Dutugemunu')
    ? 'The Legend of King Dutugemunu'
    : 'The Story of History'

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D97706] rounded-full flex items-center justify-center">
              <Circle className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-xl font-bold text-stone-800">
              AI Historical Narration
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-stone-600 hover:text-stone-800 transition-colors">
              <Settings className="w-6 h-6" />
            </button>
            <button className="text-stone-600 hover:text-stone-800 transition-colors">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          
          {/* Left Side - Image Card */}
          <div 
            ref={videoContainerRef}
            className={`relative rounded-2xl overflow-hidden shadow-xl flex-1 aspect-video ${isFullscreen ? 'bg-black' : ''}`}
          >
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Background Image - Sunset/Sigiriya style */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-400 via-orange-500 to-stone-900" />
            
            {/* Sun */}
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-yellow-300 to-orange-500 rounded-full blur-sm opacity-90" />
            
            {/* Mountain silhouettes */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 400 150" className="w-full h-auto">
                <path d="M0,150 L0,100 Q50,60 100,90 Q150,50 200,80 Q250,40 300,70 Q350,30 400,60 L400,150 Z" fill="#292524" />
                <path d="M0,150 L0,120 Q80,90 160,110 Q240,80 320,100 L400,90 L400,150 Z" fill="#1c1917" />
              </svg>
            </div>
            
            {/* Rock fortress silhouette (Sigiriya-like) */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-40 bg-stone-800 rounded-t-lg relative">
                {/* Small structure on top */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-stone-700" />
                <div className="absolute -top-2 left-1/4 w-1 h-4 bg-stone-600" />
              </div>
            </div>
            
            {/* Title Badge */}
            <div className="absolute top-6 left-6 z-10">
              <div className="bg-[#D97706] text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                {storyTitle}
              </div>
            </div>
            
            {/* Story Text Overlay - Hidden in fullscreen */}
            {!isFullscreen && (
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <p className="text-stone-700 text-sm leading-relaxed">
                    "{answer?.answer?.substring(0, 180) || 'Rising from the emerald plains of Sri Lanka, Sigiriya stands as a testament to the architectural genius of King Kashyapa...'}..."
                  </p>
                </div>
              </div>
            )}

            {/* Fullscreen Audio Controls */}
            {isFullscreen && (
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-16">
                {/* Story Text in Fullscreen */}
                <div className="max-w-4xl mx-auto mb-6">
                  <p className="text-white text-lg leading-relaxed text-center">
                    "{answer?.answer?.substring(0, 300) || 'Rising from the emerald plains of Sri Lanka, Sigiriya stands as a testament to the architectural genius of King Kashyapa...'}..."
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="max-w-4xl mx-auto mb-4">
                  <div className="h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                    <div 
                      className="h-full bg-[#D97706] rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-white/70 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(totalTime)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex justify-center items-center gap-6">
                  <button 
                    onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                    title="Rewind 10s"
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 bg-[#D97706] hover:bg-[#B45309] rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                  <button 
                    onClick={() => setCurrentTime(Math.min(totalTime, currentTime + 10))}
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors rotate-180"
                    title="Forward 10s"
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Narrator Panel */}
          <div className="space-y-4 w-full lg:w-[420px] lg:ml-auto lg:mr-0 lg:flex-shrink-0">
            {/* AI Narrator Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Mic Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-[#D97706] rounded-full flex items-center justify-center shadow-lg">
                  <Mic className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-stone-800 text-center mb-2">
                AI Narrator Active
              </h3>
              <p className="text-stone-500 text-center text-sm mb-6">
                Bringing history to life through immersive storytelling
              </p>

              {/* Sound Wave Animation */}
              <div className="flex justify-center items-end gap-1 h-12 mb-6">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-[#D97706] rounded-full transition-all duration-150"
                    style={{
                      height: isPlaying 
                        ? `${12 + Math.sin(Date.now() / 200 + i * 0.8) * 15 + 10}px` 
                        : '8px',
                    }}
                  />
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#D97706] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm text-stone-500 mb-6">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalTime)}</span>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 bg-[#D97706] hover:bg-[#B45309] rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 text-white" />
                  ) : (
                    <Play className="w-7 h-7 text-white ml-1" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    setCurrentTime(0)
                    setIsPlaying(true)
                  }}
                  className="w-12 h-12 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-5 h-5 text-stone-600" />
                </button>
                <button className="w-12 h-12 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center transition-colors">
                  <HelpCircle className="w-5 h-5 text-stone-600" />
                </button>
              </div>
            </div>

            {/* Replay Story Button */}
            <button 
              onClick={() => {
                setCurrentTime(0)
                setIsPlaying(true)
              }}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-md"
            >
              <RotateCcw className="w-5 h-5" />
              Replay Story
            </button>

            {/* Ask Another Question Button */}
            <button 
              onClick={onAskAnother}
              className="w-full bg-white hover:bg-stone-50 text-stone-700 font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-md border border-stone-200"
            >
              <MessageSquare className="w-5 h-5" />
              Ask Another Question
            </button>

            {/* Current Topic Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-stone-800 mb-4">Current Topic</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-stone-600">
                  <MapPin className="w-5 h-5 text-[#D97706]" />
                  <span className="text-sm">{topicInfo.location}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-600">
                  <Calendar className="w-5 h-5 text-[#92400E]" />
                  <span className="text-sm">{topicInfo.era}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-600">
                  <Crown className="w-5 h-5 text-[#78350F]" />
                  <span className="text-sm">{topicInfo.period}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StoryAnswer

