import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, influenceService } from '../../services/api';
import AdminSidebar from '../../components/tablet/AdminSidebar';
import './GlobalContextExplorer.css';

export default function GlobalContextExplorer() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [influences, setInfluences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');

    /* Reject confirmation modal */
    const [rejectModal, setRejectModal] = useState(null); // influence ID

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const evtRes = await eventService.getById(eventId);
            setEvent(evtRes.data.event);
            // Load existing influences
            const infRes = await influenceService.getAll({ eventId, status: 'pending,accepted' });
            setInfluences(infRes.data);
        } catch (err) {
            setError('Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setError('');
        try {
            const res = await influenceService.analyze(eventId);
            setInfluences(res.data.influences || []);
            if (res.data.event) {
                setEvent(res.data.event);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Analysis failed. Make sure the ML pipeline is available.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAccept = async (inf) => {
        try {
            const isSuggested = !inf._id;
            const res = await influenceService.accept(inf._id, isSuggested ? { ...inf, localEventId: eventId } : undefined);
            const updatedInf = res.data;

            setInfluences((prev) =>
                prev.map((item) => {
                    // Match by _id if it exists, otherwise by name for suggestions
                    const match = inf._id ? item._id === inf._id : item.globalEventName === inf.globalEventName;
                    return match ? { ...updatedInf, status: 'accepted' } : item;
                })
            );
        } catch (err) {
            setError('Failed to accept');
        }
    };

    const handleReject = async (infId, suggestionData) => {
        try {
            const isSuggested = !infId;
            await influenceService.reject(infId, isSuggested ? { ...suggestionData, localEventId: eventId, reason: 'Curator rejected' } : { reason: 'Curator rejected' });

            setInfluences((prev) => prev.filter((item) => {
                if (infId) return item._id !== infId;
                return item.globalEventName !== suggestionData.globalEventName;
            }));
            setRejectModal(null);
        } catch (err) {
            setError('Failed to reject');
        }
    };

    const handleCopyLink = (url) => {
        navigator.clipboard.writeText(url);
    };

    return (
        <div className="gce-layout">
            <AdminSidebar />
            <div className="gce">
                {/* Header */}
                <header className="gce__header glass-card">
                    <button className="btn-glass" onClick={() => navigate('/tablet')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back to Dashboard
                    </button>
                    <div>
                        <h2>Global Context Explorer</h2>
                        {event && <p className="gce__event-name">{event.eventName}</p>}
                    </div>
                </header>

                {/* Event summary */}
                {event && (
                    <div className="gce__event-card glass-card animate-fade-in">
                        <div className="gce__event-badges">
                            <span className="badge badge-info">{event.date}</span>
                            <span className="badge badge-info">{event.location}</span>
                            {event.purpose && <span className="badge badge-warning">{event.purpose}</span>}
                        </div>
                        <p>{event.description}</p>
                        {event.descriptionFull && event.descriptionFull !== event.description && (
                            <details className="gce__event-details-toggle">
                                <summary>View more details</summary>
                                <div className="gce__event-description-full">
                                    {event.descriptionFull}
                                </div>
                            </details>
                        )}
                        <button
                            className={`btn-orange-outline ${event.noGlobalInfluence ? 'btn-disabled' : ''}`}
                            onClick={handleAnalyze}
                            disabled={analyzing || event.noGlobalInfluence}
                            id="analyze-btn"
                            style={{ margin: '16px 0 0' }}
                            title={event.noGlobalInfluence ? 'Global influence analysis is disabled for this event' : 'Find Global Influences'}
                        >
                            {analyzing ? (
                                <><div className="loader-spinner btn-spinner" /> Analyzing…</>
                            ) : event.noGlobalInfluence ? (
                                'Analysis Disabled'
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    Find Global Influences
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Discovery References */}
                {event && event.referenceLinks && event.referenceLinks.length > 0 && (
                    <div className="gce__references glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="gce__references-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            <h4>Discovery References</h4>
                        </div>
                        <div className="gce__reference-list">
                            {event.referenceLinks.map((link, i) => (
                                <div key={i} className="gce__reference-item">
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="gce__reference-link"
                                    >
                                        <span className="gce__ref-index">{i + 1}</span>
                                        <span className="gce__ref-title">{link.title}</span>
                                        <svg className="gce__ref-external" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </a>
                                    <button
                                        className="btn-icon-ref"
                                        onClick={() => handleCopyLink(link.url)}
                                        title="Copy Link"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && <div className="gce__error">{error}</div>}

                {loading && <div className="loader"><div className="loader-spinner" /></div>}

                {/* Influences list */}
                <div className="gce__influences stagger-children">
                    {influences.map((inf, idx) => (
                        <div
                            key={inf._id || inf.globalEventName}
                            className={`gce__influence glass-card animate-fade-in-up ${inf.status === 'accepted' ? 'gce__influence--accepted' : ''
                                }`}
                            style={{ animationDelay: `${idx * 0.08}s` }}
                        >
                            {/* Status badge */}
                            {inf.status === 'accepted' && (
                                <span className="gce__influence-status badge badge-success">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Accepted
                                </span>
                            )}

                            <div className="gce__influence-main">
                                {/* Influence Topic */}
                                <h3 className="gce__influence-topic">{inf.globalEventName}</h3>

                                {/* Description */}
                                <p className="gce__influence-desc">{inf.globalEventDescription}</p>

                                {/* Key metrics row */}
                                <div className="gce__influence-metrics">
                                    <div className="gce__metric">
                                        <span className="gce__metric-label">Date</span>
                                        <span className="gce__metric-value">{inf.globalEventDate}</span>
                                    </div>
                                    <div className="gce__metric">
                                        <span className="gce__metric-label">Location</span>
                                        <span className="gce__metric-value">{inf.globalEventLocation}</span>
                                    </div>
                                    <div className="gce__metric">
                                        <span className="gce__metric-label">Reliability</span>
                                        <span className="gce__metric-value gce__metric-value--highlight">
                                            {(inf.reliabilityScore || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="gce__metric">
                                        <span className="gce__metric-label">Causal Strength</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="score-bar" style={{ flex: 1, minWidth: 60 }}>
                                                <div
                                                    className="score-bar__fill"
                                                    style={{ width: `${(inf.causalStrength || 0) * 100}%` }}
                                                />
                                            </div>
                                            <span className={`gce__metric-value ${inf.causalStrength < 0.4 ? 'gce__metric-value--low' : ''}`}>
                                                {(inf.causalStrength || 0).toFixed(2)}
                                                {inf.causalStrength < 0.4 && (
                                                    <span className="gce__metric-hint"> (Very Unlikely influence)</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Extra details toggle */}
                                <details className="gce__influence-details">
                                    <summary>Show more details</summary>
                                    <div className="gce__influence-extra">
                                        {inf.globalEventDescriptionFull && inf.globalEventDescriptionFull !== inf.globalEventDescription && (
                                            <div className="gce__full-details">
                                                <div className="gce__extra-label">Full Details:</div>
                                                <div className="gce__extra-text">{inf.globalEventDescriptionFull}</div>
                                            </div>
                                        )}
                                        <div className="gce__extra-row">
                                            <span>Mechanism:</span> <span>{inf.mechanism || '—'}</span>
                                        </div>
                                        <div className="gce__extra-row">
                                            <span>Influence Type:</span> <span>{inf.influenceType}</span>
                                        </div>
                                        <div className="gce__extra-row">
                                            <span>Directness:</span>
                                            <span>{(inf.reliabilityComponents?.directness || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="gce__extra-row">
                                            <span>Source Consistency:</span>
                                            <span>{(inf.reliabilityComponents?.sourceConsistency || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="gce__extra-row">
                                            <span>Temporal Proximity:</span>
                                            <span>{(inf.reliabilityComponents?.temporalProximity || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="gce__extra-row">
                                            <span>Final Score:</span>
                                            <span>{(inf.finalScore || 0).toFixed(3)}</span>
                                        </div>
                                    </div>
                                </details>
                            </div>

                            {/* Action buttons */}
                            {['pending', 'suggested'].includes(inf.status) && (
                                <div className="gce__influence-actions">
                                    <button
                                        className="btn-orange-outline btn-sm"
                                        onClick={() => handleAccept(inf)}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Accept
                                    </button>
                                    <button
                                        className="btn-glass btn-sm"
                                        onClick={() => setRejectModal(inf)}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {!loading && influences.length === 0 && !analyzing && (
                        <div className="gce__empty glass-card">
                            <p>No influences found yet. Click "Find Global Influences" to run the ML analysis.</p>
                        </div>
                    )}
                </div>

                {/* Reject Confirmation Modal */}
                {rejectModal && (
                    <div className="modal-overlay" onClick={() => setRejectModal(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header-with-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                <h3>Confirm Rejection</h3>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>
                                Are you sure you want to reject this influence? It will not appear again for this event.
                            </p>
                            <div className="modal-actions">
                                <button
                                    className="btn-glass"
                                    onClick={() => setRejectModal(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-orange-outline btn-danger-solid"
                                    onClick={() => handleReject(rejectModal._id, rejectModal)}
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
