import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="kiosk-home">
            {/* Background Image Layer */}
            <div className="kiosk-home__bg" />

            {/* Dark Overlay Layer */}
            <div className="kiosk-home__overlay" />

            {/* Top Right Header Info */}
            <header className="kiosk-home__header animate-fade-in">
                <div className="kiosk-home__opening-hours">
                    <span className="kiosk-home__hours-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </span>
                    <div className="kiosk-home__hours-text">
                        <span>Open Daily</span>
                        <strong>9AM - 5PM</strong>
                    </div>
                </div>
            </header>

            <main className="kiosk-home__content animate-fade-in-up">
                {/* Museum Icon */}
                <div className="kiosk-home__logo-container">
                    <div className="kiosk-home__logo-circle">
                        <span className="kiosk-home__logo-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 10v11"></path><path d="M19 10v11"></path><path d="M9 10v11"></path><path d="M15 10v11"></path><path d="M12 10v11"></path><path d="M4 10l8-7 8 7"></path></svg>
                        </span>
                    </div>
                </div>

                <h1 className="kiosk-home__title">
                    Welcome to the <span className="kiosk-home__title-highlight">Colombo National Museum</span>
                </h1>

                <p className="kiosk-home__subtitle">
                    Discover Sri Lanka's history through a guided or self-explored journey
                </p>

                <div className="kiosk-home__actions">
                    <button
                        className="btn btn-white-outline btn-lg kiosk-home__btn"
                        onClick={() => navigate('/map')}
                    >
                        Explore History
                        <span className="btn-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </span>
                    </button>
                </div>

                {/* Feature Icons Row */}
                <div className="kiosk-home__features">
                    <div className="kiosk-home__feature">
                        <div className="kiosk-home__feature-icon-circle">
                            <span className="kiosk-home__feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            </span>
                        </div>
                        <span className="kiosk-home__feature-label">Guided Tours</span>
                    </div>

                    <div className="kiosk-home__feature">
                        <div className="kiosk-home__feature-icon-circle">
                            <span className="kiosk-home__feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </span>
                        </div>
                        <span className="kiosk-home__feature-label">Historical Timeline</span>
                    </div>

                    <div className="kiosk-home__feature">
                        <div className="kiosk-home__feature-icon-circle">
                            <span className="kiosk-home__feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"></path><path d="M11 3l-4 6 10 13"></path><path d="M13 3l4 6-10 13"></path></svg>
                            </span>
                        </div>
                        <span className="kiosk-home__feature-label">Rare Artifacts</span>
                    </div>
                </div>
            </main>

            {/* Tablet curator access */}
            <button
                className="kiosk-home__curator-access"
                onClick={() => navigate('/tablet')}
            >
                Curator Access
            </button>
        </div>
    );
}
