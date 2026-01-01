import { Home, ChevronRight, LayoutDashboard } from 'lucide-react';

const Header = ({ currentScreen, selectedArtifact, onNavigateHome, onNavigateToDetail }) => {
  return (
    <header className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        {/* Main Header */}
        <div className="py-4 sm:py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl sm:text-2xl">🏛️</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-stone-800 truncate">
                AI Museum Artifact Explorer
              </h1>
              <p className="text-stone-500 text-sm sm:text-base font-sans hidden sm:block">
                Discover cultural heritage through intelligent analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dashboard Button */}
            <button
              onClick={() => window.location.href = 'http://localhost:8000/main_dashboard.html'}
              className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-stone-200 hover:bg-stone-100 text-stone-700 hover:border-museum-accent"
            >
              <span>🏠</span> Dashboard
            </button>

            {currentScreen !== 'gallery' && (
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2.5 sm:py-3 text-stone-600 hover:text-amber-700 
                         hover:bg-amber-50 rounded-xl transition-colors font-sans text-sm sm:text-base flex-shrink-0"
              >
                <Home size={20} className="sm:w-6 sm:h-6" />
                <span className="hidden sm:inline">Back to Gallery</span>
                <span className="sm:hidden">Home</span>
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        {currentScreen !== 'gallery' && (
          <nav className="py-2.5 sm:py-3 border-t border-stone-100">
            <ol className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-sans">
              <li>
                <button
                  onClick={onNavigateHome}
                  className="text-amber-700 hover:text-amber-800 hover:underline"
                >
                  Home
                </button>
              </li>

              {selectedArtifact && (
                <>
                  <ChevronRight size={18} className="text-stone-400" />
                  <li>
                    {currentScreen === 'comparison' ? (
                      <button
                        onClick={onNavigateToDetail}
                        className="text-amber-700 hover:text-amber-800 hover:underline"
                      >
                        {selectedArtifact.name}
                      </button>
                    ) : (
                      <span className="text-stone-600">{selectedArtifact.name}</span>
                    )}
                  </li>
                </>
              )}

              {currentScreen === 'comparison' && (
                <>
                  <ChevronRight size={18} className="text-stone-400" />
                  <li className="text-stone-600">Comparative Analysis</li>
                </>
              )}
            </ol>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
