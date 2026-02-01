import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import ArtifactCard from './ArtifactCard';

const API_BASE = '/api';

const GalleryScreen = ({ onSelectArtifact }) => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('');

  // Fetch artifacts from API
  const loadArtifacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/artifacts`);
      if (!response.ok) {
        throw new Error('Failed to fetch artifacts');
      }
      const data = await response.json();
      // Transform API data to match expected format
      const transformedData = data.map(artifact => ({
        ...artifact,
        image: artifact.image ? `/${artifact.image}` : null,
        description: artifact.function || artifact.notes || '',
        details: {
          material: artifact.materials || 'Unknown',
          function: artifact.function || 'Unknown',
          dimensions: artifact.dimensions || 'Unknown',
          symbolism: artifact.symbolism || 'Unknown'
        }
      }));
      setArtifacts(transformedData);
    } catch (err) {
      console.error('Error loading artifacts:', err);
      setError('Error loading artifacts. Make sure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtifacts();
  }, []);

  // Get unique filter values from loaded artifacts
  const categories = useMemo(() => {
    const cats = [...new Set(artifacts.map(a => a.category))];
    return cats.filter(Boolean).sort();
  }, [artifacts]);

  const eras = useMemo(() => {
    const eraList = [...new Set(artifacts.map(a => a.era))];
    return eraList.filter(Boolean).sort();
  }, [artifacts]);

  const origins = useMemo(() => {
    const originList = [...new Set(artifacts.map(a => a.origin))];
    return originList.filter(Boolean).sort();
  }, [artifacts]);

  // Filter artifacts
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(artifact => {
      const matchesSearch = !searchTerm ||
        artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (artifact.description && artifact.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        artifact.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || artifact.category === selectedCategory;
      const matchesEra = !selectedEra || artifact.era === selectedEra;
      const matchesOrigin = !selectedOrigin || artifact.origin === selectedOrigin;

      return matchesSearch && matchesCategory && matchesEra && matchesOrigin;
    });
  }, [artifacts, searchTerm, selectedCategory, selectedEra, selectedOrigin]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedCategory || selectedEra || selectedOrigin;

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedEra('');
    setSelectedOrigin('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="text-center py-20">
          <div className="spinner mx-auto mb-4" style={{ width: '40px', height: '40px' }} />
          <p className="text-stone-600 font-sans">Loading artifacts from server...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="animate-fadeIn">
        <div className="text-center py-16 bg-white rounded-xl border border-red-200">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="font-serif text-xl text-red-700 mb-2">Connection Error</h3>
          <p className="text-red-600 font-sans mb-6 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={loadArtifacts}
            className="px-8 py-3 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white 
                       rounded-xl font-sans text-lg transition-colors inline-flex items-center gap-3 shadow-lg"
          >
            <RefreshCw size={16} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn w-full">
      {/* Hero Section - Enlarged */}
      <div className="text-center mb-12 sm:mb-16 lg:mb-20">
        <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-stone-800 mb-6 tracking-tight">
          Artifact Collection
        </h2>
        <p className="text-stone-600 font-sans text-xl sm:text-2xl md:text-3xl max-w-5xl mx-auto px-4 leading-relaxed font-light">
          Explore our curated collection of cultural artifacts from Sri Lanka and beyond.
          Discover the rich heritage and stories behind each piece.
        </p>
      </div>

      {/* Search and Filter Controls - Scaled Up */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-200 p-8 sm:p-12 mb-12 sm:mb-16">
        <div className="flex flex-col gap-8">
          {/* Search Input */}
          <div className="w-full relative group">
            <Search
              size={32}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-700 transition-colors"
            />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 sm:pl-20 pr-8 py-6 rounded-[2rem] border-2 border-stone-100 
                         focus:border-amber-500 bg-stone-50/50 focus:bg-white focus:ring-4 focus:ring-amber-100/50
                         outline-none font-sans text-xl sm:text-2xl text-stone-800 placeholder:text-stone-400
                         transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Filter Dropdowns - Enlarged */}
          <div className="flex flex-wrap sm:flex-nowrap gap-6 overflow-x-auto pb-2">
            {/* Category Filter */}
            <div className="relative flex-1 min-w-[250px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none px-6 sm:px-8 py-5 rounded-[1.5rem] border-2 border-stone-100 
                           bg-stone-50/50 focus:bg-white font-sans text-xl text-stone-800 cursor-pointer
                           focus:border-amber-500 focus:ring-4 focus:ring-amber-100/50 outline-none
                           transition-all duration-300 pr-16"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <ChevronDown
                size={28}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
            </div>

            {/* Era Filter */}
            <div className="relative flex-1 min-w-[250px]">
              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="w-full appearance-none px-6 sm:px-8 py-5 rounded-[1.5rem] border-2 border-stone-100 
                           bg-stone-50/50 focus:bg-white font-sans text-xl text-stone-800 cursor-pointer
                           focus:border-amber-500 focus:ring-4 focus:ring-amber-100/50 outline-none
                           transition-all duration-300 pr-16"
              >
                <option value="">All Eras</option>
                {eras.map(era => (
                  <option key={era} value={era}>{era}</option>
                ))}
              </select>
              <ChevronDown
                size={28}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
            </div>

            {/* Origin Filter */}
            <div className="relative flex-1 min-w-[250px]">
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="w-full appearance-none px-6 sm:px-8 py-5 rounded-[1.5rem] border-2 border-stone-100 
                           bg-stone-50/50 focus:bg-white font-sans text-xl text-stone-800 cursor-pointer
                           focus:border-amber-500 focus:ring-4 focus:ring-amber-100/50 outline-none
                           transition-all duration-300 pr-16"
              >
                <option value="">All Origins</option>
                {origins.map(origin => (
                  <option key={origin} value={origin}>{origin}</option>
                ))}
              </select>
              <ChevronDown
                size={28}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-stone-100">
            <Filter size={20} className="text-stone-500" />
            <span className="text-base text-stone-500 font-sans">Active filters:</span>
            <div className="flex flex-wrap gap-3">
              {searchTerm && (
                <FilterTag label={`Search: "${searchTerm}"`} onRemove={() => setSearchTerm('')} />
              )}
              {selectedCategory && (
                <FilterTag label={selectedCategory} onRemove={() => setSelectedCategory('')} />
              )}
              {selectedEra && (
                <FilterTag label={selectedEra} onRemove={() => setSelectedEra('')} />
              )}
              {selectedOrigin && (
                <FilterTag label={selectedOrigin} onRemove={() => setSelectedOrigin('')} />
              )}
            </div>
            <button
              onClick={clearFilters}
              className="ml-auto text-lg text-orange-500 hover:text-white hover:bg-orange-500 px-4 py-1 rounded-lg border-2 border-transparent hover:border-orange-500 font-sans font-bold transition-all"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count - Bold */}
      <div className="mb-8 text-xl text-stone-500 font-sans border-l-4 border-amber-700 pl-4 py-1">
        Showing <span className="font-bold text-stone-800 text-2xl px-1">{filteredArtifacts.length}</span> of {artifacts.length} artifacts
      </div>

      {/* Artifact Grid - Reduced columns for maximum card size */}
      {filteredArtifacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 lg:gap-14">
          {filteredArtifacts.map((artifact, index) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              onClick={() => onSelectArtifact(artifact)}
              delay={index * 50}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
          <div className="text-7xl sm:text-8xl mb-5">🔍</div>
          <h3 className="font-serif text-2xl sm:text-3xl text-stone-700 mb-3">No artifacts found</h3>
          <p className="text-base sm:text-lg text-stone-500 font-sans mb-6">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={clearFilters}
            className="px-10 py-4 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white 
                       rounded-2xl font-sans text-xl sm:text-2xl transition-all shadow-xl active:scale-95"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

// Filter Tag Component
const FilterTag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 text-amber-800 
                   rounded-full text-base font-sans">
    {label}
    <button
      onClick={onRemove}
      className="ml-1 hover:bg-amber-200 rounded-full p-1 transition-colors"
    >
      <X size={18} />
    </button>
  </span>
);

export default GalleryScreen;
