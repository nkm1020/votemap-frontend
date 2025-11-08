/**
 * 홈 페이지 - 투표 주제 목록을 표시하고 선택할 수 있는 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { getApiUrl } from './lib/api';

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
 * 홈 페이지 컴포넌트
 * 백엔드에서 투표 주제 목록을 불러와서 표시합니다.
 */
export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * 컴포넌트 마운트 시 백엔드에서 투표 주제 목록을 불러옵니다.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(getApiUrl('/topics'), {
          timeout: 5000, // 5초 타임아웃 추가
        });
        setTopics(response.data);
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
          setError('백엔드 서버에 연결할 수 없습니다. localhost:3001이 실행 중인지 확인하세요.');
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          setError('요청 시간이 초과되었습니다. 백엔드 서버 상태를 확인하세요.');
        } else {
          setError('주제를 불러오는 데 실패했습니다.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">VOTEMAP.LIVE</h1>
      </header>

      <div className="w-full max-w-2xl rounded-lg bg-white p-8 text-center shadow-lg">
        <h2 className="mb-6 text-4xl font-bold text-gray-800">투표할 주제를 선택하세요</h2>
        {loading && <p className="text-xl">주제를 불러오는 중...</p>}
        {error && <p className="text-xl text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="rounded-md border p-4 text-left transition hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/vote/${topic.id}`)}
              >
                <h3 className="text-2xl font-bold text-gray-800">{topic.title}</h3>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && topics.length === 0 && (
          <p className="text-xl">진행 중인 주제가 없습니다.</p>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>실시간 한국 여론 지형 지도</p>
      </div>
    </main>
  );
}