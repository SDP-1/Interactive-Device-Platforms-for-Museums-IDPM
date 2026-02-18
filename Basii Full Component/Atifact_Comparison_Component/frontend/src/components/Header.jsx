import { Home, ChevronRight, LayoutDashboard } from 'lucide-react';

const Header = ({ currentScreen, selectedArtifact, onNavigateHome, onNavigateToDetail }) => {
  return (
    <header className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        {/* Main Header */}
        <div className="py-6 sm:py-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 sm:gap-8 min-w-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl shadow-orange-500/20">
              <span className="text-white text-3xl sm:text-5xl">🏛️</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-stone-800 tracking-tight leading-tight">
                AI Museum Artifact Explorer
              </h1>
              <p className="text-stone-500 text-lg sm:text-2xl font-sans hidden sm:block italic mt-1 font-medium">
                Discover cultural heritage through intelligent analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dashboard Button */}
            <button
              onClick={() => window.location.href = 'http://localhost:8000/main_dashboard.html'}
              className="px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 border-2 border-orange-500 bg-white text-orange-500 hover:bg-orange-500 hover:text-white text-xl shadow-lg hover:shadow-xl active:scale-95"
            >
              <span className="text-2xl">🏠</span> Dashboard
            </button>

            {currentScreen !== 'gallery' && (
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-4 px-8 py-4 text-orange-500 hover:text-white 
                         hover:bg-orange-500 rounded-2xl transition-all font-sans text-xl font-bold 
                         border-2 border-orange-500 shadow-lg active:scale-95 flex-shrink-0"
              >
                <Home size={28} className="w-8 h-8" />
                <span className="hidden sm:inline uppercase tracking-wider">Back to Gallery</span>
                <span className="sm:hidden">Home</span>
              </button>
            )}
          </div>
        </div>


      </div>
    </header>
  );
};

export default Header;
