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

    // Use token directly or state
    const [authUser, setAuthUser] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = window.localStorage.getItem('votemap_token');
                if (token) {
                    // Fetch Authenticated User Stats
                    const response = await axios.get(getApiUrl('/auth/me'), {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // Transform /auth/me response structure to match needed UI
                    setAuthUser(response.data);
                    setStats({
                        total_votes: response.data.stats.totalVotes,
                        match_rate: response.data.stats.match_rate || 0,
                        title: response.data.stats.title || 'Citizen',
                        description: response.data.stats.description || '평범한 시민입니다.',
                    });
                } else {
                    // Fallback to anonymous UUID stats
                    const uuid = getDeviceUUID();
                    if (uuid) {
                        const response = await axios.get(getApiUrl(`/users/${uuid}/stats`));
                        setStats(response.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user stats:', error);

                // If token failed (expired), try anonymous
                const uuid = getDeviceUUID();
                if (uuid) {
                    const response = await axios.get(getApiUrl(`/users/${uuid}/stats`));
                    setStats(response.data);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleGeoVerify = async () => {
        if (!authUser) {
            setShowLoginModal(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Requires endpoint for auth user
                const token = localStorage.getItem('votemap_token');
                const response = await axios.post(getApiUrl('/auth/geo-verify'), {
                    latitude,
                    longitude
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert(`Verified as resident of ${response.data.verified_region}!`);
                setAuthUser({ ...authUser, verified_region: response.data.verified_region });
            } catch (e) {
                console.error(e);
                alert('Verification failed.');
            }
        }, () => {
            alert('Location access denied.');
        });
    };

    if (loading) return null;
    if (!stats) return null; // Only hide if absolutely no stats (auth or anon)

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100 relative">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">나의 성향 분석</h3>
                <div className="flex gap-2 items-center">
                    {/* User Badge / Login Status */}
                    {authUser ? (
                        <span className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                            👤 {authUser.nickname}
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            Vote ID: {getDeviceUUID().slice(0, 8)}...
                        </span>
                    )}

                    {/* Geo Verification Button */}
                    {authUser?.verified_region ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                            📍 {authUser.verified_region} 인증됨
                        </span>
                    ) : (
                        <button
                            onClick={handleGeoVerify}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1
                                ${authUser
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    : 'bg-gray-800 text-white hover:bg-black shadow-sm'
                                }`}
                        >
                            {authUser ? '동네 인증하기' : '로그인 & 인증'}
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
                    onLoginSuccess={(userData) => {
                        // On simpler implementation: reload to refresh everything
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
