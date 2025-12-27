import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../lib/api';

interface User {
    id: number;
    nickname: string;
    profile_image?: string;
    bio?: string;
    isFollowing?: boolean; // Optimistic UI state
}

interface Props {
    onClose: () => void;
}

export default function FriendSearchModal({ onClose }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [myFollowing, setMyFollowing] = useState<number[]>([]);

    useEffect(() => {
        // Fetch who I follow initially to show corrent button state
        const fetchFollowing = async () => {
            try {
                const token = localStorage.getItem('votemap_token');
                if (!token) return;
                const res = await axios.get(getApiUrl('/follows/my/following'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Map to IDs
                setMyFollowing(res.data.map((f: any) => f.following.id));
            } catch (e) {
                console.error(e);
            }
        };
        fetchFollowing();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await axios.get(getApiUrl(`/follows/search?q=${query}`));
            setResults(res.data);
        } catch (e) {
            console.error('Search failed', e);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async (targetUserId: number) => {
        const token = localStorage.getItem('votemap_token');
        if (!token) return;

        const isFollowing = myFollowing.includes(targetUserId);

        // Optimistic Update
        if (isFollowing) {
            setMyFollowing(prev => prev.filter(id => id !== targetUserId));
        } else {
            setMyFollowing(prev => [...prev, targetUserId]);
        }

        try {
            if (isFollowing) {
                await axios.delete(getApiUrl(`/follows/${targetUserId}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(getApiUrl(`/follows/${targetUserId}`), {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (e) {
            // Revert on error
            console.error('Follow action failed', e);
            if (isFollowing) {
                setMyFollowing(prev => [...prev, targetUserId]);
            } else {
                setMyFollowing(prev => prev.filter(id => id !== targetUserId));
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scaleIn">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">친구 찾기</h2>
                    <p className="text-gray-500 text-sm mb-6">닉네임으로 새로운 친구를 찾아보세요.</p>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="닉네임 검색..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '...' : '검색'}
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {results.length === 0 && !loading && query && (
                            <p className="text-center text-gray-400 py-4">검색 결과가 없습니다.</p>
                        )}

                        {results.map((user) => {
                            const isFollowing = myFollowing.includes(user.id);
                            return (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                                            {user.profile_image ? (
                                                <img src={user.profile_image} alt={user.nickname} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">👤</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{user.nickname}</p>
                                            {user.bio && <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.bio}</p>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleFollowToggle(user.id)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all
                                            ${isFollowing
                                                ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                : 'bg-blue-600 border-transparent text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                                            }`}
                                    >
                                        {isFollowing ? '팔로잉' : '팔로우'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
