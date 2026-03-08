import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cityService, eventService } from '../../services/api';
import './CityTimeline.css';

export default function CityTimeline() {
    const { cityId } = useParams();
    const navigate = useNavigate();
    const [city, setCity] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    /* For the slider we use a single "cursor" year that defines a window */
    const [cursorYear, setCursorYear] = useState(300);
    const WINDOW_SIZE = 400; // show ±200 years around cursor for better page view

    useEffect(() => {
        cityService.getById(cityId)
            .then((r) => setCity(r.data))
            .catch(() => navigate('/map'));
    }, [cityId, navigate]);

    const fetchEvents = useCallback(() => {
        setLoading(true);
        const ys = cursorYear - WINDOW_SIZE / 2;
        const ye = cursorYear + WINDOW_SIZE / 2;
        eventService
            .getAll({ cityId, yearStart: ys, yearEnd: ye })
            .then((r) => setEvents(r.data.events || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [cityId, cursorYear]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    /* Generate tick labels */
    const ticks = [];
    for (let y = -600; y <= 2000; y += 100) {
        ticks.push(y);
    }

    const formatYear = (y) => {
        if (y < 0) return `${Math.abs(y)} BCE`;
        return `${y} CE`;
    };

    if (loading && !city) return <div className="loader"><div className="loader-spinner" /></div>;

    return (
        <div className="city-timeline">
            {/* Header */}
            <header className="city-timeline__header glass-card">
                <button className="btn btn-glass btn-sm" onClick={() => navigate('/map')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </button>
                <div>
                    <h2>{(city?.name || 'Loading')} Historical Chronicle</h2>
                    <div className="city-timeline__province">{city?.province || 'Sri Lanka'}</div>
                </div>
            </header>

            {/* Timeline slider section */}
            <section className="city-timeline__slider-section glass-card animate-fade-in">
                <h4 className="city-timeline__slider-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Chronological Exploration — {formatYear(cursorYear - WINDOW_SIZE / 2)} to {formatYear(cursorYear + WINDOW_SIZE / 2)}
                </h4>

                <div className="city-timeline__slider-track-container">
                    {/* Era background bands */}
                    <div className="city-timeline__eras">
                        <span className="era era--ancient" style={{ left: '0%', width: '23%' }}>Ancient</span>
                        <span className="era era--classical" style={{ left: '23%', width: '19%' }}>Classical</span>
                        <span className="era era--medieval" style={{ left: '42%', width: '19%' }}>Medieval</span>
                        <span className="era era--colonial" style={{ left: '61%', width: '27%' }}>Colonial</span>
                        <span className="era era--modern" style={{ left: '88%', width: '12%' }}>Modern</span>
                    </div>

                    {/* Tick marks */}
                    <div className="city-timeline__ticks">
                        {ticks.map((y) => {
                            const pct = ((y - (-600)) / (2000 - (-600))) * 100;
                            return (
                                <div key={y} className="city-timeline__tick" style={{ left: `${pct}%` }}>
                                    <div className="city-timeline__tick-line" />
                                    {y % 500 === 0 && (
                                        <span className="city-timeline__tick-label">{formatYear(y)}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Range input */}
                    <input
                        type="range"
                        className="city-timeline__range"
                        min={-600}
                        max={2000}
                        step={10}
                        value={cursorYear}
                        onChange={(e) => setCursorYear(Number(e.target.value))}
                    />

                    {/* Cursor position indicator */}
                    <div className="city-timeline__cursor-indicator" style={{ left: `${((cursorYear - (-600)) / (2000 - (-600))) * 100}%` }}>
                        <span>{formatYear(cursorYear)}</span>
                    </div>
                </div>
            </section>

            {/* Events Horizontal Scroll Wrapper */}
            <div className="city-timeline__events-wrapper">
                <button className="city-timeline__nav-btn city-timeline__nav-btn--left" onClick={() => scroll('left')} aria-label="Scroll Left">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>

                <div className="city-timeline__events" ref={scrollRef}>
                    {loading ? (
                        <div className="loader"><div className="loader-spinner" /></div>
                    ) : events.length === 0 ? (
                        <div className="city-timeline__empty glass-card">
                            <p>No historic chronicles found for this era.</p>
                            <p className="city-timeline__empty-hint">Try adjusting the timeline slider above.</p>
                        </div>
                    ) : (
                        events.map((evt, idx) => (
                            <div
                                key={evt._id}
                                className="city-timeline__event animate-fade-in-up"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                                onClick={() => navigate(`/event/${evt._id}`)}
                            >
                                <div className="city-timeline__event-img-wrap">
                                    {evt.imageUrl ? (
                                        <img src={evt.imageUrl} alt={evt.eventName} />
                                    ) : (
                                        <div className="event-card-square__placeholder era-bg--medieval" style={{ height: '100%', borderRadius: 0 }}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 10v11"></path><path d="M19 10v11"></path><path d="M9 10v11"></path><path d="M15 10v11"></path><path d="M4 10l8-7 8 7"></path></svg>
                                        </div>
                                    )}
                                    <div className="city-timeline__event-date-tag">
                                        <span className="badge badge-info">{evt.date}</span>
                                    </div>
                                </div>

                                <div className="city-timeline__event-content">
                                    <h3>{evt.eventName}</h3>
                                    <div className="city-timeline__event-location" style={{ marginBottom: '12px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        {evt.location || 'Colombo National Museum'}
                                    </div>
                                    <p>{evt.description}</p>

                                    <div className="city-timeline__event-footer">
                                        <span className="badge badge-glass">View Chronicles</span>
                                        <div className="city-timeline__event-arrow">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button className="city-timeline__nav-btn city-timeline__nav-btn--right" onClick={() => scroll('right')} aria-label="Scroll Right">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
            </div>
        </div>
    );
}
