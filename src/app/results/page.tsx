/**
 * 결과 페이지 - 투표 결과를 통계로 표시하는 페이지
 * WebSocket을 통해 실시간으로 결과를 업데이트합니다.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import KoreaMap from '../components/KoreaMap';

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
 * 결과 페이지 컴포넌트
 * 선택한 주제의 투표 결과를 통계로 표시하며, WebSocket을 통해 실시간 업데이트합니다.
 */
export default function ResultsPage() {
    const [results, setResults] = useState<ResultsData | null>(null);
    const [topic, setTopic] = useState<Topic | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const topicId = searchParams?.get('topic') || '1';

    /**
     * 컴포넌트 마운트 및 topicId 변경 시:
     * 1. 주제 목록, 현재 주제 정보, 투표 결과를 불러옵니다
     * 2. WebSocket 연결을 설정하여 실시간 업데이트를 받습니다
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 주제 선택기를 위한 모든 주제 목록 불러오기
                const topicsResponse = await axios.get('http://localhost:3001/topics');
                setTopics(topicsResponse.data);
                
                // 현재 선택한 주제 정보 및 투표 결과 불러오기
                const topicResponse = await axios.get(`http://localhost:3001/topics/${topicId}`);
                setTopic(topicResponse.data);
                
                const resultsResponse = await axios.get(`http://localhost:3001/topics/${topicId}/results`);
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
        const socket = io('http://localhost:3001', {
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

    return (
        <main className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-extrabold text-gray-800">{topic.title}</h1>
                            {topics.length > 0 && (
                                <select
                                    value={topicId}
                                    onChange={(e) => {
                                        router.push(`/results?topic=${e.target.value}`);
                                    }}
                                    className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {topics.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <p className="text-lg text-gray-600">
                            총 {total.total_votes.toLocaleString()}명 참여 · 
                            <span className={isConnected ? 'text-green-500' : 'text-gray-400'}>
                                {' '}{isConnected ? '실시간 연결됨' : '연결 중...'}
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push(`/vote/${topicId}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            투표하기
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                        >
                            홈으로
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6">
                {/* Nationwide Results */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4">전국 판세</h2>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                            <div className="flex justify-between font-bold text-lg mb-2">
                                <span className="text-blue-600">{topic.option_a} ({percentA}%)</span>
                                <span className="text-gray-600">{total.A.toLocaleString()}표</span>
                            </div>
                            <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${percentA}%` }}></div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between font-bold text-lg mb-2">
                                <span className="text-red-600">{topic.option_b} ({percentB}%)</span>
                                <span className="text-gray-600">{total.B.toLocaleString()}표</span>
                            </div>
                            <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${percentB}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Korea Map */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4">지역별 투표 현황</h2>
                    <div className="mb-4 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>{topic.option_a} 우세</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>{topic.option_b} 우세</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-300 rounded"></div>
                            <span>투표 없음 / 동점</span>
                        </div>
                    </div>
                    <div className="w-full">
                        <KoreaMap results={by_region} topic={topic} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Top Regions */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">지역별 상세 통계</h2>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {sortedRegions.map(({ region, A, B, total, percentA }, index) => {
                                const aVotes = A || 0;
                                const bVotes = B || 0;
                                return (
                                    <div key={region} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm">{region}</span>
                                            <span className="text-xs text-gray-500">#{index + 1}</span>
                                        </div>
                                        <div className="text-xs text-gray-600 mb-1">
                                            총 {total}표
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1">
                                                <div className="text-xs text-blue-600 mb-1">
                                                    {topic.option_a}: {aVotes}표 ({percentA.toFixed(1)}%)
                                                </div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${percentA}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-red-600 mb-1">
                                                    {topic.option_b}: {bVotes}표 ({(100 - percentA).toFixed(1)}%)
                                                </div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-500" style={{ width: `${100 - percentA}%` }}></div>
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
        </main>
    );
}