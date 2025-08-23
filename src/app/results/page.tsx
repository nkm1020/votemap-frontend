// votemap-frontend/src/app/results/page.tsx

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import KoreaMap from '../components/KoreaMap'; // 우리가 만든 지도 컴포넌트를 불러옵니다!

// ... (ResultsData 인터페이스 정의는 이전과 동일)
interface ResultsData {
    total: { A: number; B: number; total_votes: number; };
    by_region: { [region: string]: { A?: number; B?: number; }; };
}


export default function ResultsPage() {
    const [results, setResults] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    // ... (나머지 state 정의는 이전과 동일)

    // ... (useEffect 데이터 fetching 로직은 이전과 동일)
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await axios.get('http://localhost:3000/topics/1/results');
                setResults(response.data);
            } catch (err) {
                // ...
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    // 화면을 그리는 부분을 대대적으로 수정합니다.
    if (loading) return <div className="flex min-h-screen items-center justify-center text-xl">결과를 불러오는 중...</div>;
    if (!results) return <div className="flex min-h-screen items-center justify-center text-xl">데이터가 없습니다.</div>;

    const { total, by_region } = results;
    const percentA = total.total_votes > 0 ? ((total.A / total.total_votes) * 100).toFixed(1) : 0;
    const percentB = total.total_votes > 0 ? ((total.B / total.total_votes) * 100).toFixed(1) : 0;


    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
            <header className="py-6 text-center">
                <h1 className="text-4xl font-extrabold text-gray-800">탕수육 논쟁 실시간 결과</h1>
                <p className="text-xl text-gray-600 mt-2">총 {total.total_votes}명 참여</p>
            </header>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 왼쪽: 지도 영역 */}
                <div className="rounded-lg bg-white p-4 shadow-lg flex items-center justify-center">
                    {/* 우리가 만든 지도 컴포넌트를 여기에 삽입! */}
                    <KoreaMap results={by_region} />
                </div>

                {/* 오른쪽: 전국 및 지역별 통계 */}
                <div className="rounded-lg bg-white p-8 shadow-lg">
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">전국 판세</h2>
                        {/* ... (이전의 전국 결과 막대 그래프 코드는 그대로) ... */}
                        <div className="flex justify-between font-bold text-lg mb-2">
                            <span className="text-blue-500">부먹 ({percentA}%)</span>
                            <span className="text-red-500">찍먹 ({percentB}%)</span>
                        </div>
                        <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${percentA}%` }}></div>
                        </div>
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold mb-4 border-b pb-2">지역별 상세 통계</h2>
                        {/* ... (이전의 지역별 상세 결과 코드는 그대로) ... */}
                        <div className="grid grid-cols-1 gap-4">
                            {Object.entries(by_region).map(([region, data]) => {
                                // ...
                                return (
                                    <div key={region} className="p-4 border rounded-lg bg-gray-50">
                                        {/* ... */}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}