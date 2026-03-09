import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cityService } from '../../services/api';
import AdminSidebar from '../../components/tablet/AdminSidebar';
import './Cities.css';

export default function Cities() {
    const navigate = useNavigate();
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(null);

    useEffect(() => {
        loadCities();
    }, []);

    const loadCities = async () => {
        try {
            const res = await cityService.getAll();
            setCities(res.data);
        } catch (err) {
            console.error('Failed to load cities:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (city) => {
        try {
            await cityService.update(city._id, { isActive: !city.isActive });
            setCities((prev) =>
                prev.map((c) => c._id === city._id ? { ...c, isActive: !c.isActive } : c)
            );
        } catch (err) {
            console.error('Failed to update city:', err);
        }
    };

    return (
        <div className="cities-layout">
            <AdminSidebar />
            <div className="cities-page">
                {/* Header */}
                <header className="cities-page__header glass-card">
                    <button className="btn-glass" onClick={() => navigate('/tablet')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back to Dashboard
                    </button>
                    <div>
                        <h2>Cities Management</h2>
                        <p className="cities-page__subtitle">Manage city data and activation status</p>
                    </div>
                    <span className="badge badge-info">{cities.length} cities</span>
                </header>

                {/* Cities Grid */}
                {loading ? (
                    <div className="loader"><div className="loader-spinner" /></div>
                ) : (
                    <div className="cities-page__grid stagger-children">
                        {cities.map((city, idx) => (
                            <div
                                key={city._id}
                                className={`city-card glass-card animate-fade-in-up ${city.isActive ? 'city-card--active' : 'city-card--inactive'}`}
                                style={{ animationDelay: `${idx * 0.06}s` }}
                            >
                                {/* Status indicator */}
                                <div className="city-card__status-bar" />

                                {/* Header */}
                                <div className="city-card__header">
                                    <div className="city-card__icon-wrap">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2V6a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v12Z"></path><path d="M12 2v2"></path><path d="M12 18v2"></path><path d="M12 10h.01"></path><path d="M17 9h.01"></path><path d="M17 13h.01"></path><path d="M17 5h.01"></path><path d="M7 9h.01"></path><path d="M7 13h.01"></path><path d="M7 5h.01"></path></svg>
                                    </div>
                                    <div className="city-card__names">
                                        <h3 className="city-card__name">{city.name}</h3>
                                        <span className="city-card__native-name">
                                            {city.sinhalaName} • {city.tamilName}
                                        </span>
                                    </div>
                                    <span className={`badge ${city.isActive ? 'badge-success' : 'badge-warning'}`}>
                                        {city.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="city-card__info">
                                    <div className="city-card__info-item">
                                        <span className="city-card__info-label">Province</span>
                                        <span className="city-card__info-value">{city.province}</span>
                                    </div>
                                    <div className="city-card__info-item">
                                        <span className="city-card__info-label">Coordinates</span>
                                        <span className="city-card__info-value">
                                            {city.latitude?.toFixed(4)}, {city.longitude?.toFixed(4)}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="city-card__description">{city.description}</p>

                                {/* Actions */}
                                <div className="city-card__actions">
                                    <button
                                        className={`btn-orange-outline ${city.isActive ? 'btn-deactivate' : ''}`}
                                        onClick={() => handleToggleActive(city)}
                                    >
                                        {city.isActive ? (
                                            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Deactivate</>
                                        ) : (
                                            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Activate</>
                                        )}
                                    </button>
                                    <button
                                        className="btn-glass"
                                        onClick={() => navigate(`/map?cityId=${city._id}`)}
                                        disabled={!city.isActive}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                                        View on Map
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
