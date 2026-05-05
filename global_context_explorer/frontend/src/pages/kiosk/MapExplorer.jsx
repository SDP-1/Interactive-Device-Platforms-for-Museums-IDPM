import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cityService, districtMuseumService } from '../../services/api';
import './MapExplorer.css';
import './CityTimeline.css'; // Reuse existing timeline styles

const districtGeoJsonUrl = new URL('../../../geoBoundaries-LKA-ADM2.geojson', import.meta.url).href;
const museumCategoryLabel = 'Sri Lanka Museums';
const museumDistrictNames = new Set([
    'colombo',
    'galle',
    'hambantota',
    'ratnapura',
    'kandy',
    'anuradhapura',
    'polonnaruwa',
]);

const mapCategories = [
    {
        label: 'Sri Lanka Museums',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M5 21V8l7-4 7 4v13"></path><path d="M8 21v-8h8v8"></path><path d="M12 4v4"></path></svg>
        ),
    },
    {
        label: 'Ancient Kingdoms',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M5 21V7l7-4 7 4v14"></path><path d="M9 21v-6h6v6"></path></svg>
        ),
    },
    {
        label: 'Archaeological Sites',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19h16"></path><path d="M7 19V9l5-4 5 4v10"></path><path d="M11 19v-5h2v5"></path><path d="M8 11h8"></path></svg>
        ),
    },
    {
        label: 'Geographical Zones',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3c3 3 3 15 0 18"></path></svg>
        ),
    },
    {
        label: 'Ancient Harbours',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18"></path><path d="M5 18V9l4-2 4 2v9"></path><path d="M13 18V7l4-2 2 1v12"></path><path d="M7 12h2"></path><path d="M15 10h2"></path></svg>
        ),
    },
    {
        label: 'Present Harbors',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18"></path><path d="M5 18V10l4 2 4-2 6 2v6"></path><path d="M9 12V5"></path><path d="M15 14V7"></path></svg>
        ),
    },
];

export default function MapExplorer() {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const districtLayerRef = useRef(null);
    const activeCategoryRef = useRef(null);
    const [cities, setCities] = useState([]);
    const [activeCity, setActiveCity] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [museumDistrictName, setMuseumDistrictName] = useState('');
    const [museumDistrictMuseums, setMuseumDistrictMuseums] = useState([]);
    const [museumMuseumIndex, setMuseumMuseumIndex] = useState(0);
    const [museumLoading, setMuseumLoading] = useState(false);
    const [museumError, setMuseumError] = useState('');
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
                if (city?.isActive) {
                    navigate(`/city-timeline/${city._id}`);
                }
            }
        }).catch(console.error);
    }, [location.search, navigate]);

    // Markers and Year logic removed (moved to separate pages)

    const isMuseumMode = activeCategory === museumCategoryLabel;

    useEffect(() => {
        activeCategoryRef.current = activeCategory;
    }, [activeCategory]);

    const normalizeDistrictName = (name) => name.toLowerCase().replace(/\s+district$/, '').trim();

    const handleCategoryClick = (categoryLabel) => {
        setActiveCity(null);

        if (categoryLabel === museumCategoryLabel) {
            setActiveCategory((currentCategory) => (currentCategory === museumCategoryLabel ? null : museumCategoryLabel));
            return;
        }

        setActiveCategory(categoryLabel);
    };

    const closeMuseumModal = () => {
        setMuseumDistrictName('');
        setMuseumDistrictMuseums([]);
        setMuseumMuseumIndex(0);
        setMuseumLoading(false);
        setMuseumError('');
    };

    const openMuseumModalForDistrict = async (districtLabel) => {
        const districtSlug = normalizeDistrictName(districtLabel);
        setMuseumDistrictName(districtLabel);
        setMuseumMuseumIndex(0);
        setMuseumLoading(true);
        setMuseumError('');
        setMuseumDistrictMuseums([]);

        try {
            const response = await districtMuseumService.getByDistrict(districtSlug);
            const museums = response.data?.museums || [];
            setMuseumDistrictMuseums(museums);
            if (!museums.length) {
                setMuseumError('No museums have been added for this district yet.');
            }
        } catch (error) {
            console.error('Failed to load district museums', error);
            setMuseumError('Unable to load museum entries for this district.');
        } finally {
            setMuseumLoading(false);
        }
    };

    const goToMuseum = (direction) => {
        setMuseumMuseumIndex((currentIndex) => {
            const total = museumDistrictMuseums.length;
            if (!total) return 0;
            return (currentIndex + direction + total) % total;
        });
    };

    const buildMuseumDistrictLayer = (map) => {
        fetch(districtGeoJsonUrl)
            .then((response) => response.json())
            .then((data) => {
                if (!mapInstanceRef.current || activeCategoryRef.current !== museumCategoryLabel) {
                    return;
                }

                const districtFeatures = (data.features || []).filter((feature) => {
                    const districtName = feature?.properties?.shapeName;
                    if (!districtName) return false;
                    return museumDistrictNames.has(normalizeDistrictName(districtName));
                });

                const districtCollection = {
                    type: 'FeatureCollection',
                    features: districtFeatures,
                };

                const layer = L.geoJSON(districtCollection, {
                    style: {
                        color: '#ffd36f',
                        weight: 2.5,
                        opacity: 0.98,
                        fillColor: '#3d82ff',
                        fillOpacity: 0.22,
                    },
                    onEachFeature: (feature, layerInstance) => {
                        const districtName = feature?.properties?.shapeName || 'District';
                        layerInstance.bindTooltip(districtName, {
                            sticky: true,
                            direction: 'top',
                            className: 'map-explorer__district-tooltip',
                        });
                        layerInstance.on('click', () => {
                            openMuseumModalForDistrict(districtName);
                        });
                    },
                }).addTo(map);

                districtLayerRef.current = layer;

                const bounds = layer.getBounds();
                if (bounds?.isValid()) {
                    map.fitBounds(bounds.pad(0.14), { animate: true });
                }
            })
            .catch((error) => {
                console.error('Failed to load museum districts', error);
            });
    };

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
                .on('click', () => {
                    if (city.isActive) {
                        navigate(`/city-timeline/${city._id}`);
                    } else {
                        setActiveCity({ ...city, comingSoon: true });
                    }
                })
                .on('mouseover', () => setActiveCity(city))
                .on('mouseout', () => setActiveCity(null));

            if (!isMuseumMode) {
                marker.addTo(map);
            }

            markersRef.current.push(marker);
        });
    }, [cities, navigate, isMuseumMode]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        markersRef.current.forEach((marker) => {
            if (isMuseumMode) {
                marker.remove();
            } else if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }
        });

        if (districtLayerRef.current) {
            districtLayerRef.current.remove();
            districtLayerRef.current = null;
        }

        if (isMuseumMode) {
            buildMuseumDistrictLayer(map);
        }
    }, [isMuseumMode]);

    const activeMuseum = museumDistrictMuseums[museumMuseumIndex] || null;

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
                <div className="map-explorer__category-strip" aria-label="Map categories">
                    {mapCategories.map((category) => (
                        <button
                            key={category.label}
                            className={`map-explorer__category-btn${activeCategory === category.label ? ' map-explorer__category-btn--active' : ''}`}
                            type="button"
                            onClick={() => handleCategoryClick(category.label)}
                        >
                            <span className="map-explorer__category-icon" aria-hidden="true">{category.icon}</span>
                            <span>{category.label}</span>
                        </button>
                    ))}
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
                    {isMuseumMode ? (
                        <>
                            <div className="legend-item">
                                <span className="dot dot-districts"></span>
                                <span>Museum District Highlights</span>
                            </div>
                            <div className="legend-item">
                                <span className="dot dot-muted"></span>
                                <span>City dots hidden in this mode</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="legend-item">
                                <span className="dot dot-active"></span>
                                <span>Interactive Historic Sites</span>
                            </div>
                            <div className="legend-item">
                                <span className="dot dot-inactive"></span>
                                <span>Upcoming Locations</span>
                            </div>
                        </>
                    )}
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

                {museumDistrictName && (
                    <div className="map-explorer__museum-modal-backdrop" role="presentation" onClick={closeMuseumModal}>
                        <div
                            className="map-explorer__museum-modal glass-card"
                            role="dialog"
                            aria-modal="true"
                            aria-label={`${museumDistrictName} museums`}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button className="map-explorer__museum-close" type="button" onClick={closeMuseumModal} aria-label="Close museum modal">
                                ×
                            </button>
                            <div className="map-explorer__museum-modal-header">
                                <span className="museum-modal__eyebrow">District Collection</span>
                                <h3>{museumDistrictName}</h3>
                            </div>

                            {museumLoading ? (
                                <div className="map-explorer__museum-state">Loading museums...</div>
                            ) : museumError ? (
                                <div className="map-explorer__museum-state map-explorer__museum-state--error">{museumError}</div>
                            ) : activeMuseum ? (
                                <>
                                    <div className="map-explorer__museum-frame">
                                        <img src={activeMuseum.imageUrl} alt={activeMuseum.museumName} />
                                    </div>
                                    <div className="map-explorer__museum-name">{activeMuseum.museumName}</div>
                                    {activeMuseum.description && <p className="map-explorer__museum-description">{activeMuseum.description}</p>}
                                    <div className="map-explorer__museum-nav">
                                        <button type="button" className="map-explorer__museum-nav-btn" onClick={() => goToMuseum(-1)}>
                                            ← Back
                                        </button>
                                        <span className="map-explorer__museum-counter">
                                            {museumMuseumIndex + 1} / {museumDistrictMuseums.length}
                                        </span>
                                        <button type="button" className="map-explorer__museum-nav-btn" onClick={() => goToMuseum(1)}>
                                            Forward →
                                        </button>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals removed for page navigation */}
        </div>
    );
}
