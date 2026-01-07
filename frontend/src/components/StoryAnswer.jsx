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
  Minimize2,
  Video,
  VideoOff
} from 'lucide-react'

function StoryAnswer({ answer, question, onAskAnother }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(true)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoContainerRef = useRef(null)
  const videoRef = useRef(null)
  const utteranceRef = useRef(null)
  const speechStartTimeRef = useRef(null)
  const sentenceStartIndicesRef = useRef([])
  
  // Get the story text from answer
  const storyText = answer?.answer || 'Rising from the emerald plains of Sri Lanka, Sigiriya stands as a testament to the architectural genius of King Kashyapa. This ancient rock fortress rises nearly 200 meters above the surrounding jungle.'
  
  // Get video info from API response (vector DB match)
  const videoInfo = answer?.video || null
  
  // Split story into sentences for highlighting
  const sentences = storyText.split(/(?<=[.!?])\s+/).filter(s => s.trim())
  
  // Calculate sentence start indices for accurate tracking
  useEffect(() => {
    let charIndex = 0
    const startIndices = []
    for (const sentence of sentences) {
      startIndices.push(charIndex)
      charIndex += sentence.length + 1 // +1 for space
    }
    sentenceStartIndicesRef.current = startIndices
  }, [sentences])
  
  // Estimate total time based on text length (slower rate: 0.85 * 150 = ~127 words per minute)
  const wordCount = storyText.split(/\s+/).length
  const totalTime = Math.ceil((wordCount / 127) * 60) // seconds - adjusted for slower speech rate
  
  // Calculate time per sentence (proportional to word count)
  const sentenceTimings = sentences.map(sentence => {
    const words = sentence.split(/\s+/).length
    return (words / wordCount) * totalTime
  })

  // Initialize speech synthesis
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSpeechSupported(false)
      console.warn('Text-to-speech not supported in this browser')
      return
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(storyText)
    utterance.rate = 0.85 // Slower for clarity
    utterance.pitch = 1.05 // Slightly higher for feminine voice
    utterance.volume = 1
    
    // Try to use a clear female English voice
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const englishVoices = voices.filter(v => v.lang.startsWith('en'))
      
      // Priority list of clear female voices (common across platforms)
      const femaleVoiceNames = [
        'Samantha',      // macOS - very clear
        'Karen',         // macOS Australian
        'Victoria',      // macOS
        'Fiona',         // macOS Scottish
        'Moira',         // macOS Irish
        'Tessa',         // macOS South African
        'Zira',          // Windows
        'Hazel',         // Windows UK
        'Susan',         // Windows UK
        'Google UK English Female',
        'Google US English',
        'Microsoft Zira',
        'Microsoft Hazel',
        'female',        // Generic match
        'Female',
        'Natural',       // High quality voices
        'Enhanced',
        'Premium'
      ]
      
      // Find the best female voice
      let selectedVoice = null
      for (const name of femaleVoiceNames) {
        selectedVoice = englishVoices.find(v => 
          v.name.includes(name) || v.name.toLowerCase().includes(name.toLowerCase())
        )
        if (selectedVoice) break
      }
      
      // Fallback to any English voice
      if (!selectedVoice && englishVoices.length > 0) {
        selectedVoice = englishVoices[0]
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log('Using voice:', selectedVoice.name, selectedVoice.lang)
      }
    }
    
    // Voices may load asynchronously
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice()
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice
    }

    // Use onboundary event for accurate sentence tracking
    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.name === 'sentence') {
        const charIndex = event.charIndex
        // Find which sentence this character belongs to
        const startIndices = sentenceStartIndicesRef.current
        for (let i = startIndices.length - 1; i >= 0; i--) {
          if (charIndex >= startIndices[i]) {
            setCurrentSentenceIndex(i)
            break
          }
        }
      }
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setCurrentTime(totalTime)
      setCurrentSentenceIndex(sentences.length - 1) // Highlight last sentence at end
    }

    utterance.onerror = (e) => {
      console.error('Speech error:', e)
      setIsPlaying(false)
    }

    utteranceRef.current = utterance

    // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [storyText, totalTime])

  // Sync video with audio playback
  useEffect(() => {
    if (videoRef.current && videoInfo && videoLoaded && !videoError) {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error('Video play error:', err)
        })
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying, videoInfo, videoLoaded, videoError])

  // Handle play/pause
  const togglePlayPause = () => {
    if (!isSpeechSupported) return

    if (isPlaying) {
      // Pause
      window.speechSynthesis.pause()
      setIsPlaying(false)
    } else {
      // Play or Resume
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      } else {
        // Start fresh
        window.speechSynthesis.cancel()
        if (utteranceRef.current) {
          speechStartTimeRef.current = Date.now()
          setCurrentTime(0)
          window.speechSynthesis.speak(utteranceRef.current)
        }
      }
      setIsPlaying(true)
    }
  }

  // Restart story from beginning
  const restartStory = () => {
    window.speechSynthesis.cancel()
    setCurrentTime(0)
    
    // Restart video from beginning
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
    
    if (utteranceRef.current) {
      speechStartTimeRef.current = Date.now()
      window.speechSynthesis.speak(utteranceRef.current)
      setIsPlaying(true)
    }
  }

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
  
  // Track playback progress (time only - sentence tracking is done via onboundary)
  useEffect(() => {
    let interval
    if (isPlaying && currentTime < totalTime) {
      interval = setInterval(() => {
        if (speechStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - speechStartTimeRef.current) / 1000)
          setCurrentTime(Math.min(elapsed, totalTime))
        }
      }, 500) // Update time less frequently since sentence tracking is event-based
    }
    return () => clearInterval(interval)
  }, [isPlaying, totalTime])
  
  // Reset sentence index when restarting
  useEffect(() => {
    if (currentTime === 0) {
      setCurrentSentenceIndex(isPlaying ? 0 : -1)
    }
  }, [currentTime, isPlaying])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = (currentTime / totalTime) * 100

  // Extract topic info from answer or video info
  const topicInfo = {
    location: answer?.info?.name || videoInfo?.topics?.[0] || "Sri Lanka",
    era: videoInfo?.era || answer?.info?.era || "Ancient Era",
    period: videoInfo?.topics?.[1] || "Historical Period"
  }

  // Get title from question, video info, or use default
  const getStoryTitle = () => {
    if (videoInfo?.topics?.[0]) {
      return `The Story of ${videoInfo.topics[0]}`
    }
    if (question?.toLowerCase().includes('sigiriya')) {
      return 'The Majesty of Sigiriya'
    }
    if (question?.toLowerCase().includes('dutugemunu')) {
      return 'The Legend of King Dutugemunu'
    }
    if (question?.toLowerCase().includes('anuradhapura')) {
      return 'Ancient Anuradhapura'
    }
    if (question?.toLowerCase().includes('kandy')) {
      return 'The Kingdom of Kandy'
    }
    return 'The Story of History'
  }
  
  const storyTitle = getStoryTitle()

  // Check if we should show video
  const showVideo = videoInfo && videoInfo.video_path && !videoError

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
          
          {/* Left Side - Video/Image Card */}
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

            {/* VIDEO DISPLAY - Show when video is available */}
            {showVideo ? (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  src={videoInfo.video_path}
                  poster={videoInfo.poster_path || undefined}
                  loop
                  muted
                  playsInline
                  onLoadedData={() => {
                    setVideoLoaded(true)
                    setVideoError(false)
                    console.log('Video loaded:', videoInfo.video_path)
                  }}
                  onError={(e) => {
                    console.error('Video failed to load:', videoInfo.video_path, e)
                    setVideoError(true)
                    setVideoLoaded(false)
                  }}
                />
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
              </>
            ) : (
              /* Fallback Background - Sunset/Sigiriya style when no video */
              <>
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
              </>
            )}
            
            {/* Title Badge */}
            <div className="absolute top-6 left-6 z-10">
              <div className="bg-[#D97706] text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                {storyTitle}
              </div>
              {/* Video indicator badge */}
              {videoInfo && (
                <div className={`mt-2 ${showVideo ? 'bg-green-600/80' : 'bg-stone-600/80'} text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2`}>
                  {showVideo ? (
                    <>
                      <Video className="w-3 h-3" />
                      Video Available
                    </>
                  ) : (
                    <>
                      <VideoOff className="w-3 h-3" />
                      Video Not Found
                    </>
                  )}
                </div>
              )}
              {/* Similarity score (for debugging) */}
              {videoInfo?.similarity && (
                <div className="mt-1 bg-black/50 text-white/70 px-2 py-0.5 rounded text-xs">
                  Match: {(videoInfo.similarity * 100).toFixed(1)}%
                </div>
              )}
            </div>
            
            {/* Story Text Overlay - Hidden in fullscreen */}
            {!isFullscreen && (
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="p-5">
                  <p className="text-xl leading-relaxed text-white drop-shadow-lg">
                    {/* Show current sentence and 1 sentence context (before/after) */}
                    {(() => {
                      const startIdx = Math.max(0, currentSentenceIndex - 1)
                      const endIdx = Math.min(sentences.length, Math.max(2, currentSentenceIndex + 2))
                      const visibleSentences = sentences.slice(startIdx, endIdx)
                      
                      return visibleSentences.map((sentence, i) => {
                        const actualIndex = startIdx + i
                        return (
                          <span
                            key={actualIndex}
                            className={`transition-all duration-500 drop-shadow-md ${
                              actualIndex === currentSentenceIndex
                                ? 'text-[#D97706] font-bold text-2xl'
                                : actualIndex < currentSentenceIndex
                                ? 'text-white/40 text-lg'
                                : 'text-white/60 text-lg'
                            }`}
                          >
                            {sentence}{' '}
                          </span>
                        )
                      })
                    })()}
                  </p>
                  {/* Part indicator */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-white/60 text-sm">
                      Part {Math.max(1, currentSentenceIndex + 1)} of {sentences.length}
                    </span>
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#D97706] rounded-full transition-all duration-300"
                        style={{ width: `${((currentSentenceIndex + 1) / sentences.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fullscreen Audio Controls */}
            {isFullscreen && (
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 pt-20">
                {/* Story Text in Fullscreen - Show only current part */}
                <div className="max-w-6xl mx-auto mb-8">
                  <p className="text-2xl leading-relaxed text-center">
                    {(() => {
                      // Show current sentence + 1 before and 1 after for context
                      const startIdx = Math.max(0, currentSentenceIndex - 1)
                      const endIdx = Math.min(sentences.length, Math.max(2, currentSentenceIndex + 2))
                      const visibleSentences = sentences.slice(startIdx, endIdx)
                      
                      return visibleSentences.map((sentence, i) => {
                        const actualIndex = startIdx + i
                        return (
                          <span
                            key={actualIndex}
                            className={`transition-all duration-500 ${
                              actualIndex === currentSentenceIndex
                                ? 'text-[#D97706] font-bold text-4xl'
                                : actualIndex < currentSentenceIndex
                                ? 'text-white/30 text-xl'
                                : 'text-white/50 text-xl'
                            }`}
                          >
                            {sentence}{' '}
                          </span>
                        )
                      })
                    })()}
                  </p>
                  {/* Part indicator in fullscreen */}
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="text-white/60 text-sm">
                      Part {Math.max(1, currentSentenceIndex + 1)} of {sentences.length}
                    </span>
                  </div>
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
                    onClick={restartStory}
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                    title="Restart"
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </button>
                  <button 
                    onClick={togglePlayPause}
                    className="w-16 h-16 bg-[#D97706] hover:bg-[#B45309] rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
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
                  onClick={togglePlayPause}
                  className="w-14 h-14 bg-[#D97706] hover:bg-[#B45309] rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 text-white" />
                  ) : (
                    <Play className="w-7 h-7 text-white ml-1" />
                  )}
                </button>
                <button 
                  onClick={restartStory}
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
              onClick={restartStory}
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
