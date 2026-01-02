import { useState, useEffect } from 'react'
import { 
  Landmark, 
  MessageCircle, 
  Clock, 
  BookOpen, 
  Sparkles,
  MapPin,
  Crown,
  Mountain,
  Sword,
  ChevronRight,
  Wifi,
  WifiOff,
  Users,
  TrendingUp,
  Volume2
} from 'lucide-react'

function HomePage({ onNavigate, backendStatus }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeCard, setActiveCard] = useState(null)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Format time nicely
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

  // Featured historical topics
  const featuredTopics = [
    {
      id: 1,
      title: "Sigiriya Rock Fortress",
      era: "5th Century AD",
      icon: Mountain,
      color: "from-amber-500 to-orange-600",
      description: "Ancient palace built on a massive rock"
    },
    {
      id: 2,
      title: "King Dutugemunu",
      era: "161-137 BC",
      icon: Crown,
      color: "from-purple-500 to-indigo-600",
      description: "The great unifier of ancient Sri Lanka"
    },
    {
      id: 3,
      title: "Ancient Anuradhapura",
      era: "377 BC - 1017 AD",
      icon: Landmark,
      color: "from-emerald-500 to-teal-600",
      description: "Sacred city and ancient capital"
    },
    {
      id: 4,
      title: "Kingdom of Kandy",
      era: "1469 - 1815 AD",
      icon: Sword,
      color: "from-rose-500 to-pink-600",
      description: "Last independent kingdom"
    }
  ]

  // Dashboard cards with navigation
  const dashboardCards = [
    {
      id: 'ask',
      title: 'Ask a Question',
      subtitle: 'AI-powered historical Q&A',
      icon: MessageCircle,
      color: 'bg-gradient-to-br from-[#D97706] to-[#B45309]',
      action: () => onNavigate('ask')
    },
    {
      id: 'timeline',
      title: 'Explore Timeline',
      subtitle: 'Journey through eras',
      icon: Clock,
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      action: () => onNavigate('timeline')
    },
    {
      id: 'collections',
      title: 'Browse Collections',
      subtitle: 'Artifacts & exhibits',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      action: () => onNavigate('collections')
    },
    {
      id: 'stories',
      title: 'Featured Stories',
      subtitle: 'Curated narratives',
      icon: Sparkles,
      color: 'bg-gradient-to-br from-rose-500 to-pink-600',
      action: () => onNavigate('stories')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1510] via-[#2d251c] to-[#1a1510] overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D97706' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#D97706] to-[#B45309] rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Landmark className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Sri Lankan Heritage
              </h1>
              <p className="text-amber-200/60 text-sm">Interactive Museum Experience</p>
            </div>
          </div>

          {/* Time & Status */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-3xl font-light text-white tracking-wider font-mono">
                {formatTime(currentTime)}
              </p>
              <p className="text-amber-200/50 text-sm">{formatDate(currentTime)}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              backendStatus === 'connected' 
                ? 'bg-emerald-500/20 border border-emerald-500/30' 
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              {backendStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                backendStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {backendStatus === 'connected' ? 'System Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Welcome Section */}
          <div className="mb-10">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-900/40 to-stone-900/40 border border-amber-500/20 p-10">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-3xl" />
              
              <div className="relative flex items-center justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
                    Discover the Rich
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                      History of Sri Lanka
                    </span>
                  </h2>
                  <p className="text-xl text-amber-100/70 mb-8 leading-relaxed">
                    Ask questions, explore timelines, and immerse yourself in 
                    thousands of years of fascinating heritage through AI-powered narration.
                  </p>
                  <button 
                    onClick={() => onNavigate('ask')}
                    className="group flex items-center gap-3 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-105"
                  >
                    <Volume2 className="w-5 h-5" />
                    Start Exploring
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Stats Panel */}
                <div className="hidden lg:grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                    <Users className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-3xl font-bold text-white">2,500+</p>
                    <p className="text-amber-200/60 text-sm">Years of History</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                    <Landmark className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-3xl font-bold text-white">8</p>
                    <p className="text-amber-200/60 text-sm">UNESCO Sites</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                    <Crown className="w-8 h-8 text-purple-400 mb-2" />
                    <p className="text-3xl font-bold text-white">180+</p>
                    <p className="text-amber-200/60 text-sm">Ancient Kings</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                    <TrendingUp className="w-8 h-8 text-rose-400 mb-2" />
                    <p className="text-3xl font-bold text-white">100+</p>
                    <p className="text-amber-200/60 text-sm">Stories to Tell</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {dashboardCards.map((card) => (
              <button
                key={card.id}
                onClick={card.action}
                onMouseEnter={() => setActiveCard(card.id)}
                onMouseLeave={() => setActiveCard(null)}
                className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${card.color} shadow-xl`}
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                  <p className="text-white/70 text-sm">{card.subtitle}</p>
                  
                  <div className={`mt-4 flex items-center gap-2 text-white/80 transition-all duration-300 ${activeCard === card.id ? 'translate-x-2' : ''}`}>
                    <span className="text-sm font-medium">Explore</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Featured Topics Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Featured Topics</h3>
                <p className="text-amber-200/60">Explore key moments in Sri Lankan history</p>
              </div>
              <button className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-medium">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onNavigate('ask', topic.title)}
                  className="group relative bg-gradient-to-br from-stone-800/50 to-stone-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02] text-left overflow-hidden"
                >
                  {/* Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <topic.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h4 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                      {topic.title}
                    </h4>
                    <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-3">
                      <Clock className="w-3 h-3" />
                      {topic.era}
                    </div>
                    <p className="text-amber-100/50 text-sm leading-relaxed">
                      {topic.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Learn More</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-6 mt-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between border-t border-amber-500/10 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D97706] to-[#B45309] rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-white">Sri Lankan Heritage Museum</span>
          </div>
          <p className="text-amber-200/40 text-sm">
            Interactive Device Platform for Museums • Preserving Heritage Through Technology
          </p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage


