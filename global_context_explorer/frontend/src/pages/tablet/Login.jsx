import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/tablet', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/tablet');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-page__card glass-card animate-fade-in-up">
                <div className="login-page__icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18"></path>
                        <path d="M3 10h18"></path>
                        <path d="M5 10v11"></path>
                        <path d="M19 10v11"></path>
                        <path d="M9 10v11"></path>
                        <path d="M15 10v11"></path>
                        <path d="M4 10l8-7 8 7"></path>
                    </svg>
                </div>
                <h1 className="login-page__title">Heritage Curator</h1>
                <p className="login-page__subtitle">Sign in to the Research Suite Dashboard</p>

                {error && (
                    <div className="login-page__error animate-shake">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-page__form">
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <div className="input-with-icon">
                            <svg className="field-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <input
                                id="login-email"
                                type="email"
                                className="input-glass"
                                placeholder="curator@museum.lk"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">Security Password</label>
                        <div className="input-with-icon">
                            <svg className="field-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <input
                                id="login-password"
                                type="password"
                                className="input-glass"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn-orange-outline login-page__submit"
                        disabled={loading}
                        id="login-submit-btn"
                        style={{ marginTop: '24px', width: '100%', justifyContent: 'center', height: '50px' }}
                    >
                        {loading ? (
                            <><div className="loader-spinner btn-spinner" /> Authenticating…</>
                        ) : (
                            <>Sign In to Dashboard →</>
                        )}
                    </button>
                </form>

                <button
                    className="btn btn-glass btn-sm login-page__back"
                    onClick={() => navigate('/')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Return to Kiosk
                </button>
            </div>
        </div>
    );
}
