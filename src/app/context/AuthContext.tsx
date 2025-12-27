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
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('votemap_token');
            if (token) {
                try {
                    const res = await axios.get(getApiUrl('/auth/me'), {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                } catch (error) {
                    console.error('Failed to restore session:', error);
                    localStorage.removeItem('votemap_token');
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (token: string) => {
        localStorage.setItem('votemap_token', token);
        try {
            const res = await axios.get(getApiUrl('/auth/me'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('votemap_token');
        setUser(null);
        window.location.href = '/'; // Hard redirect to clear any other state
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
