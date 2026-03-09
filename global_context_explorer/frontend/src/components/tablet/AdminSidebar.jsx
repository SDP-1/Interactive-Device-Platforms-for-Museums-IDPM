import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

export default function AdminSidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/tablet/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="admin-sidebar glass-card">
            <div
                className="admin-sidebar__brand"
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer' }}
            >
                <span className="admin-sidebar__brand-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 10v11"></path><path d="M19 10v11"></path><path d="M9 10v11"></path><path d="M15 10v11"></path><path d="M4 10l8-7 8 7"></path></svg>
                </span>
                <h3>Event<br />Dashboard</h3>
            </div>
            <nav className="admin-sidebar__nav">
                <button
                    className={`admin-sidebar__nav-item ${isActive('/tablet') ? 'admin-sidebar__nav-item--active' : ''}`}
                    onClick={() => navigate('/tablet')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Overview
                </button>
                <button
                    className={`admin-sidebar__nav-item ${isActive('/tablet/add-event') ? 'admin-sidebar__nav-item--active' : ''}`}
                    onClick={() => navigate('/tablet/add-event')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Event
                </button>
                <button
                    className={`admin-sidebar__nav-item ${isActive('/tablet/cities') ? 'admin-sidebar__nav-item--active' : ''}`}
                    onClick={() => navigate('/tablet/cities')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2V6a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v12Z"></path><path d="M12 2v2"></path><path d="M12 18v2"></path><path d="M12 10h.01"></path><path d="M17 9h.01"></path><path d="M17 13h.01"></path><path d="M17 5h.01"></path><path d="M7 9h.01"></path><path d="M7 13h.01"></path><path d="M7 5h.01"></path></svg>
                    Cities
                </button>
                <button className="admin-sidebar__nav-item" onClick={() => navigate('/map')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                    Kiosk View
                </button>
                <button className="admin-sidebar__nav-item admin-sidebar__nav-item--logout" onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Logout
                </button>
            </nav>
            <div className="admin-sidebar__user">
                <div className="admin-sidebar__user-info">
                    <span className="admin-sidebar__user-name">{user?.name}</span>
                    <span className="admin-sidebar__user-role badge badge-info">{user?.role}</span>
                </div>
            </div>
        </aside>
    );
}
