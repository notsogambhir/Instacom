import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { LoginResponse, AuthPayload } from '@instacom/shared';

interface AuthContextType {
    user: AuthPayload | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthPayload | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial check (Refresh)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.post<LoginResponse>('/auth/refresh');
                if (data.user) {
                    const payload: AuthPayload = {
                        userId: data.user.id,
                        email: data.user.email,
                        role: data.user.role,
                        groupId: data.user.groupId,
                        name: data.user.name
                    };
                    setUser(payload);
                    setAccessToken(data.token);
                    // Store token in localStorage for API interceptor
                    localStorage.setItem('accessToken', data.token);
                }
            } catch (err) {
                // Not logged in or expired
                setUser(null);
                setAccessToken(null);
                localStorage.removeItem('accessToken');
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email: string, pass: string) => {
        const { data } = await api.post<LoginResponse>('/auth/login', { email, pass });
        const payload: AuthPayload = {
            userId: data.user.id,
            email: data.user.email,
            role: data.user.role,
            groupId: data.user.groupId,
            name: data.user.name
        };
        setUser(payload);
        setAccessToken(data.token);
        // Store token in localStorage for API interceptor
        localStorage.setItem('accessToken', data.token);
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
        setAccessToken(null);
        // Remove token from localStorage
        localStorage.removeItem('accessToken');
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
