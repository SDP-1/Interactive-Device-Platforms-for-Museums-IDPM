import { useState, useEffect, useRef } from 'react'
import { 
  ChevronLeft, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Play,
  Pause,
  Info,
  Heart,
  Share2,
  BookOpen,
  Volume2,
  VolumeX,
  Rotate3D,
  Move3D,
  Box,
  Layers,
  Camera,
  Download,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Clock,
  MapPin,
  Ruler,
  Palette
} from 'lucide-react'

function ArtifactViewerPage({ artifact, onNavigate, onLearnMore }) {
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isInfoExpanded, setIsInfoExpanded] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeView, setActiveView] = useState('3d') // '3d', 'front', 'side', 'top'
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const containerRef = useRef(null)

  // Mock artifact data
  const mockArtifact = artifact || {
    id: "SIG-001",
    name: "Sigiriya Lion Paw",
    era: "5th Century AD",
    period: "Anuradhapura Period",
    location: "Sigiriya, Sri Lanka",
    material: "Granite & Brick",
    dimensions: "2.5m × 1.8m × 3.2m",
    description: "The massive lion paws are the only remaining parts of a giant lion statue that once guarded the entrance to King Kashyapa's palace atop Sigiriya rock. These architectural marvels showcase the advanced engineering and artistic capabilities of ancient Sri Lankan craftsmen.",
    significance: "UNESCO World Heritage Site - These paws are symbolic of royal power and protection in ancient Sri Lankan culture.",
    audioNarration: "sigiriya_lion_paw.mp3",
    relatedArtifacts: ["Sigiriya Frescoes", "Mirror Wall", "Water Gardens"]
  }

  // Simulate loading
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 100) {
          setIsLoading(false)
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Auto rotation animation
  useEffect(() => {
    if (isAutoRotating && !isLoading) {
      const interval = setInterval(() => {
        setRotation((prev) => ({ ...prev, y: (prev.y + 1) % 360 }))
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isAutoRotating, isLoading])

  // Touch/Drag handlers for rotation
  const handleDrag = (e) => {
    if (isAutoRotating) return
    const movementX = e.movementX || 0
    const movementY = e.movementY || 0
    setRotation((prev) => ({
      x: Math.max(-45, Math.min(45, prev.x + movementY * 0.5)),
      y: prev.y + movementX * 0.5
    }))
  }

  const handleZoom = (direction) => {
    setZoom((prev) => {
      const newZoom = direction === 'in' ? prev + 0.2 : prev - 0.2
      return Math.max(0.5, Math.min(2, newZoom))
    })
  }

  const resetView = () => {
    setZoom(1)
    setRotation({ x: 0, y: 0 })
    setIsAutoRotating(true)
  }

  const viewOptions = [
    { id: '3d', label: '3D', icon: Box },
    { id: 'front', label: 'Front', icon: Layers },
    { id: 'side', label: 'Side', icon: Move3D },
    { id: 'top', label: 'Top', icon: Camera }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-950 to-black flex flex-col">
      {/* Header */}
      <header className="relative z-20 px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate('scanner')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="font-medium">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-white truncate max-w-[180px]">
            {mockArtifact.name}
          </h1>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/10 text-white/70 hover:bg-white/20 flex items-center justify-center transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3D Viewer Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden min-h-[50vh]"
        onMouseMove={handleDrag}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center z-10">
            <div className="w-20 h-20 mb-6 relative">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
              <div 
                className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Box className="w-8 h-8 text-amber-500" />
              </div>
            </div>
            <p className="text-white font-medium mb-2">Loading 3D Model</p>
            <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="text-white/50 text-sm mt-2">{loadProgress}%</p>
          </div>
        )}

        {/* Mock 3D Model Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
          
          {/* Platform/Pedestal */}
          <div className="absolute bottom-[20%] w-48 h-4 bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 rounded-full blur-sm opacity-50" />
          
          {/* Mock 3D Object (Stylized representation) */}
          <div 
            className="relative w-48 h-56 transition-transform duration-100"
            style={{
              transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            {/* Front face */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-2xl shadow-2xl"
              style={{ transform: 'translateZ(24px)' }}
            >
              <div className="absolute inset-4 border-2 border-amber-500/30 rounded-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-28 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-full mx-auto mb-4 shadow-inner">
                    {/* Lion paw texture lines */}
                    <div className="pt-4 px-3 space-y-2">
                      <div className="h-1 bg-amber-500/30 rounded" />
                      <div className="h-1 bg-amber-500/20 rounded" />
                      <div className="h-1 bg-amber-500/30 rounded" />
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    <div className="w-4 h-6 bg-amber-600 rounded-b-full" />
                    <div className="w-4 h-8 bg-amber-600 rounded-b-full" />
                    <div className="w-4 h-8 bg-amber-600 rounded-b-full" />
                    <div className="w-4 h-6 bg-amber-600 rounded-b-full" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Side shadows */}
            <div 
              className="absolute inset-y-0 -right-2 w-6 bg-gradient-to-l from-stone-950 to-amber-900 rounded-r-xl"
              style={{ transform: 'translateZ(12px) rotateY(-90deg)' }}
            />
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/50 backdrop-blur-sm rounded-full p-1">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveView(option.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeView === option.id
                  ? 'bg-amber-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <option.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <button 
            onClick={() => handleZoom('in')}
            className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all active:scale-95"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleZoom('out')}
            className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all active:scale-95"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button 
            onClick={resetView}
            className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`w-12 h-12 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              isAutoRotating 
                ? 'bg-amber-500 text-white' 
                : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
            }`}
          >
            <Rotate3D className="w-5 h-5" />
          </button>
        </div>

        {/* Fullscreen Button */}
        <button className="absolute left-4 top-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Info Panel (Expandable) */}
      <div 
        className={`bg-stone-900 border-t border-white/10 transition-all duration-300 ${
          isInfoExpanded ? 'max-h-[60vh]' : 'max-h-[200px]'
        } overflow-hidden`}
      >
        {/* Drag Handle */}
        <button 
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          className="w-full py-2 flex justify-center"
        >
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </button>

        <div className="px-4 pb-4 overflow-y-auto">
          {/* Title & Actions Row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>{mockArtifact.era}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{mockArtifact.name}</h2>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{mockArtifact.location}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70"
            >
              {isInfoExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Palette className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-white/50 text-xs">Material</p>
              <p className="text-white text-sm font-medium truncate">{mockArtifact.material}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Ruler className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-white/50 text-xs">Dimensions</p>
              <p className="text-white text-sm font-medium truncate">{mockArtifact.dimensions}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-white/50 text-xs">Period</p>
              <p className="text-white text-sm font-medium truncate">{mockArtifact.period}</p>
            </div>
          </div>

          {/* Audio Narration */}
          <button 
            onClick={() => setIsAudioPlaying(!isAudioPlaying)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl mb-4 transition-all ${
              isAudioPlaying 
                ? 'bg-gradient-to-r from-amber-600 to-amber-700' 
                : 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-500/30'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isAudioPlaying ? 'bg-white/20' : 'bg-amber-500'
            }`}>
              {isAudioPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold">
                {isAudioPlaying ? 'Playing Audio Guide' : 'Listen to Audio Guide'}
              </p>
              <p className="text-white/60 text-sm">
                {isAudioPlaying ? 'Tap to pause' : '2 min narration'}
              </p>
            </div>
            {isAudioPlaying && (
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 bg-white rounded-full animate-pulse"
                    style={{ 
                      height: `${12 + Math.random() * 12}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}
          </button>

          {/* Expanded Content */}
          {isInfoExpanded && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Description */}
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Description
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {mockArtifact.description}
                </p>
              </div>

              {/* Significance */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Historical Significance
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {mockArtifact.significance}
                </p>
              </div>

              {/* Related Artifacts */}
              <div>
                <h3 className="text-white font-semibold mb-3">Related Artifacts</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                  {mockArtifact.relatedArtifacts.map((related, index) => (
                    <button 
                      key={index}
                      className="flex-shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium transition-all active:scale-95"
                    >
                      {related}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => onLearnMore && onLearnMore(mockArtifact)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Learn More</span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 border border-white/10">
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArtifactViewerPage
