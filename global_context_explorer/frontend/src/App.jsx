import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

/* ---- Kiosk Pages ---- */
import Home from './pages/kiosk/Home';
import MapExplorer from './pages/kiosk/MapExplorer';
import CityTimeline from './pages/kiosk/CityTimeline';
import EventDetail from './pages/kiosk/EventDetail';

/* ---- Tablet Pages ---- */
import Login from './pages/tablet/Login';
import Dashboard from './pages/tablet/Dashboard';
import AddEvent from './pages/tablet/AddEvent';
import Cities from './pages/tablet/Cities';
import GlobalContextExplorer from './pages/tablet/GlobalContextExplorer';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loader"><div className="loader-spinner" /></div>;
    if (!user) return <Navigate to="/tablet/login" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ---------- Kiosk Routes ---------- */}
                    <Route path="/" element={<Home />} />
                    <Route path="/map" element={<MapExplorer />} />
                    <Route path="/city-timeline/:cityId" element={<CityTimeline />} />
                    <Route path="/event/:eventId" element={<EventDetail />} />

                    {/* ---------- Tablet Routes ---------- */}
                    <Route path="/tablet/login" element={<Login />} />
                    <Route
                        path="/tablet"
                        element={
                            <ProtectedRoute><Dashboard /></ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tablet/add-event"
                        element={
                            <ProtectedRoute><AddEvent /></ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tablet/cities"
                        element={
                            <ProtectedRoute><Cities /></ProtectedRoute>
                        }
                    />
                    <Route path="/tablet/city" element={<Navigate to="/tablet/cities" replace />} />
                    <Route
                        path="/tablet/explore/:eventId"
                        element={
                            <ProtectedRoute><GlobalContextExplorer /></ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
