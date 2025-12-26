'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../lib/api';
import { getDeviceUUID } from '../lib/auth';
import LoginModal from './LoginModal';

interface UserStats {
    total_votes: number;
    match_rate: number;
    title: string;
    description: string;
}

interface User {
    id: number;
    nickname: string;
    verified_region?: string;
}

export default function UserProfile() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const uuid = getDeviceUUID();
                if (!uuid) return;

                const response = await axios.get(getApiUrl(`/users/${uuid}/stats`));
                setStats(response.data);

                // For MVP: Check if token exists, and maybe fetching user details would be better
                // But for now, we rely on local state updates after login
                const token = typeof window !== 'undefined' ? localStorage.getItem('votemap_token') : null;
                // If token exists, we could fetch user data (TODO: Needs /auth/me)
            } catch (error) {
                console.error('Failed to fetch user stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleGeoVerify = async () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await axios.post(getApiUrl('/auth/geo-verify'), {
                    user_id: user.id,
                    latitude,
                    longitude
                });
                alert(`Verified as resident of ${response.data.verified_region}!`);
                setUser({ ...user, verified_region: response.data.verified_region });
            } catch (e) {
                console.error(e);
                alert('Verification failed.');
            }
        }, () => {
            alert('Location access denied.');
        });
    };

    if (loading) return null;
    if (!stats || stats.total_votes === 0) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100 relative">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">나의 성향 분석</h3>
                <div className="flex gap-2 items-center">
                    {/* User Badge / Login Status */}
                    {user ? (
                        <span className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                            👤 {user.nickname}
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            Vote ID: {getDeviceUUID().slice(0, 8)}...
                        </span>
                    )}

                    {/* Geo Verification Button */}
                    {user?.verified_region ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                            📍 {user.verified_region} 인증됨
                        </span>
                    ) : (
                        <button
                            onClick={handleGeoVerify}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1
                                ${user
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    : 'bg-gray-800 text-white hover:bg-black shadow-sm'
                                }`}
                        >
                            {user ? '동네 인증하기' : '로그인 & 인증'}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left">
                    <div className="mb-2">
                        <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-2">
                            {stats.title}
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">{stats.description}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 text-center md:text-left">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Votes</p>
                            <p className="text-xl font-bold text-gray-900">{stats.total_votes}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Match Rate</p>
                            <p className="text-xl font-bold text-blue-600">{stats.match_rate}%</p>
                        </div>
                    </div>
                </div>

                {/* Visual Badge Placeholder */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-inner shrink-0">
                    {stats.match_rate}%
                </div>
            </div>

            {showLoginModal && (
                <LoginModal
                    onClose={() => setShowLoginModal(false)}
                    onLoginSuccess={(userData) => setUser(userData)}
                />
            )}
        </div>
    );
}
