import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/api';
import './EventDetail.css';

export default function EventDetail() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [expandedInfluences, setExpandedInfluences] = useState(new Set());

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

    if (loading) return <div className="loader"><div className="loader-spinner" /></div>;
    if (!data) return null;

    const { event, influences } = data;

    return (
        <div className="event-detail">
            <header className="event-detail__header glass-card">
                <button className="btn btn-glass btn-sm" onClick={() => navigate(-1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </button>
                <h2>Heritage Chronicle</h2>
            </header>

            <main className="event-detail__content-wrap animate-fade-in">
                {/* Main Event Card */}
                <article className="event-detail__main-card glass-card">
                    <div className="event-detail__hero">
                        {event.imageUrl ? (
                            <img src={event.imageUrl} alt={event.eventName} />
                        ) : (
                            <div className="event-card-square__placeholder era-bg--medieval" style={{ height: '100%', borderRadius: 0 }}>
                                <span>Historic Monument</span>
                            </div>
                        )}
                        <div className="event-detail__hero-overlay">
                            <div className="event-detail__hero-content">
                                <div className="event-detail__badge-row">
                                    <span className="badge badge-info">{event.date}</span>
                                    {event.purpose && <span className="badge badge-warning">{event.purpose}</span>}
                                </div>
                                <h1 className="event-detail__title">{event.eventName}</h1>
                            </div>
                        </div>
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

                {/* Global Influences */}
                {influences && influences.length > 0 && (
                    <section className="event-detail__influences">
                        <h3 className="event-detail__section-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            Global Historical Context
                        </h3>
                        <div className="event-detail__influence-list">
                            {influences.map((inf, idx) => {
                                const isExpanded = expandedInfluences.has(inf._id);
                                return (
                                    <div
                                        key={inf._id}
                                        className="event-detail__influence-card glass-card animate-fade-in-up"
                                        style={{ animationDelay: `${idx * 0.15}s` }}
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
                                                <span className="event-detail__metric-label">Causal Strength</span>
                                                <div className="event-detail__score-bar-bg">
                                                    <div
                                                        className="event-detail__score-bar-fill"
                                                        style={{ width: `${(inf.causalStrength || 0) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="event-detail__influence-meta">
                                                <span className="badge badge-info">{inf.globalEventDate}</span>
                                                <span className="badge badge-info">{inf.globalEventLocation}</span>
                                                {inf.mechanism && (
                                                    <span className="badge badge-warning">{inf.mechanism}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
