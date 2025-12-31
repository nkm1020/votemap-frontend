/**
 * 결과 페이지 - 투표 결과를 통계로 표시하는 페이지
 * WebSocket을 통해 실시간으로 결과를 업데이트합니다.
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import KoreaMap from '../components/KoreaMap';
import UserProfile from '../components/UserProfile';
import { getApiUrl, getSocketUrl } from '../lib/api';
import { useCurrentUser } from '../hooks/useCurrentUser';
import LoginModal from '../components/LoginModal';
import ShareModal from '../components/ShareModal';

/**
 * 투표 결과 데이터 인터페이스
 */
interface ResultsData {
    total: { A: number; B: number; total_votes: number; };
    by_region: { [region: string]: { A?: number; B?: number; }; };
}

/**
 * 투표 주제 정보 인터페이스
 */
interface Topic {
    id: number;
    title: string;
    option_a: string;
    option_b: string;
}

/**
 * 결과 페이지 내부 컴포넌트
 * useSearchParams를 사용하는 부분을 분리했습니다.
 */
function ResultsPageContent() {
    const [results, setResults] = useState<ResultsData | null>(null);
    const [topic, setTopic] = useState<Topic | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showShareModal, setShowShareModal] = useState(false);

    // Share Modal Params
    const hasVoted = searchParams?.get('voted') === 'true';
    const votedChoice = searchParams?.get('choice') || 'A';
    const votedRegion = searchParams?.get('region') || '';

    useEffect(() => {
        if (hasVoted) {
            setShowShareModal(true);
        }
    }, [hasVoted]);

    const { user } = useCurrentUser();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const topicId = searchParams?.get('topicId') || searchParams?.get('topic') || '1';

    /**
     * 컴포넌트 마운트 및 topicId 변경 시:
     * 1. 주제 목록, 현재 주제 정보, 투표 결과를 불러옵니다
     * 2. WebSocket 연결을 설정하여 실시간 업데이트를 받습니다
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 주제 선택기를 위한 모든 주제 목록 불러오기
                const topicsResponse = await axios.get(getApiUrl('/topics'));
                setTopics(topicsResponse.data);

                // 현재 선택한 주제 정보 및 투표 결과 불러오기
                const topicResponse = await axios.get(getApiUrl(`/topics/${topicId}`));
                setTopic(topicResponse.data);

                const resultsResponse = await axios.get(getApiUrl(`/topics/${topicId}/results`));
                setResults(resultsResponse.data);
            } catch (err) {
                setError('데이터를 불러오는 데 실패했습니다.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // WebSocket 연결 설정 (실시간 투표 결과 업데이트를 위해)
        const socket = io(getSocketUrl(), {
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            setIsConnected(true);
            // 현재 주제에 대한 실시간 업데이트 구독
            socket.emit('subscribe_topic', parseInt(topicId, 10));
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        // 개별 투표 업데이트 수신
        socket.on('vote_update', (data: { topicId: number; region: string; choice: string; results: ResultsData }) => {
            if (data.topicId === parseInt(topicId, 10)) {
                setResults(data.results);
            }
        });

        // 전체 결과 업데이트 수신
        socket.on('results_update', (data: { topicId: number; results: ResultsData }) => {
            if (data.topicId === parseInt(topicId, 10)) {
                setResults(data.results);
            }
        });

        socketRef.current = socket;

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('unsubscribe_topic', parseInt(topicId, 10));
                socketRef.current.disconnect();
            }
        };
    }, [topicId]);

    if (loading && !results) {
        return <div className="flex min-h-screen items-center justify-center text-xl">결과를 불러오는 중...</div>;
    }

    if (error) {
        return <div className="flex min-h-screen items-center justify-center text-xl text-red-500">{error}</div>;
    }

    if (!results || !topic) {
        return <div className="flex min-h-screen items-center justify-center text-xl">데이터가 없습니다.</div>;
    }

    const { total, by_region } = results;
    const percentA = total.total_votes > 0 ? ((total.A / total.total_votes) * 100).toFixed(1) : 0;
    const percentB = total.total_votes > 0 ? ((total.B / total.total_votes) * 100).toFixed(1) : 0;

    // 총 투표수 기준으로 지역을 정렬하여 순위 표시
    const sortedRegions = Object.entries(by_region)
        .map(([region, data]) => ({
            region,
            ...data,
            total: (data.A || 0) + (data.B || 0),
            percentA: (data.A || 0) / ((data.A || 0) + (data.B || 0)) * 100,
        }))
        .sort((a, b) => b.total - a.total);

    const handleCloseShareModal = () => {
        setShowShareModal(false);
        // Optional: Clean URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('voted');
        newUrl.searchParams.delete('choice');
        newUrl.searchParams.delete('region');
        router.replace(newUrl.pathname + newUrl.search);
    };

    // Calculate local stats for the shared region if available
    let localPercent = 0;
    let isLeading = false;

    if (results && votedRegion && results.by_region[votedRegion]) {
        const regionData = results.by_region[votedRegion];
        const rTotal = (regionData.A || 0) + (regionData.B || 0);
        if (rTotal > 0) {
            const myVoteCount = votedChoice === 'A' ? (regionData.A || 0) : (regionData.B || 0);
            const otherVoteCount = votedChoice === 'A' ? (regionData.B || 0) : (regionData.A || 0);
            localPercent = (myVoteCount / rTotal) * 100;
            localPercent = Math.round(localPercent * 10) / 10; // 1 decimal place
            isLeading = myVoteCount >= otherVoteCount;
        }
    }


    return (
        <main className="min-h-screen bg-[#F5F5F7] font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
            {/* Share Modal Overlay */}
            {showShareModal && (
                <ShareModal
                    onClose={handleCloseShareModal}
                    topicTitle={topic.title}
                    choice={votedChoice === 'A' ? topic.option_a : topic.option_b}
                    region={votedRegion}
                    percent={localPercent}
                    isLeading={isLeading}
                />
            )}

            {/* Sticky Glass Header */}
            <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex-1 flex items-center gap-6">
                        <div
                            className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => router.push('/')}
                        >
                            V
                        </div>

                        <div className="h-8 w-px bg-gray-300/50"></div>

                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{topic.title}</h1>
                                {topics.length > 0 && (
                                    <div className="relative group">
                                        <select
                                            value={topicId}
                                            onChange={(e) => {
                                                router.push(`/results?topic=${e.target.value}`);
                                            }}
                                            className="appearance-none pl-2 pr-8 py-1 rounded-lg bg-gray-100 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-200 connection-select"
                                        >
                                            {topics.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.title}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`flex h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300 animate-pulse'}`}></span>
                                <p className="text-xs font-medium text-gray-500">
                                    {total.total_votes.toLocaleString()} Votes ·
                                    <span className={isConnected ? 'text-green-600 ml-1' : 'text-gray-400 ml-1'}>
                                        {isConnected ? 'Live' : 'Connecting...'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        {/* User Profile or Login */}
                        {user ? (
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1.5 rounded-full pr-3 transition-colors mr-2"
                                onClick={() => router.push('/profile')}
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
                                    {user.profile_image ? (
                                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-gray-700 hidden sm:block">{user.nickname}</span>
                            </div>
                        ) : (
                            // Logic for LoginModal is complex here without duplicating state. 
                            // Ideally we pass a "open login" handler or use a global store.
                            // For now, simpler to redirect to Home with a query param or just simple implementation.
                            // Since we can't easily perform the modal open here without adding state to ResultsPageContent...
                            // Let's add the state.
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="text-sm font-bold text-gray-600 hover:text-gray-900 mr-4"
                            >
                                Login
                            </button>
                        )}


                        <button
                            onClick={() => router.push(`/vote/${topicId}`)}
                            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-lg shadow-blue-500/30"
                        >
                            Vote Now
                        </button>
                    </div>
                </div>
            </header>

            {isLoginModalOpen && (
                <LoginModal
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginSuccess={() => window.location.reload()} // Simple reload to fetch user
                />
            )}

            <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
                {/* User Profile Stats */}
                <UserProfile />

                {/* Nationwide Results Widget */}
                <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.04)] p-8 border border-white/60">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        Global Trend
                        <span className="text-sm font-normal text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">Nationwide</span>
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        {/* Option A */}
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-lg font-bold text-gray-900">{topic.option_a}</span>
                                <div className="text-right">
                                    <span className="text-3xl font-extrabold text-blue-600">{percentA}%</span>
                                    <span className="text-sm text-gray-400 ml-2 font-medium">{total.A.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000 ease-out"
                                    style={{ width: `${percentA}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="text-gray-300 font-light text-2xl hidden md:block">VS</div>

                        {/* Option B */}
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-lg font-bold text-gray-900">{topic.option_b}</span>
                                <div className="text-right">
                                    <span className="text-3xl font-extrabold text-red-600">{percentB}%</span>
                                    <span className="text-sm text-gray-400 ml-2 font-medium">{total.B.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-1000 ease-out"
                                    style={{ width: `${percentB}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Korea Map Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.04)] p-1 border border-white/60">
                            <div className="p-7 pb-2 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Regional Map</h2>
                                <div className="flex gap-4 text-xs font-semibold">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></div>
                                        <span className="text-gray-600">{topic.option_a}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div>
                                        <span className="text-gray-600">{topic.option_b}</span>
                                    </div>
                                </div>
                            </div>
                            <KoreaMap results={by_region} topic={topic} />
                        </div>
                    </div>

                    {/* Detailed Stats Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.04)] p-0 border border-white/60 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                <h2 className="text-xl font-bold text-gray-900">Breakdown</h2>
                                <p className="text-xs text-gray-400 mt-1">Sorted by total vote volume</p>
                            </div>
                            <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar" style={{ maxHeight: '800px' }}>
                                {sortedRegions.map(({ region, A, B, total, percentA }, index) => {
                                    const aVotes = A || 0;
                                    const bVotes = B || 0;
                                    const isLeadingA = aVotes >= bVotes;

                                    return (
                                        <div key={region} className="group p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-sm transition-all duration-200">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`
                                                        flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold
                                                        ${index < 3 ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500'}
                                                    `}>{index + 1}</span>
                                                    <span className="font-bold text-gray-800">{region}</span>
                                                </div>
                                                <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">{total.toLocaleString()} votes</span>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Bar */}
                                                <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-200 w-full">
                                                    <div className="bg-blue-500 h-full" style={{ width: `${percentA}%` }}></div>
                                                    <div className="bg-red-500 h-full" style={{ width: `${100 - percentA}%` }}></div>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex justify-between text-xs font-medium">
                                                    <div className={isLeadingA ? 'text-blue-600 font-bold' : 'text-gray-500'}>
                                                        {percentA.toFixed(1)}%
                                                    </div>
                                                    <div className={!isLeadingA ? 'text-red-600 font-bold' : 'text-gray-500'}>
                                                        {(100 - percentA).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

/**
 * 결과 페이지 컴포넌트
 * Suspense로 감싸서 useSearchParams를 안전하게 사용합니다.
 */
export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-xl">결과를 불러오는 중...</div>}>
            <ResultsPageContent />
        </Suspense>
    );
}