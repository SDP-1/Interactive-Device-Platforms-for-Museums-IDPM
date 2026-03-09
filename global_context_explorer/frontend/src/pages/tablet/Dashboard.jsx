import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService, cityService } from '../../services/api';
import AdminSidebar from '../../components/tablet/AdminSidebar';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEvents, setTotalEvents] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedRange, setSelectedRange] = useState('all');

    useEffect(() => {
        setLoading(true);

        let yearStart, yearEnd;
        if (selectedRange !== 'all') {
            [yearStart, yearEnd] = selectedRange.split('-').map(Number);
        }

        Promise.all([
            eventService.getAll({
                page,
                limit: 9,
                search: searchQuery,
                cityId: selectedCity,
                yearStart,
                yearEnd
            }),
            cityService.getAll(),
        ])
            .then(([evtRes, cityRes]) => {
                setEvents(evtRes.data.events || evtRes.data);
                setTotalPages(evtRes.data.pages || 1);
                setTotalEvents(evtRes.data.totalCount || 0);
                setCities(cityRes.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, searchQuery, selectedCity, selectedRange]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await eventService.delete(id);
            setEvents(events.filter(e => e._id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete event');
        }
    };

    const handleToggleInfluence = async (event) => {
        try {
            const newValue = !event.noGlobalInfluence;
            const res = await eventService.update(event._id, { noGlobalInfluence: newValue });
            setEvents(events.map(e => e._id === event._id ? res.data : e));
        } catch (err) {
            console.error('Toggle influence failed:', err);
            alert('Failed to update event status');
        }
    };

    const handlePrev = () => setPage(p => Math.max(1, p - 1));
    const handleNext = () => setPage(p => Math.min(totalPages, p + 1));

    return (
        <div className="dashboard">
            <AdminSidebar />

            <main className="dashboard__main">
                <header className="dashboard__header">
                    <div className="dashboard__header-content">
                        <div className="dashboard__title-area">
                            <h1>Welcome, {user?.name}</h1>
                            <p>Manage museum events and global influences</p>
                        </div>

                        <div className="dashboard__header-actions">
                            <button
                                className="btn-orange-outline"
                                onClick={() => navigate('/tablet/add-event')}
                                style={{ width: 'auto' }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Add New Event →
                            </button>
                        </div>
                    </div>
                </header>

                <section className="dashboard__filters-section">
                    <div className="dashboard__filters-bar">
                        <div className="dashboard__filters-left">
                            <div className="filter-group">
                                <label>Filter by City</label>
                                <select
                                    value={selectedCity}
                                    onChange={(e) => {
                                        setSelectedCity(e.target.value);
                                        setPage(1);
                                    }}
                                    className="filter-select"
                                >
                                    <option value="all">All Locations</option>
                                    {cities.map(city => (
                                        <option key={city._id} value={city._id}>{city.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Year Range</label>
                                <select
                                    value={selectedRange}
                                    onChange={(e) => {
                                        setSelectedRange(e.target.value);
                                        setPage(1);
                                    }}
                                    className="filter-select"
                                >
                                    <option value="all">All Eras</option>
                                    <option value="0-1000">0 - 1000 CE</option>
                                    <option value="1001-1500">1001 - 1500</option>
                                    <option value="1501-1600">1501 - 1600</option>
                                    <option value="1601-1700">1601 - 1700</option>
                                    <option value="1701-1800">1701 - 1800</option>
                                    <option value="1801-1900">1801 - 1900</option>
                                    <option value="1901-2000">1901 - 2000</option>
                                    <option value="2001-2100">2001 - 2100</option>
                                </select>
                            </div>

                            {(searchQuery || selectedCity !== 'all' || selectedRange !== 'all') && (
                                <button
                                    className="btn btn-glass btn-sm dashboard__clear-btn"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCity('all');
                                        setSelectedRange('all');
                                        setPage(1);
                                    }}
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        <div className="dashboard__filters-right">
                            <div className="dashboard__search-bar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                />
                                {searchQuery && (
                                    <button className="dashboard__search-clear" onClick={() => setSearchQuery('')}>×</button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="dashboard__stats-grid stagger-children">
                    <div className="stat-card animate-fade-in-up">
                        <div className="stat-card__icon-container city-accent">
                            <svg className="stat-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M16 18h.01"></path></svg>
                        </div>
                        <div className="stat-card__info">
                            <h4 className="stat-card__number">{cities.length}</h4>
                            <p className="stat-card__label">Total Cities</p>
                        </div>
                    </div>

                    <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="stat-card__icon-container event-accent">
                            <svg className="stat-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div className="stat-card__info">
                            <h4 className="stat-card__number">{totalEvents}</h4>
                            <p className="stat-card__label">Total Events</p>
                        </div>
                    </div>

                    <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="stat-card__icon-container active-accent">
                            <svg className="stat-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div className="stat-card__info">
                            <h4 className="stat-card__number">
                                {cities.filter((c) => c.isActive).length}
                            </h4>
                            <p className="stat-card__label">Active Cities</p>
                        </div>
                    </div>
                </section>

                {/* Events Grid */}
                <section className="dashboard__section">
                    <div className="dashboard__section-header">
                        <h3>Events Library</h3>
                    </div>

                    {loading ? (
                        <div className="loader"><div className="loader-spinner" /></div>
                    ) : events.length === 0 ? (
                        <div className="dashboard__no-events animate-fade-in">
                            <div className="no-events-indicator">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                                <h4>No events found</h4>
                                <p>Try adjusting your search query or filters.</p>
                                <button
                                    className="btn btn-glass btn-sm"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCity('all');
                                        setSelectedRange('all');
                                        setPage(1);
                                    }}
                                >
                                    Reset all filters
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="dashboard__events-grid stagger-children">
                                {events.map((evt, idx) => (
                                    <div
                                        key={evt._id}
                                        className="event-card animate-fade-in-up"
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                    >
                                        <div className="event-card__image-container">
                                            {evt.imageUrl ? (
                                                <img src={evt.imageUrl} alt={evt.eventName} className="event-card__image" />
                                            ) : (
                                                <div className="event-card__image-placeholder">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 10v11"></path><path d="M19 10v11"></path><path d="M9 10v11"></path><path d="M15 10v11"></path><path d="M4 10l8-7 8 7"></path></svg>
                                                </div>
                                            )}
                                            <div className="event-card__badge">
                                                {evt.nodeId}
                                            </div>
                                        </div>

                                        <div className="event-card__content">
                                            <h4 className="event-card__title">{evt.eventName}</h4>
                                            <div className="event-card__meta">
                                                <span> {evt.date}</span>
                                                <span> {evt.location || evt.cityId?.name || '—'}</span>
                                            </div>
                                            <p className="event-card__description">
                                                {evt.description.length > 120
                                                    ? `${evt.description.substring(0, 120)}...`
                                                    : evt.description}
                                            </p>

                                            <div className="event-card__influence-toggle">
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={evt.noGlobalInfluence}
                                                        onChange={() => handleToggleInfluence(evt)}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                                <span className="toggle-label">No Global Influence</span>
                                            </div>

                                            <div className="event-card__actions">
                                                <button
                                                    className={`btn-orange-outline event-card__btn-analyze ${evt.noGlobalInfluence ? 'btn-disabled' : ''}`}
                                                    onClick={() => !evt.noGlobalInfluence && navigate(`/tablet/explore/${evt._id}`)}
                                                    disabled={evt.noGlobalInfluence}
                                                    title={evt.noGlobalInfluence ? 'Global influence analysis is disabled for this event' : 'Analyze global influences'}
                                                >
                                                    {evt.noGlobalInfluence ? 'Excl. from Global' : 'Analyze'}
                                                </button>
                                                <button
                                                    className="btn btn-danger-link"
                                                    onClick={() => handleDelete(evt._id)}
                                                    title="Delete Event"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="dashboard__pagination">
                                <button
                                    className="btn btn-glass btn-sm"
                                    onClick={handlePrev}
                                    disabled={page === 1}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                    Previous
                                </button>
                                <span className="pagination__info">
                                    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                                </span>
                                <button
                                    className="btn btn-glass btn-sm"
                                    onClick={handleNext}
                                    disabled={page === totalPages}
                                >
                                    Next
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
