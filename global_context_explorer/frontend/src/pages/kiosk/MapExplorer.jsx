import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cityService, eventService } from '../../services/api';
import './MapExplorer.css';
import './CityTimeline.css'; // Reuse existing timeline styles

export default function MapExplorer() {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [cities, setCities] = useState([]);
    const [activeCity, setActiveCity] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Sri Lanka Center
    const slCenter = [7.8731, 80.7718];

    // Fetch cities on mount
    useEffect(() => {
        cityService.getAll().then((res) => {
            const allCities = res.data;
            setCities(allCities);

            const params = new URLSearchParams(location.search);
            const cityId = params.get('cityId');
            if (cityId) {
                const city = allCities.find(c => c._id === cityId);
                if (city && city.isActive) {
                    navigate(`/city-timeline/${city._id}`);
                }
            }
        }).catch(console.error);
    }, [location.search, navigate]);

    // Markers and Year logic removed (moved to separate pages)

    // 2. Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        // Create Map
        const map = L.map(mapContainerRef.current, {
            center: slCenter,
            zoom: 8,
            zoomControl: false,
            scrollWheelZoom: true
        });

        // Add Base Layers
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: '&copy; Esri'
        }).addTo(map);

        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
            opacity: 0.5
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // 3. Update Markers when cities load
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || cities.length === 0) return;

        // Clear existing markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        cities.forEach(city => {
            const icon = L.divIcon({
                className: 'custom-leaflet-marker',
                html: `
                    <div class="marker-container ${city.isActive ? 'marker-active' : 'marker-inactive'}">
                        <div class="marker-dot"></div>
                        ${city.isActive ? '<div class="marker-pulse"></div>' : ''}
                    </div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });

            const marker = L.marker([city.latitude, city.longitude], { icon })
                .addTo(map)
                .on('click', () => {
                    if (city.isActive) {
                        navigate(`/city-timeline/${city._id}`);
                    } else {
                        setActiveCity({ ...city, comingSoon: true });
                    }
                })
                .on('mouseover', () => setActiveCity(city))
                .on('mouseout', () => setActiveCity(null));

            markersRef.current.push(marker);
        });
    }, [cities, navigate]);

    return (
        <div className="map-explorer">
            {/* Header Overlay */}
            <header className="map-explorer__header glass-card">
                <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </button>
                <div className="map-explorer__header-text">
                    <h2>Geographic Explorer</h2>
                    <p className="map-explorer__hint">Real-time satellite journey through historic Sri Lanka</p>
                </div>
            </header>

            {/* Pure Leaflet Container */}
            <div className="map-explorer__leaflet-wrapper">
                <div
                    ref={mapContainerRef}
                    className="map-explorer__leaflet-container"
                    style={{ height: '100%', width: '100%' }}
                />

                {/* Legend Overlay */}
                <div className="map-explorer__legend glass-card animate-fade-in">
                    <div className="legend-item">
                        <span className="dot dot-active"></span>
                        <span>Interactive Historic Sites</span>
                    </div>
                    <div className="legend-item">
                        <span className="dot dot-inactive"></span>
                        <span>Upcoming Locations</span>
                    </div>
                </div>

                {/* Info Panel Overlay */}
                {activeCity && (
                    <div className="map-explorer__active-info glass-card animate-slide-up">
                        <div className="info-header">
                            <h3>{activeCity.name}</h3>
                            <span className="coordinate-tag">
                                {activeCity.latitude?.toFixed(4)}, {activeCity.longitude?.toFixed(4)}
                            </span>
                        </div>
                        <p className="info-desc">{activeCity.description}</p>
                        {activeCity.isActive ? (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/city-timeline/${activeCity._id}`)}
                            >
                                Enter Timeline →
                            </button>
                        ) : (
                            <div className="coming-soon-banner">Coming Soon</div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals removed for page navigation */}
        </div>
    );
}
