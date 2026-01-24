import { Link } from 'react-router-dom';

function Header({ showDashboard = false }) {
  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-6 hover:opacity-80 transition-opacity">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight">AI Artifact Scenario Explorer</h1>
          </Link>
          {showDashboard && (
            <Link
              to="/"
              className="bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95 text-lg"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
