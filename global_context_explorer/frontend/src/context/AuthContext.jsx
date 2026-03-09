import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('museum_user'));
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('museum_token');
        if (token) {
            authService
                .getMe()
                .then((res) => setUser(res.data.user))
                .catch((err) => {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('museum_token');
                        localStorage.removeItem('museum_user');
                        setUser(null);
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await authService.login(email, password);
        const { token, user: u } = res.data;
        localStorage.setItem('museum_token', token);
        localStorage.setItem('museum_user', JSON.stringify(u));
        setUser(u);
        return u;
    };

    const logout = () => {
        localStorage.removeItem('museum_token');
        localStorage.removeItem('museum_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
