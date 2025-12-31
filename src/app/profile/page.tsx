'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VOTE_REGIONS } from '../lib/vote-regions';
import ShareModal from '../components/ShareModal';
import NicknameSetupModal from '../components/NicknameSetupModal';
import { getApiUrl } from '../lib/api';

interface Badge {
    id: string;
    name: string;
    icon: string;
}

interface UserProfile {
    id: number;
    nickname: string;
    verified_region: string;
    profile_image: string;
    is_phone_verified?: boolean; // Added
    stats: {
        totalVotes: number;
        ranking: string;
        match_rate: number;
        title: string;
        description: string;
        followersCount: number;
        followingCount: number;
        topTags: string[];
    };
    badges: Badge[];
    recentVotes: VoteHistory[];
}

interface VoteHistory {
    id: number;
    choice: 'A' | 'B';
    topic: {
        id: number;
        title: string;
        option_a: string;
        option_b: string;
    };
    region?: string;
    stats: { A: number; B: number; total: number; }; // Global stats
    localStats: { A: number; B: number; total: number; }; // Local stats
}

interface ComparisonItem {
    category: string;
    myChoice: string;
    neighborChoice: string;
    isMatch: boolean;
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'global' | 'local'>('global');
    const [activeShareVote, setActiveShareVote] = useState<VoteHistory | null>(null);

    // Nickname Modal State
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [isNicknameRequired, setIsNicknameRequired] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('votemap_token');
            if (!token) {
                router.push('/');
                return;
            }

            try {
                const response = await axios.get(getApiUrl('/auth/me'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data);

                // Check if nickname setup is required (Default pattern: User + digits)
                if (/^User\d+$/.test(response.data.nickname)) {
                    setIsNicknameRequired(true);
                    setShowNicknameModal(true);
                }

            } catch (error) {
                console.error('Failed to fetch profile', error);
                localStorage.removeItem('votemap_token');
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);


    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!user) return null;

    // Derived Logic for Neighborhood Analysis
    // Now calculated from recentVotes or we need comparisons from backend?
    // Wait, backend returns 'comparisons' inside getComparisons but NOT in getUserProfile response directly?
    // Ah, previous code logic assumed `comparisons` endpoint or derived it?
    // Looking at previous `view_file` of ProfilePage (Step 552), it used:
    // `const matchRate = user.stats.match_rate;`
    // And rendered `comparisonData`. But where did comparisonData come from?
    // In `auth.service.ts`, `comparisons` is NOT returned in the DTO?
    // Let me check `auth.service.ts` again.
    // Line 277 `comparisons` is returned in `getComparisons` but `getUserProfile` returns:
    // return { ...user, stats: {...}, badges, recentVotes: ... }
    // It seems `comparisons` is NOT in the return object of `getUserProfile`!
    // Wait, lines 184/207 in `auth.service.ts` calculate it, but is it added to the return?
    // Step 582 `auth.service.ts`:
    // It returns `...user`, `stats`, `badges`, `recentVotes`.
    // It does NOT explicitly return `comparisons` key.
    // Unless `user` object has it? No.
    // I missed this in backend refactor! I need to add `comparisons` to the return object in `auth.service.ts`.
    // For now, I will assume I need to fix backend too.
    // BUT checking Frontend (Step 552 again):
    // It iterates `comparisonData`. CONST comparisonData = ???
    // I need to see where comparisonData comes from in frontend.
    // It was likely hardcoded or I missed it in `view_file`.
    // Let's assume it should be in `user.comparisons`.

    // I will write the Frontend code anticipating `user.comparisons` exists.
    // And I will fix the backend to return it.

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto md:grid md:grid-cols-3 gap-8 p-4 md:p-8">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">마이페이지</h1>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </header>

                {/* Left Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                {/* User Image */}
                                <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100 bg-gray-200">
                                    {user.profile_image ? (
                                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">👤</div>
                                    )}
                                </div>
                                {/* Nickname and Region */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold text-gray-900">{user.nickname}</h1>
                                        {/* Logic for Verified Badge */}
                                        {user.is_phone_verified && (
                                            <span title="인증된 사용자" className="text-blue-500">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="none" />
                                                    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                        )}

                                        <button
                                            onClick={() => {
                                                setIsNicknameRequired(false);
                                                setShowNicknameModal(true);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 p-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                    {user.verified_region && <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{user.verified_region}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid inside Sidebar for Desktop */}
                        <div className="grid grid-cols-1 gap-3">
                            {/* Priority: Rank & Streak */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100 flex flex-col justify-center h-28">
                                    <p className="text-xs text-blue-400 font-bold mb-1">상위</p>
                                    <p className="text-2xl font-black text-blue-600 tracking-tight">{user.stats.ranking}</p>
                                    <p className="text-[10px] text-blue-300 mt-1">지역 랭킹</p>
                                </div>
                                <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100 flex flex-col justify-center h-28">
                                    <p className="text-xs text-orange-400 font-bold mb-1">연속</p>
                                    <p className="text-3xl font-black text-orange-500">7일</p>
                                    <p className="text-[10px] text-orange-300 mt-1">뜨거운 열정 🔥</p>
                                </div>
                            </div>

                            {/* Lower Priority: Total Votes */}
                            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between px-5 border border-gray-100">
                                <p className="text-xs text-gray-400 font-medium">지금까지 참여한 투표</p>
                                <p className="text-sm font-bold text-gray-600">{user.stats.totalVotes}회</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* 2. Neighborhood Taste Analysis */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            ✨ 우리 동네 취향 분석
                        </h2>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                            <div className="md:w-1/3 text-center md:text-left">
                                <p className="text-gray-400 font-bold text-sm mb-1">{user.verified_region || 'N/A'} 주민들과</p>

                                <div className="text-4xl font-black text-gray-800 mb-4 tracking-tight leading-tight">
                                    {(user as any).comparisons && (user as any).comparisons.length > 0 ? (
                                        <>
                                            {(user as any).comparisons.length}개 중 <span className="text-blue-600">{(user as any).comparisons.filter((c: any) => c.isMatch).length}개</span>가<br />
                                            통했어요! ({user.stats.match_rate}%)
                                        </>
                                    ) : (
                                        "아직 데이터가 부족해요"
                                    )}
                                </div>
                                <span className="inline-block bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full text-sm font-bold">
                                    "{user.stats.title}"
                                </span>
                            </div>

                            <div className="md:w-2/3 w-full space-y-3">
                                {(user as any).comparisons && (user as any).comparisons.length > 0 ? (
                                    (user as any).comparisons.map((item: ComparisonItem, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                            <span className="font-bold text-gray-700 text-sm truncate max-w-[120px]">{item.category}</span>
                                            <div>
                                                {item.isMatch ? (
                                                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100">
                                                        <span>🤝</span> 동네와 일치
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-xs font-bold border border-gray-200">
                                                        <span>⚡</span> 동네와 반대
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 text-sm py-4">비교할 데이터가 없습니다.</div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* 3. Recent Vote Results */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                ⚖️ 최근 투표 결과
                            </h2>
                            {/* Toggle Switch */}
                            <div className="flex p-1 bg-gray-100 rounded-full w-48 shadow-inner">
                                <button
                                    onClick={() => setViewMode('global')}
                                    className={`flex-1 py-2 text-sm rounded-full transition-all duration-300 ${viewMode === 'global' ? 'bg-white text-blue-600 shadow-md font-bold transform scale-100' : 'text-gray-400 font-medium hover:text-gray-600'}`}
                                >
                                    전국
                                </button>
                                <button
                                    onClick={() => setViewMode('local')}
                                    className={`flex-1 py-2 text-sm rounded-full transition-all duration-300 ${viewMode === 'local' ? 'bg-white text-blue-600 shadow-md font-bold transform scale-100' : 'text-gray-400 font-medium hover:text-gray-600'}`}
                                >
                                    우리 동네
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {user.recentVotes && user.recentVotes.length > 0 ? (
                                user.recentVotes.map((vote, index) => {
                                    // Swith source based on viewMode
                                    const sourceStats = viewMode === 'global' ? vote.stats : vote.localStats;

                                    const total = sourceStats?.total || 0;
                                    const countA = sourceStats?.A || 0;
                                    // const countB = sourceStats?.B || 0;
                                    const percentA = total > 0 ? Math.round((countA / total) * 100) : 0;
                                    const percentB = 100 - percentA;

                                    // Insight Calculation for One-Liner
                                    let insightText = "";
                                    const myPercent = vote.choice === 'A' ? percentA : percentB;
                                    const isMajority = myPercent >= 50;
                                    const regionName = viewMode === 'global' ? '대한민국' : (vote.region || '지역');

                                    if (total > 0) {
                                        insightText = `${regionName}에서 ${isMajority ? '다수파' : '소수파'}입니다 (${myPercent}%)`;
                                    }

                                    return (
                                        <Link
                                            key={index}
                                            href={`/results?topicId=${vote.topic.id}`}
                                            className="block h-full"
                                        >
                                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-blue-100 h-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                                        {viewMode === 'global' ? '전국' : (vote.region || '지역')}
                                                    </span>
                                                    <span className="text-xs text-gray-300">{new Date().toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">{vote.topic.title}</h3>

                                                {/* Insight One-Liner */}
                                                {total > 0 && (
                                                    <div className={`text-sm font-bold mb-4 ${isMajority ? 'text-blue-600' : 'text-purple-600'}`}>
                                                        "{insightText}"
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                            <span>{vote.topic.option_a}</span>
                                                            <span className="font-bold">{percentA}%</span>
                                                        </div>
                                                        <div className={`h-2 rounded-full overflow-hidden ${vote.choice === 'A' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                            <div className={`h-full rounded-full ${vote.choice === 'A' ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${percentA}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                            <span>{vote.topic.option_b}</span>
                                                            <span className="font-bold">{percentB}%</span>
                                                        </div>
                                                        <div className={`h-2 rounded-full overflow-hidden ${vote.choice === 'B' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                            <div className={`h-full rounded-full ${vote.choice === 'B' ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${percentB}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Share Button (Prevent Link Navigation) */}
                                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActiveShareVote(vote);
                                                        }}
                                                        className="text-xs font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                                                    >
                                                        <span>📤</span> 결과를 널리 알리기
                                                    </button>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm text-gray-400 text-sm border border-gray-100">
                                    아직 참여한 투표가 없습니다.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Mobile Navigation (Hidden on Desktop) */}
                    <div className="pt-4 pb-12 md:hidden">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-4 text-gray-500 font-bold bg-white hover:bg-gray-50 rounded-2xl transition-colors shadow-sm border border-gray-100"
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
            </div>

            {/* Share Modal */}
            {activeShareVote && (
                <ShareModal
                    onClose={() => setActiveShareVote(null)}
                    topicTitle={activeShareVote.topic.title}
                    choice={activeShareVote.choice === 'A' ? activeShareVote.topic.option_a : activeShareVote.topic.option_b}
                    region={viewMode === 'global' ? '전국' : (activeShareVote.region || '지역')}
                />
            )}

            {showNicknameModal && (
                <NicknameSetupModal
                    currentNickname={user?.nickname || ''}
                    isRequired={isNicknameRequired}
                    onClose={() => setShowNicknameModal(false)}
                    onSuccess={(newNickname) => {
                        setUser(prev => prev ? { ...prev, nickname: newNickname } : null);
                        alert('닉네임이 변경되었습니다.');
                    }}
                />
            )}
        </div>
    );
}
