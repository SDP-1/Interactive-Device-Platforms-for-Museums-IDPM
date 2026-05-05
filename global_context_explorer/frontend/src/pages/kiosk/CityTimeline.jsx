import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cityService, eventService } from '../../services/api';
import './CityTimeline.css';
import SimpleTimeline from "./SimpleTimeline";

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
                <SimpleTimeline year={cursorYear} onYearChange={setCursorYear} />
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
                                            <span>Historic Monument</span>
                                        </div>
                                    )}
                                </div>

                                <div className="city-timeline__event-content">
                                    <h3>{evt.eventName}</h3>
                                    <div className="city-timeline__event-location" style={{ marginBottom: '12px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        {evt.location || 'Colombo National Museum'}
                                    </div>

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
