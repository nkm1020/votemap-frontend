'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL, getApiUrl } from '../lib/api';

interface User {
    id: number;
    nickname: string;
    phone_number?: string;
    profile_image?: string;
    verified_region?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    token: string | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('votemap_token');
            if (storedToken) {
                setToken(storedToken);
                try {
                    const res = await axios.get(getApiUrl('/auth/me'), {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    setUser(res.data);
                } catch (error) {
                    console.error('Failed to restore session:', error);
                    localStorage.removeItem('votemap_token');
                    setToken(null);
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (newToken: string) => {
        localStorage.setItem('votemap_token', newToken);
        setToken(newToken);
        try {
            const res = await axios.get(getApiUrl('/auth/me'), {
                headers: { Authorization: `Bearer ${newToken}` }
            });
            setUser(res.data);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('votemap_token');
        setToken(null);
        setUser(null);
        window.location.href = '/'; // Hard redirect to clear any other state
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
