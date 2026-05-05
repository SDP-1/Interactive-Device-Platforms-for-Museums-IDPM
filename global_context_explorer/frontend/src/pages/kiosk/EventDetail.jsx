import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/api';
import coin1 from '../../assets/coin1.png';
import coin2 from '../../assets/coin2.png';
import coin3 from '../../assets/coin3.png';
import coin4 from '../../assets/coin4.png';
import coin5 from '../../assets/coin5.png';
import kioskBg from '../../assets/kioskbg.jpg';
import './EventDetail.css';

const coinCollection = [
    { id: 'coin-1', label: 'Coin 1', image: coin1, era: 'Roman circulation' },
    { id: 'coin-2', label: 'Coin 2', image: coin2, era: 'Trade route issue' },
    { id: 'coin-3', label: 'Coin 3', image: coin3, era: 'Museum specimen' },
    { id: 'coin-4', label: 'Coin 4', image: coin4, era: 'Heritage archive' },
    { id: 'coin-5', label: 'Coin 5', image: coin5, era: 'Archaeological find' },
];

export default function EventDetail() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [expandedInfluences, setExpandedInfluences] = useState(new Set());
    const [coinStartIndex, setCoinStartIndex] = useState(0);

    useEffect(() => {
        eventService
            .getById(eventId)
            .then((r) => setData(r.data))
            .catch(() => navigate('/map'))
            .finally(() => setLoading(false));
    }, [eventId, navigate]);

    const toggleExpansion = (id) => {
        const newSet = new Set(expandedInfluences);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedInfluences(newSet);
    };

    const maxCoinStartIndex = Math.max(0, coinCollection.length - 3);
    const visibleCoins = coinCollection.slice(coinStartIndex, coinStartIndex + 3);

    const scrollCoinsUp = () => {
        setCoinStartIndex((current) => Math.max(0, current - 1));
    };

    const scrollCoinsDown = () => {
        setCoinStartIndex((current) => Math.min(maxCoinStartIndex, current + 1));
    };

    if (loading) return <div className="loader"><div className="loader-spinner" /></div>;
    if (!data) return null;

    const { event, influences } = data;

    return (
        <div
            className="event-detail"
            style={{
                backgroundImage: `url(${kioskBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <header className="event-detail__header glass-card">
                <button className="btn btn-glass btn-sm" onClick={() => navigate(-1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </button>
                <h2>Heritage Chronicle</h2>
            </header>

            <main className="event-detail__content-wrap animate-fade-in">
                {/* Hero Image - Full Width Unbounded */}
                <div className="event-detail__hero-section">
                    <div className="event-detail__hero">
                        {event.imageUrl ? (
                            <img src={event.imageUrl} alt={event.eventName} />
                        ) : (
                            <div className="event-card-square__placeholder era-bg--medieval" style={{ height: '100%', borderRadius: 0 }}>
                                <span>Historic Monument</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="event-detail__right-pane">
                    {/* Details Text - Right Side */}
                    <article className="event-detail__details-card">
                        <div className="event-detail__header-meta">
                            <div className="event-detail__badge-row">
                                <span className="badge badge-info">{event.date}</span>
                                {event.purpose && <span className="badge badge-warning">{event.purpose}</span>}
                            </div>
                            <h1 className="event-detail__title">{event.eventName}</h1>
                        </div>

                        <div className="event-detail__body">
                            <p className="event-detail__description">
                                {event.descriptionFull || event.description}
                            </p>

                            <div className="event-detail__info-grid">
                                <div className="event-detail__info-item">
                                    <span className="event-detail__info-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        Location
                                    </span>
                                    <span className="event-detail__info-value">{event.location}</span>
                                </div>
                                {event.exhibitName && (
                                    <div className="event-detail__info-item">
                                        <span className="event-detail__info-label">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                            Exhibit
                                        </span>
                                        <span className="event-detail__info-value">{event.exhibitName}</span>
                                    </div>
                                )}
                                {event.sourceReferences && (
                                    <div className="event-detail__info-item">
                                        <span className="event-detail__info-label">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                            Sources
                                        </span>
                                        <span className="event-detail__info-value">{event.sourceReferences}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </article>

                    <aside className="event-detail__explore-band" aria-label="Coin explorer panel">
                        <div className="event-detail__coin-panel-shell">
                            <div className="event-detail__coin-panel-header">
                                <div>
                                    <p className="event-detail__coin-panel-kicker">Artifact Vault</p>
                                    <h4>Coin Collection</h4>
                                </div>
                                <span className="event-detail__coin-panel-count">
                                    {coinStartIndex + 1} - {Math.min(coinStartIndex + 3, coinCollection.length)} / {coinCollection.length}
                                </span>
                            </div>

                            <button
                                className="event-detail__coin-nav event-detail__coin-nav--up"
                                onClick={scrollCoinsUp}
                                disabled={coinStartIndex === 0}
                                aria-label="Show previous coins"
                                type="button"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                            </button>

                            <div className="event-detail__coin-window">
                                {visibleCoins.map((coin, idx) => (
                                    <article key={coin.id} className="event-detail__coin-card">
                                        <div className="event-detail__coin-media">
                                            <img src={coin.image} alt={coin.label} />
                                        </div>
                                        <div className="event-detail__coin-copy">
                                            <span className="event-detail__coin-label">{coin.label}</span>
                                            <span className="event-detail__coin-era">{coin.era}</span>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <button
                                className="event-detail__coin-nav event-detail__coin-nav--down"
                                onClick={scrollCoinsDown}
                                disabled={coinStartIndex === maxCoinStartIndex}
                                aria-label="Show next coins"
                                type="button"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>
                    </aside>
                </div>

                {/* Global Influences */}
                {influences && influences.length > 0 && (
                    <section className="event-detail__influences">
                        <h3 className="event-detail__section-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            Global Historical Context
                        </h3>
                        <div className="event-detail__influence-list">
                            {/* Top two influences */}
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                {influences.slice(0, 2).map((inf, idx) => {
                                    const isExpanded = expandedInfluences.has(inf._id);
                                    return (
                                        <div
                                            key={inf._id}
                                            className="event-detail__influence-card glass-card animate-fade-in-up"
                                            style={{ flex: 1, animationDelay: `${idx * 0.15}s` }}
                                        >
                                            <div className="event-detail__influence-header">
                                                <h4>{inf.globalEventName}</h4>
                                                <span className="badge badge-success">
                                                    {(inf.reliabilityScore || 0).toFixed(1)}% Match
                                                </span>
                                            </div>

                                            <div className="event-detail__influence-body">
                                                <p className="event-detail__influence-desc">
                                                    {isExpanded
                                                        ? (inf.globalEventDescriptionFull || inf.globalEventDescription)
                                                        : inf.globalEventDescription}
                                                </p>

                                                {inf.globalEventDescriptionFull && (
                                                    <button
                                                        className="event-detail__expand-btn"
                                                        onClick={() => toggleExpansion(inf._id)}
                                                    >
                                                        {isExpanded ? 'Show Less' : 'Full Heritage Insight'}
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="event-detail__influence-footer">
                                                <div className="event-detail__strength-box">
                                                    <div className="event-detail__metric-header">
                                                        <span className="event-detail__metric-label">Causal Strength</span>
                                                        <span className="event-detail__score-value">
                                                            {((inf.causalStrength || 0) * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="event-detail__score-bar-bg">
                                                        <div
                                                            className="event-detail__score-bar-fill"
                                                            style={{ width: `${(inf.causalStrength || 0) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="event-detail__influence-meta">
                                                    {inf.globalEventDate && (
                                                        <span className="event-detail__meta-chip event-detail__meta-chip--year">
                                                            Year: {inf.globalEventDate}
                                                        </span>
                                                    )}
                                                    {inf.mechanism && (
                                                        <span className="event-detail__meta-chip event-detail__meta-chip--mechanism">
                                                            Mechanism Caused: {inf.mechanism}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Remaining influences in a strict two-column grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px', alignItems: 'start' }}>
                                {influences.slice(2).map((inf, idx) => {
                                    const isExpanded = expandedInfluences.has(inf._id);
                                    return (
                                        <div
                                            key={inf._id}
                                            className="event-detail__influence-card glass-card animate-fade-in-up"
                                            style={{ width: '100%', animationDelay: `${idx * 0.15}s` }}
                                        >
                                            <div className="event-detail__influence-header">
                                                <h4>{inf.globalEventName}</h4>
                                                <span className="badge badge-success">
                                                    {(inf.reliabilityScore || 0).toFixed(1)}% Match
                                                </span>
                                            </div>

                                            <div className="event-detail__influence-body">
                                                <p className="event-detail__influence-desc">
                                                    {isExpanded
                                                        ? (inf.globalEventDescriptionFull || inf.globalEventDescription)
                                                        : inf.globalEventDescription}
                                                </p>

                                                {inf.globalEventDescriptionFull && (
                                                    <button
                                                        className="event-detail__expand-btn"
                                                        onClick={() => toggleExpansion(inf._id)}
                                                    >
                                                        {isExpanded ? 'Show Less' : 'Full Heritage Insight'}
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="event-detail__influence-footer">
                                                <div className="event-detail__strength-box">
                                                    <div className="event-detail__metric-header">
                                                        <span className="event-detail__metric-label">Causal Strength</span>
                                                        <span className="event-detail__score-value">
                                                            {((inf.causalStrength || 0) * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="event-detail__score-bar-bg">
                                                        <div
                                                            className="event-detail__score-bar-fill"
                                                            style={{ width: `${(inf.causalStrength || 0) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="event-detail__influence-meta">
                                                    {inf.globalEventDate && (
                                                        <span className="event-detail__meta-chip event-detail__meta-chip--year">
                                                            Year: {inf.globalEventDate}
                                                        </span>
                                                    )}
                                                    {inf.mechanism && (
                                                        <span className="event-detail__meta-chip event-detail__meta-chip--mechanism">
                                                            Mechanism Caused: {inf.mechanism}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
