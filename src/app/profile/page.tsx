'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FriendSearchModal from '../components/FriendSearchModal';

interface Badge {
    id: string;
    name: string;
    icon: string;
}

interface VoteHistory {
    id: number;
    choice: string;
    region: string;
    voted_at: string;
    topic?: {
        id: number;
        title: string;
    };
}

interface UserProfile {
    nickname: string;
    email: string;
    profile_image?: string;
    provider?: string;
    verified_region?: string;
    stats: {
        totalVotes: number;
        ranking: string;
        match_rate?: number;
        title?: string;
        followersCount?: number;
        followingCount?: number;
    };
    badges: Badge[];
    recentVotes: VoteHistory[];
    comparisons?: {
        category: string;
        myChoice: string;
        neighborChoice: string;
        isMatch: boolean;
    }[];
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFriendModal, setShowFriendModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('votemap_token');
        if (!token) {
            router.push('/');
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await axios.get('http://localhost:3001/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data);
            } catch (error: any) {
                console.error('Failed to fetch profile', error);
                if (error.response) {
                    alert(`프로필 불러오기 실패: ${error.response.status} ${error.response.statusText}`);
                }
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">Loading...</div>;
    if (!user) return null;

    // --- Real Data Derived from User Profile ---
    const rankPercent = user.stats.ranking || "Top 100%";
    const totalVotes = user.stats.totalVotes;
    // Calculate streak or default (Backend doesn't provide yet)
    const streak = totalVotes > 0 ? Math.min(totalVotes, 7) : 0;
    const matchRate = user.stats.match_rate || 0;
    const userTitle = user.stats.title || "Citizen";

    // Mock tags for now
    const tags = ["#안전지향", "#실속파", "#환경보호"];

    const comparisonData = user.comparisons && user.comparisons.length > 0
        ? user.comparisons
        : [];
    // -----------------------------------------------------------

    return (
        <div className="min-h-screen bg-[#F8F9FA] p-4 font-sans text-gray-800">
            <div className="max-w-md mx-auto space-y-8">

                {/* 0. Top Bar / Profile Summary */}
                <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-200">
                            {user.profile_image ? (
                                <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl text-gray-500">👤</div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{user.nickname}</h1>
                            {user.verified_region && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{user.verified_region}</span>}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFriendModal(true)}
                        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                        🔍
                    </button>
                </div>

                {/* 1. Stats Cards (My 여론 통계) */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-blue-600">📊</span>
                        <h2 className="font-bold text-lg text-gray-800">나의 여론 통계</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-2xl p-4 shadow-sm text-center flex flex-col items-center justify-center aspect-[4/3]">
                            <p className="text-3xl font-black text-gray-800 leading-none mb-1">{user.stats.totalVotes}</p>
                            <p className="text-xs text-gray-400 font-bold">총 투표</p>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-4 shadow-sm text-center flex flex-col items-center justify-center aspect-[4/3] border border-blue-100">
                            <p className="text-xl font-black text-blue-600 leading-none mb-1">{rankPercent}</p>
                            <p className="text-xs text-blue-300 font-bold">지역 랭킹</p>
                        </div>
                        <div className="bg-orange-50 rounded-2xl p-4 shadow-sm text-center flex flex-col items-center justify-center aspect-[4/3] border border-orange-100">
                            <p className="text-2xl font-black text-orange-500 leading-none mb-1">{streak}🔥</p>
                            <p className="text-xs text-orange-300 font-bold">일 연속</p>
                        </div>
                    </div>
                </section>

                {/* 2. Neighborhood Taste Analysis (우리 동네 취향 분석) */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-purple-600">✨</span>
                        <h2 className="font-bold text-lg text-gray-800">우리 동네 취향 분석</h2>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-50">
                        {/* Summary Header */}
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-400 mb-1">{user.verified_region || '우리 동네'} 주민들과</p>
                            <div className="text-4xl font-black text-gray-800 mb-4">
                                {matchRate}% <span className="text-xl font-medium text-gray-500">통했어요!</span>
                            </div>
                            <div className="inline-block bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full font-bold text-sm mb-3">
                                "{userTitle}"
                            </div>
                            <div className="flex justify-center gap-2 text-xs text-gray-400 font-medium">
                                {tags.map(tag => <span key={tag} className="bg-gray-50 px-2 py-1 rounded">{tag}</span>)}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="grid grid-cols-4 text-xs text-gray-400 font-bold mb-3 text-center border-b border-gray-200 pb-2">
                                <div className="col-span-2 text-left pl-2">항목</div>
                                <div>나</div>
                                <div>동네</div>
                            </div>
                            <div className="space-y-4">
                                {comparisonData.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-4 items-center text-sm">
                                        <div className="col-span-2 font-bold text-gray-700 pl-2 truncate pr-2">{item.category}</div>
                                        <div className={`text-center font-bold ${item.isMatch ? 'text-blue-600' : 'text-purple-600'}`}>{item.myChoice}</div>
                                        <div className="text-center text-gray-400">{item.neighborChoice}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Recent Vote Results (최근 투표 결과) */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-red-500">⚖️</span>
                        <h2 className="font-bold text-lg text-gray-800">최근 투표 결과</h2>
                    </div>

                    <div className="space-y-3">
                        {user.recentVotes && user.recentVotes.length > 0 ? (
                            user.recentVotes.map((vote) => (
                                <div key={vote.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 pr-4">{vote.topic?.title || '알 수 없는 투표'}</h3>
                                        <span className="text-xs text-gray-300 font-medium whitespace-nowrap">{new Date(vote.voted_at).toLocaleDateString()}</span>
                                    </div>

                                    {/* Visual Representation (Mock Progress) */}
                                    <div className="space-y-3">
                                        {/* My Choice */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={`font-bold ${vote.choice === 'A' ? 'text-blue-600' : 'text-gray-500'}`}>
                                                    {vote.topic?.title ? '선택 A' : '내 선택'}
                                                    {vote.choice === 'A' && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-full">MY</span>}
                                                </span>
                                                <span className="text-gray-400 font-bold">{vote.choice === 'A' ? '50%' : '30%'}</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${vote.choice === 'A' ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: vote.choice === 'A' ? '50%' : '30%' }}></div>
                                            </div>
                                        </div>

                                        {/* Other Option */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={`font-bold ${vote.choice === 'B' ? 'text-blue-600' : 'text-gray-500'}`}>
                                                    {vote.topic?.title ? '선택 B' : '상대 선택'}
                                                    {vote.choice === 'B' && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-full">MY</span>}
                                                </span>
                                                <span className="text-gray-400 font-bold">{vote.choice === 'B' ? '50%' : '70%'}</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${vote.choice === 'B' ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: vote.choice === 'B' ? '50%' : '70%' }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 text-right text-xs text-gray-400">
                                        총 1,250명 참여
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-2xl shadow-sm text-gray-400 text-sm">
                                아직 참여한 투표가 없습니다.
                            </div>
                        )}
                    </div>
                </section>

                <div className="pt-4 pb-12">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-4 text-gray-500 font-bold bg-white hover:bg-gray-50 rounded-2xl transition-colors shadow-sm"
                    >
                        메인으로 돌아가기
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('votemap_token');
                            router.push('/');
                        }}
                        className="w-full py-2 mt-2 text-red-300 text-sm font-medium hover:text-red-400 transition-colors"
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            {/* Friend Search Modal */}
            {showFriendModal && (
                <FriendSearchModal onClose={() => setShowFriendModal(false)} />
            )}
        </div>
    );
}
