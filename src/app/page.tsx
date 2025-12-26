/**
 * 홈 페이지 - 투표 주제 목록을 표시하고 선택할 수 있는 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { getApiUrl } from './lib/api';
import { useGeolocation } from './hooks/useGeolocation';

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
  const { location, loading: geoLoading, error: geoError } = useGeolocation();

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
          setError('백엔드 서버에 연결할 수 없습니다. 서버 상태를 확인하세요.');
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

  const handleTopicClick = (topicId: number) => {
    if (location && location.region1) {
      // 위치 정보가 있으면 바로 해당 지역 투표 페이지로 이동
      const params = new URLSearchParams();
      params.set('province', location.region1);
      if (location.region2) {
        params.set('district', location.region2);
      }
      params.set('auto', 'true');
      router.push(`/vote/${topicId}?${params.toString()}`);
    } else {
      // 없으면 일반 선택 페이지로 이동
      router.push(`/vote/${topicId}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">V</div>
          <span className="text-xl font-bold tracking-tight text-gray-900">VOTEMAP</span>
        </div>
      </header>

      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
            대한민국의<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">여론 지형</span>을 확인하세요
          </h2>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
            실시간으로 집계되는 지역별 투표 현황을 아름다운 지도 위에서 확인해보세요.
          </p>

          {/* Location Status Badge */}
          <div className="h-8 flex items-center justify-center">
            {geoLoading ? (
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                위치 확인 중...
              </span>
            ) : location ? (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {location.region1} {location.region2} 감지됨 ({location.source.toUpperCase()})
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                위치 정보를 사용할 수 없습니다
              </span>
            )}
          </div>
        </div>

        {/* Topics Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading Topics...</p>
            </div>
          )}

          {error && (
            <div className="col-span-full p-6 bg-red-50 rounded-2xl border border-red-100 text-center text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && topics.map((topic) => (
            <div
              key={topic.id}
              className="group relative bg-white rounded-3xl p-8 shadow-[0_2px_15px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-white/50"
              onClick={() => handleTopicClick(topic.id)}
            >
              <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{topic.title}</h3>
              <p className="text-gray-500 text-sm font-medium mb-6">지금 바로 참여하여 의견을 남기세요.</p>

              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full w-fit group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                {location ? '내 지역에서 투표하기' : '투표하기'}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && topics.length === 0 && (
          <div className="w-full bg-white rounded-3xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
            진행 중인 투표 주제가 없습니다.
          </div>
        )}
      </div>

      <footer className="mt-20 text-center text-sm font-medium text-gray-400">
        <p>&copy; 2025 VOTEMAP. Designed for simplicity.</p>
      </footer>
    </main>
  );
}