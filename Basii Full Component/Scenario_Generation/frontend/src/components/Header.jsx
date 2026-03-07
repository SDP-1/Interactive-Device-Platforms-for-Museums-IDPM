import { Link } from 'react-router-dom';

function Header() {
  const handleDashboard = () => {
    const hostname = window.location.hostname;
    window.location.href = `http://${hostname}:8000/Basii%20Full%20Component/main_dashboard.html`;
  };

  return (
    <header style={{ background: 'linear-gradient(to right, #1f2937, #111827)', color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
      <div style={{ width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '2rem' }}>
          <Link to="/" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem', textDecoration: 'none', color: 'inherit', opacity: 1, transition: 'opacity 0.3s', minWidth: 0 }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <h1 style={{ fontSize: '2.25rem', fontFamily: 'serif', fontWeight: 'bold', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>AI Artifact Scenario Explorer</h1>
          </Link>
          <button
            onClick={handleDashboard}
            style={{ flexShrink: 0, background: 'white', border: '2px solid #f97316', color: '#f97316', padding: '0.75rem 2rem', borderRadius: '0.75rem', fontWeight: 'bold', transition: 'all 0.3s', cursor: 'pointer', fontSize: '1.125rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#f97316'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
          >
            <span>🏠</span> Dashboard
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
