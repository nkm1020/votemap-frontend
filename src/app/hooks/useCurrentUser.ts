import { useState, useEffect } from 'react';
import axios from 'axios';

export function useCurrentUser() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('votemap_token');
        if (!token) {
            setLoading(false);
            return;
        }

        axios.get('http://localhost:3001/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setUser(res.data);
            })
            .catch((err) => {
                console.error('Failed to fetch user', err);
                // Optionally clear token if 401, but maybe safe to keep generic
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('votemap_token');
                }
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return { user, loading };
}
