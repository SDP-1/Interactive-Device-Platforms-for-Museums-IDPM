import { useState, useEffect } from 'react'
import { 
  ScanLine, 
  Camera, 
  Flashlight, 
  FlashlightOff,
  History,
  ChevronLeft,
  Check,
  Loader2,
  Info,
  Smartphone,
  QrCode,
  Volume2
} from 'lucide-react'

function QRScannerPage({ onNavigate, onScanComplete }) {
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [isScanning, setIsScanning] = useState(true)
  const [scanProgress, setScanProgress] = useState(0)
  const [lastScanned, setLastScanned] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Mock recent scans
  const recentScans = [
    { id: 1, name: "Sigiriya Lion Statue", time: "2 min ago", artifactId: "SIG-001" },
    { id: 2, name: "Ancient Gold Coin", time: "15 min ago", artifactId: "CON-042" },
    { id: 3, name: "Buddhist Moonstone", time: "1 hour ago", artifactId: "ANU-089" },
  ]

  // Simulate scanning animation
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress((prev) => (prev >= 100 ? 0 : prev + 2))
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isScanning])

  // Mock QR scan detection
  const handleMockScan = () => {
    setIsScanning(false)
    setShowSuccess(true)
    setLastScanned({
      id: "SIG-001",
      name: "Sigiriya Frescoes",
      type: "Painting",
      era: "5th Century AD"
    })
    
    // Navigate to artifact after delay
    setTimeout(() => {
      if (onScanComplete) {
        onScanComplete({
          id: "SIG-001",
          name: "Sigiriya Frescoes",
          type: "Painting",
          era: "5th Century AD"
        })
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="relative z-20 bg-gradient-to-b from-black/80 to-transparent px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="font-medium">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-white">Scan Artifact</h1>
          
          <button 
            onClick={() => setIsFlashOn(!isFlashOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isFlashOn 
                ? 'bg-amber-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {isFlashOn ? (
              <Flashlight className="w-5 h-5" />
            ) : (
              <FlashlightOff className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Camera View / Scanner Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Mock Camera Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
          {/* Simulated camera noise texture */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Center Scanner Frame */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full max-w-[280px] aspect-square">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-amber-500 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-amber-500 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-amber-500 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-amber-500 rounded-br-2xl" />

            {/* Scanning Line Animation */}
            {isScanning && (
              <div 
                className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-lg shadow-amber-500/50"
                style={{
                  top: `${scanProgress}%`,
                  transition: 'top 0.05s linear'
                }}
              />
            )}

            {/* Success Overlay */}
            {showSuccess && (
              <div className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center animate-pulse">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" />
                </div>
              </div>
            )}

            {/* Center QR Icon (when not scanning) */}
            {!isScanning && !showSuccess && (
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-white/30" />
              </div>
            )}
          </div>
        </div>

        {/* Instructions Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 py-8">
          {showSuccess && lastScanned ? (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full mb-3">
                <Check className="w-4 h-4" />
                <span className="font-medium">Artifact Found!</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{lastScanned.name}</h2>
              <p className="text-amber-400">{lastScanned.era} • {lastScanned.type}</p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 text-amber-400 mb-3">
                <ScanLine className="w-5 h-5 animate-pulse" />
                <span className="font-medium">Scanning for QR Code...</span>
              </div>
              <p className="text-white/60 text-sm">
                Point your camera at the QR code on the artifact display
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              onClick={handleMockScan}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>Mock Scan</span>
            </button>
            <button 
              onClick={() => onNavigate('history')}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 border border-white/10"
            >
              <History className="w-5 h-5" />
              <span>History</span>
            </button>
          </div>

          {/* Tips */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-white/90 font-medium text-sm mb-1">Pro Tip</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Hold your phone steady and ensure the QR code is well-lit for faster scanning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Bottom Sheet (Peek) */}
      <div className="bg-stone-900 border-t border-white/10 px-4 py-4 safe-area-bottom">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            Recent Scans
          </h3>
          <button className="text-amber-400 text-sm font-medium">See All</button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {recentScans.map((scan) => (
            <button
              key={scan.id}
              onClick={() => onScanComplete && onScanComplete({ id: scan.artifactId, name: scan.name })}
              className="flex-shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-left transition-all active:scale-95 min-w-[140px]"
            >
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center mb-2">
                <QrCode className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-white text-sm font-medium truncate">{scan.name}</p>
              <p className="text-white/40 text-xs">{scan.time}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QRScannerPage
