import { useState } from 'react'
import { 
  ChevronLeft, 
  Clock, 
  Crown, 
  Landmark, 
  Sword, 
  Mountain,
  Search,
  Filter,
  BookOpen,
  Volume2,
  ChevronRight,
  Star,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  ArrowUp,
  X
} from 'lucide-react'

function HistoryPage({ onNavigate, onSelectEvent }) {
  const [selectedEra, setSelectedEra] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Mock historical eras
  const eras = [
    { id: 'all', name: 'All Eras', color: 'bg-amber-500' },
    { id: 'ancient', name: 'Ancient', color: 'bg-emerald-500' },
    { id: 'medieval', name: 'Medieval', color: 'bg-purple-500' },
    { id: 'colonial', name: 'Colonial', color: 'bg-rose-500' },
    { id: 'modern', name: 'Modern', color: 'bg-blue-500' },
  ]

  // Mock historical events data
  const historicalEvents = [
    {
      id: 1,
      title: "Arrival of Prince Vijaya",
      year: "543 BC",
      era: "ancient",
      icon: Crown,
      color: "from-amber-500 to-orange-600",
      description: "Prince Vijaya and his 700 followers arrived from India, marking the beginning of the Sinhalese civilization in Sri Lanka.",
      significance: "Foundation of the Sinhalese nation",
      location: "Tambapanni (Northwestern coast)",
      keyFigures: ["Prince Vijaya", "Princess Kuveni"],
      image: null
    },
    {
      id: 2,
      title: "Establishment of Anuradhapura",
      year: "377 BC",
      era: "ancient",
      icon: Landmark,
      color: "from-emerald-500 to-teal-600",
      description: "King Pandukabhaya established Anuradhapura as the capital, which would remain the seat of Sinhalese power for over 1,400 years.",
      significance: "Longest-serving capital in Sri Lankan history",
      location: "Anuradhapura",
      keyFigures: ["King Pandukabhaya"],
      image: null
    },
    {
      id: 3,
      title: "Arrival of Buddhism",
      year: "250 BC",
      era: "ancient",
      icon: Sparkles,
      color: "from-purple-500 to-indigo-600",
      description: "Arahant Mahinda, son of Emperor Ashoka, introduced Buddhism to Sri Lanka during the reign of King Devanampiya Tissa.",
      significance: "Transformation of Sri Lankan culture and spirituality",
      location: "Mihintale",
      keyFigures: ["Arahant Mahinda", "King Devanampiya Tissa"],
      image: null
    },
    {
      id: 4,
      title: "Reign of King Dutugemunu",
      year: "161-137 BC",
      era: "ancient",
      icon: Sword,
      color: "from-red-500 to-rose-600",
      description: "King Dutugemunu unified Sri Lanka under one rule after defeating King Elara. He built the magnificent Ruwanwelisaya stupa.",
      significance: "Unification of the island and cultural renaissance",
      location: "Anuradhapura",
      keyFigures: ["King Dutugemunu", "King Elara"],
      image: null
    },
    {
      id: 5,
      title: "Construction of Sigiriya",
      year: "477-495 AD",
      era: "ancient",
      icon: Mountain,
      color: "from-orange-500 to-amber-600",
      description: "King Kashyapa built the magnificent rock fortress of Sigiriya as his capital, featuring advanced engineering and beautiful frescoes.",
      significance: "UNESCO World Heritage Site - Engineering marvel",
      location: "Sigiriya",
      keyFigures: ["King Kashyapa I"],
      image: null
    },
    {
      id: 6,
      title: "Polonnaruwa Kingdom",
      year: "1055-1232 AD",
      era: "medieval",
      icon: Landmark,
      color: "from-teal-500 to-cyan-600",
      description: "After the fall of Anuradhapura, Polonnaruwa became the new capital. King Parakramabahu I brought prosperity and built the famous Parakrama Samudra.",
      significance: "Golden age of medieval Sri Lanka",
      location: "Polonnaruwa",
      keyFigures: ["King Parakramabahu I", "King Nissanka Malla"],
      image: null
    },
    {
      id: 7,
      title: "Kingdom of Kandy Established",
      year: "1469 AD",
      era: "medieval",
      icon: Crown,
      color: "from-pink-500 to-rose-600",
      description: "The Kingdom of Kandy was established in the central highlands, which would become the last independent kingdom of Sri Lanka.",
      significance: "Last bastion of Sri Lankan independence",
      location: "Kandy",
      keyFigures: ["King Senasammata Vikramabahu"],
      image: null
    },
    {
      id: 8,
      title: "Portuguese Arrival",
      year: "1505 AD",
      era: "colonial",
      icon: Landmark,
      color: "from-blue-500 to-indigo-600",
      description: "Lourenço de Almeida arrived in Sri Lanka, beginning the colonial era. The Portuguese would control coastal areas for over a century.",
      significance: "Beginning of European colonial influence",
      location: "Colombo",
      keyFigures: ["Lourenço de Almeida"],
      image: null
    },
    {
      id: 9,
      title: "Dutch Rule",
      year: "1658-1796 AD",
      era: "colonial",
      icon: Landmark,
      color: "from-orange-600 to-red-600",
      description: "The Dutch East India Company took control of Sri Lanka's coastal regions, developing trade and leaving lasting architectural influences.",
      significance: "Development of legal and administrative systems",
      location: "Galle, Colombo",
      keyFigures: ["Dutch East India Company"],
      image: null
    },
    {
      id: 10,
      title: "British Rule Begins",
      year: "1815 AD",
      era: "colonial",
      icon: Crown,
      color: "from-indigo-500 to-purple-600",
      description: "The Kandyan Convention was signed, ending the Kingdom of Kandy and bringing all of Sri Lanka under British colonial rule.",
      significance: "End of independent Sri Lankan kingdoms",
      location: "Kandy",
      keyFigures: ["King Sri Vikrama Rajasinha", "Sir Robert Brownrigg"],
      image: null
    },
    {
      id: 11,
      title: "Independence",
      year: "1948 AD",
      era: "modern",
      icon: Star,
      color: "from-yellow-500 to-amber-600",
      description: "Ceylon gained independence from British rule on February 4th, 1948, becoming a self-governing dominion.",
      significance: "Birth of modern Sri Lanka",
      location: "Colombo",
      keyFigures: ["D.S. Senanayake"],
      image: null
    }
  ]

  // Filter events based on era and search
  const filteredEvents = historicalEvents.filter(event => {
    const matchesEra = selectedEra === 'all' || event.era === selectedEra
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesEra && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-950 to-black">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-stone-900/95 backdrop-blur-sm border-b border-white/10 px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="font-medium">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-white">Sri Lankan History</h1>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              showFilters 
                ? 'bg-amber-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search historical events..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Era Filter Pills */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pt-4 pb-1 -mx-4 px-4 scrollbar-hide">
            {eras.map((era) => (
              <button
                key={era.id}
                onClick={() => setSelectedEra(era.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedEra === era.id
                    ? `${era.color} text-white`
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {era.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Timeline Content */}
      <main className="px-4 py-6">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/50 text-sm">
            {filteredEvents.length} events found
          </p>
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Chronological Order</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-amber-500/50 to-transparent" />

          {/* Events */}
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="relative w-full text-left group"
              >
                {/* Timeline Dot */}
                <div className={`absolute left-4 top-6 w-5 h-5 rounded-full border-4 border-stone-900 bg-gradient-to-br ${event.color} z-10 group-hover:scale-125 transition-transform`} />
                
                {/* Event Card */}
                <div className="ml-14 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-2xl p-4 transition-all duration-300 group-active:scale-[0.98]">
                  {/* Year Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${event.color} text-white`}>
                      {event.year}
                    </span>
                    <span className="text-white/40 text-xs capitalize">{event.era}</span>
                  </div>
                  
                  {/* Title & Icon */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${event.color} flex items-center justify-center flex-shrink-0`}>
                      <event.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg group-hover:text-amber-300 transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-white/50 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  {/* Description Preview */}
                  <p className="text-white/60 text-sm line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* End of Timeline */}
          {filteredEvents.length > 0 && (
            <div className="relative mt-4 ml-14 text-center py-4">
              <div className="absolute left-[-34px] top-0 w-5 h-5 rounded-full bg-stone-700 border-4 border-stone-900" />
              <p className="text-white/30 text-sm">End of timeline</p>
            </div>
          )}

          {/* No Results */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 text-lg mb-2">No events found</p>
              <p className="text-white/30 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="w-full max-w-lg bg-stone-900 rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Hero Header */}
            <div className={`relative h-32 bg-gradient-to-br ${selectedEvent.color} px-6 flex items-end pb-4`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <selectedEvent.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold text-white">
                    {selectedEvent.year}
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-2">{selectedEvent.title}</h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[50vh]">
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Location</span>
                  </div>
                  <p className="text-white font-medium">{selectedEvent.location}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Era</span>
                  </div>
                  <p className="text-white font-medium capitalize">{selectedEvent.era}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  About This Event
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Significance */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Historical Significance
                </h3>
                <p className="text-white/70">
                  {selectedEvent.significance}
                </p>
              </div>

              {/* Key Figures */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Key Figures
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.keyFigures.map((figure, index) => (
                    <span 
                      key={index}
                      className="bg-white/10 border border-white/10 text-white px-4 py-2 rounded-full text-sm"
                    >
                      {figure}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    if (onSelectEvent) onSelectEvent(selectedEvent)
                    setSelectedEvent(null)
                  }}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>Listen</span>
                </button>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95 border border-white/10"
                >
                  <X className="w-5 h-5" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all active:scale-95 z-10"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  )
}

export default HistoryPage
