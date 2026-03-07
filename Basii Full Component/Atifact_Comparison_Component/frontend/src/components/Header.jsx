import { Home, ChevronRight, LayoutDashboard } from 'lucide-react';

const Header = ({ currentScreen, selectedArtifact, onNavigateHome, onNavigateToDetail }) => {
  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e7e5e4', position: 'sticky', top: 0, zIndex: 50, width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ width: '100%', padding: '1.5rem 2rem' }}>
        {/* Main Header */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0 }}>
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

          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Dashboard Button */}
            <button
              onClick={() => {
                // Navigate to main_dashboard.html on port 8000
                const hostname = window.location.hostname;
                window.location.href = `http://${hostname}:8000/Basii%20Full%20Component/main_dashboard.html`;
              }}
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
