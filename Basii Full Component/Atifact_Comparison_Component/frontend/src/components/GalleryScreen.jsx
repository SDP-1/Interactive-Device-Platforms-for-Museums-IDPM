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
            className="px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white 
                       rounded-lg font-sans text-sm transition-colors inline-flex items-center gap-2"
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
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-10 lg:mb-12">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 mb-3 sm:mb-4">
          Artifact Collection
        </h2>
        <p className="text-stone-600 font-sans text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-2 leading-relaxed">
          Explore our curated collection of cultural artifacts from Sri Lanka and beyond. 
          Discover the rich heritage and stories behind each piece.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl shadow-md border border-stone-200 p-4 sm:p-6 mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Search Input */}
          <div className="w-full relative">
            <Search 
              size={22} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" 
            />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 sm:pl-14 pr-5 py-3.5 sm:py-4 rounded-xl border border-stone-300 
                         focus:border-amber-500 focus:ring-2 focus:ring-amber-200 
                         outline-none font-sans text-base sm:text-lg text-stone-700 placeholder:text-stone-400"
            />
          </div>

          {/* Filter Dropdowns - Scrollable on mobile */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 overflow-x-auto pb-1">
            {/* Category Filter */}
            <div className="relative flex-1 min-w-[160px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none px-4 sm:px-5 py-3 sm:py-3.5 pr-10 sm:pr-12 rounded-xl border border-stone-300 
                           bg-white font-sans text-base text-stone-700 cursor-pointer
                           focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <ChevronDown 
                size={20} 
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" 
              />
            </div>

            {/* Era Filter */}
            <div className="relative flex-1 min-w-[160px]">
              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="w-full appearance-none px-4 sm:px-5 py-3 sm:py-3.5 pr-10 sm:pr-12 rounded-xl border border-stone-300 
                           bg-white font-sans text-base text-stone-700 cursor-pointer
                           focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              >
                <option value="">All Eras</option>
                {eras.map(era => (
                  <option key={era} value={era}>{era}</option>
                ))}
              </select>
              <ChevronDown 
                size={20} 
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" 
              />
            </div>

            {/* Origin Filter */}
            <div className="relative flex-1 min-w-[160px]">
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="w-full appearance-none px-4 sm:px-5 py-3 sm:py-3.5 pr-10 sm:pr-12 rounded-xl border border-stone-300 
                           bg-white font-sans text-base text-stone-700 cursor-pointer
                           focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              >
                <option value="">All Origins</option>
                {origins.map(origin => (
                  <option key={origin} value={origin}>{origin}</option>
                ))}
              </select>
              <ChevronDown 
                size={20} 
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" 
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
              className="ml-auto text-base text-amber-700 hover:text-amber-800 font-sans font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 sm:mb-6 text-sm sm:text-base text-stone-500 font-sans">
        Showing <span className="font-semibold text-stone-700">{filteredArtifacts.length}</span> of {artifacts.length} artifacts
      </div>

      {/* Artifact Grid - Fully responsive */}
      {filteredArtifacts.length > 0 ? (
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
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
            className="px-8 py-3 bg-amber-700 hover:bg-amber-800 text-white 
                       rounded-xl font-sans text-base sm:text-lg transition-colors"
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
