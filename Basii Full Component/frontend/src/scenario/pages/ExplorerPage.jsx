import { useState, useEffect } from 'react';
import Header from '../components/Header';
import ArtifactCard from '../components/ArtifactCard';
import Pagination from '../components/Pagination';
import { artifacts, getCategories, getEras, getOrigins } from '../data/artifacts';

function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedEra, setSelectedEra] = useState('All Eras');
  const [selectedOrigin, setSelectedOrigin] = useState('All Origins');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = ['All Categories', ...getCategories()];
  const eras = ['All Eras', ...getEras()];
  const origins = ['All Origins', ...getOrigins()];

  // Filter artifacts
  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesSearch = artifact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || artifact.category === selectedCategory;
    const matchesEra = selectedEra === 'All Eras' || artifact.era === selectedEra;
    const matchesOrigin = selectedOrigin === 'All Origins' || artifact.origin === selectedOrigin;

    return matchesSearch && matchesCategory && matchesEra && matchesOrigin;
  });

  // Pagination
  const totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArtifacts = filteredArtifacts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedEra, selectedOrigin]);

  return (
    <div className="min-h-screen bg-beige">
      <Header />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 sticky top-4 z-10 transition-all duration-300 hover:shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-1">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search artifacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-12 py-4 text-lg bg-white/50 border-gray-200 focus:bg-white transition-colors duration-300"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-hover:text-primary transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select-field w-full py-4 px-4 text-lg bg-white/50 border-gray-200 focus:bg-white transition-colors duration-300 h-[60px]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {/* Era Filter */}
            <div>
              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="select-field w-full py-4 px-4 text-lg bg-white/50 border-gray-200 focus:bg-white transition-colors duration-300 h-[60px]"
              >
                {eras.map(era => (
                  <option key={era} value={era}>{era}</option>
                ))}
              </select>
            </div>
            {/* Origin Filter */}
            <div>
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="select-field w-full py-4 px-4 text-lg bg-white/50 border-gray-200 focus:bg-white transition-colors duration-300 h-[60px]"
              >
                {origins.map(origin => (
                  <option key={origin} value={origin}>{origin}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Available Artifacts Header */}
        <div className="flex justify-between items-center mb-8 px-2 mt-8">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-gray-800 tracking-tight italic">Available Artifacts</h2>
          <p className="text-gray-600 bg-white/50 px-6 py-3 rounded-full text-lg font-medium border border-gray-200 shadow-sm">{filteredArtifacts.length} artifacts found</p>
        </div>

        {/* Artifacts Grid */}
        {paginatedArtifacts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-10 xl:gap-12">
              {paginatedArtifacts.map(artifact => (
                <div key={artifact.id} className="transform hover:-translate-y-3 transition-all duration-500">
                  <ArtifactCard artifact={artifact} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-xl font-serif">No artifacts found matching your criteria.</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('All Categories'); setSelectedEra('All Eras'); setSelectedOrigin('All Origins'); }} className="mt-4 text-primary hover:text-primary-dark font-medium hover:underline">Clear Filters</button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-6 mt-12">
        <p className="text-sm">© 2023 AI Artifact Scenario Explorer. Advancing archaeological understanding through AI.</p>
      </footer>
    </div>
  );
}

export default ExplorerPage;
