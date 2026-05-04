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
                                    {event.nodeId && <span className="badge badge-glass">{event.nodeId}</span>}
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
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                        Exhibit
                                    </span>
                                    <span className="event-detail__info-value">{event.exhibitName}</span>
                                </div>
                            )}
                            {event.wikiUrl && (
                                <div className="event-detail__info-item">
                                    <span className="event-detail__info-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                        Wikipedia
                                    </span>
                                    <a href={event.wikiUrl} target="_blank" rel="noopener noreferrer" className="event-detail__info-link">
                                        View Resource
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Discovery References */}
                        {event.referenceLinks && event.referenceLinks.length > 0 && (
                            <div className="event-detail__references">
                                <h4 className="event-detail__sub-section-title">Discovery References</h4>
                                <div className="event-detail__reference-list">
                                    {event.referenceLinks.map((link, i) => (
                                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="event-detail__reference-item glass-card">
                                            <span className="event-detail__ref-index">{i + 1}</span>
                                            <span className="event-detail__ref-title">{link.title}</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </article>

                {/* Global Influences */}
                {influences && influences.length > 0 && (
                    <section className="event-detail__influences">
                        <h3 className="event-detail__section-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                             Global Influences
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
                                            <div>
                                                <h4>{inf.globalEventName}</h4>
                                                <div className="event-detail__influence-badges">
                                                    <span className={`badge ${inf.influenceType === 'direct' ? 'badge-warning' : 'badge-info'}`}>
                                                        {inf.influenceType === 'direct' ? 'Direct Influence' : 'Indirect Influence'}
                                                    </span>
                                                    <span className="badge badge-success">
                                                        {(inf.reliabilityScore || 0).toFixed(1)}% Match
                                                    </span>
                                                </div>
                                            </div>
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

                                            <div className="event-detail__influence-metrics-grid">
                                                <div className="event-detail__metric-item">
                                                    <span className="event-detail__metric-label">Directness</span>
                                                    <div className="event-detail__metric-bar">
                                                        <div className="event-detail__metric-fill" style={{ width: `${(inf.reliabilityComponents?.directness || 0) * 100}%` }} />
                                                    </div>
                                                </div>
                                                <div className="event-detail__metric-item">
                                                    <span className="event-detail__metric-label">Consistency</span>
                                                    <div className="event-detail__metric-bar">
                                                        <div className="event-detail__metric-fill" style={{ width: `${(inf.reliabilityComponents?.sourceConsistency || 0) * 100}%` }} />
                                                    </div>
                                                </div>
                                                <div className="event-detail__metric-item">
                                                    <span className="event-detail__metric-label">Temporal</span>
                                                    <div className="event-detail__metric-bar">
                                                        <div className="event-detail__metric-fill" style={{ width: `${(inf.reliabilityComponents?.temporalProximity || 0) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="event-detail__influence-footer">
                                            <div className="event-detail__strength-box">
                                                <div className="event-detail__strength-header">
                                                    <span className="event-detail__metric-label">Causal Strength</span>
                                                    <span className="event-detail__strength-value">
                                                        {(inf.causalStrength || 0).toFixed(2)}
                                                        {inf.causalStrength < 0.4 && <span className="event-detail__strength-hint"> (Unlikely)</span>}
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
                                                <span className="badge badge-info">{inf.globalEventDate}</span>
                                                <span className="badge badge-info">{inf.globalEventLocation}</span>
                                                {inf.mechanism && (
                                                    <span className="badge badge-warning">{inf.mechanism}</span>
                                                )}
                                                <span className="badge badge-glass">Score: {(inf.finalScore || 0).toFixed(3)}</span>
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
