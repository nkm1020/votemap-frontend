/**
 * 투표 페이지 - 사용자가 특정 주제에 대해 투표할 수 있는 페이지
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { KOREAN_REGIONS } from '../../lib/regions';
import { getApiUrl } from '../../lib/api';
import { getDeviceUUID } from '../../lib/auth';

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
 * 투표 상태 타입
 */
type VoteStatus = 'idle' | 'voting' | 'voted';

/**
 * 투표 페이지 내부 콘텐츠
 */
function VotePageContent() {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('idle');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [isAutoMode, setIsAutoMode] = useState(false);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { id: topicId } = params;

  /**
   * 컴포넌트 마운트 및 topicId 변경 시 주제 정보를 불러옵니다.
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!topicId) return;
      try {
        const response = await axios.get(getApiUrl(`/topics/${topicId}`));
        setTopic(response.data);
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
          setError('백엔드 서버에 연결할 수 없습니다. 서버 상태를 확인하세요.');
        } else {
          setError('주제를 불러오는 데 실패했습니다.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topicId]);

  /**
   * URL 파라미터 기반 자동 선택 처리
   */
  useEffect(() => {
    const auto = searchParams.get('auto');
    const district = searchParams.get('district'); // 시/군/구 (e.g. 일산동구, 강남구)
    const province = searchParams.get('province'); // 시/도 (e.g. 경기도, 서울특별시)

    if (auto === 'true') {
      let matchedRegion = null;

      if (district) {
        // 정확한 매칭 시도 (KOREAN_REGIONS에 있는가?)
        if (KOREAN_REGIONS.includes(district)) {
          matchedRegion = district;
        }
      }

      // district로 못 찾았으면 province 확인 (세종시 등)
      if (!matchedRegion && province && KOREAN_REGIONS.includes(province)) {
        matchedRegion = province;
        if (province === '세종특별자치시') matchedRegion = '세종시';
      }

      if (matchedRegion) {
        setSelectedRegion(matchedRegion);
        setIsAutoMode(true);
      }
    }
  }, [searchParams]);

  /**
   * 투표를 처리하는 함수
   * 선택한 옵션(A 또는 B)과 지역 정보를 백엔드에 전송합니다.
   * 
   * @param choice - 투표 선택 ('A' 또는 'B')
   */
  const handleVote = async (choice: 'A' | 'B') => {
    if (!topic) return;

    if (!selectedRegion) {
      setError('지역을 선택해주세요.');
      return;
    }

    setVoteStatus('voting');
    setError(null);

    try {
      // Lazy Auth: Get or initiate device UUID
      const user_uuid = getDeviceUUID(); // Requires import

      await axios.post(getApiUrl('/votes'), {
        topic_id: topic.id,
        choice: choice,
        region: selectedRegion,
        user_uuid: user_uuid,
      });

      setVoteStatus('voted');

      setTimeout(() => {
        router.push(`/results?topic=${topic.id}`);
      }, 1500);

    } catch (err) {
      setError('투표를 기록하는 데 실패했습니다. 다시 시도해주세요.');
      setVoteStatus('idle');
      console.error(err);
    }
  };

  const handleManualSelect = () => {
    setIsAutoMode(false);
    setSelectedRegion('');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>VOTEMAP.LIVE</h1>
      </header>

      <div className="w-full max-w-2xl rounded-lg bg-white p-8 text-center shadow-lg">
        {loading && <p className="text-xl">주제를 불러오는 중...</p>}

        {voteStatus === 'voted' ? (
          <div className="text-2xl font-bold text-green-500">
            <h2>투표해주셔서 감사합니다!</h2>
            <p className="mt-4 text-lg">잠시 후 결과 페이지로 이동합니다.</p>
          </div>
        ) : (
          <>
            {error && <p className="text-xl text-red-500">{error}</p>}

            {topic && (
              <>
                <h2 className="mb-2 text-4xl font-bold text-gray-800">{topic.title}</h2>

                <div className="mb-6">
                  {isAutoMode ? (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 animate-fade-in">
                      <p className="text-gray-500 text-sm mb-1">현재 위치 기반 자동 선택</p>
                      <p className="text-2xl font-bold text-blue-800 mb-2">📍 {selectedRegion}</p>
                      <p className="text-gray-600 mb-4">이 지역으로 투표하시겠습니까?</p>
                      <button
                        onClick={handleManualSelect}
                        className="text-sm text-gray-400 underline hover:text-gray-600 transition-colors"
                      >
                        다른 지역에 계신가요? 직접 선택하기
                      </button>
                    </div>
                  ) : (
                    <>
                      <label htmlFor="region-select" className="block text-lg font-semibold text-gray-700 mb-2">
                        지역 선택
                      </label>
                      <select
                        id="region-select"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={voteStatus !== 'idle'}
                      >
                        <option value="">지역을 선택하세요</option>
                        {KOREAN_REGIONS.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                <div className="flex justify-center gap-4 mb-4">
                  <button
                    onClick={() => handleVote('A')}
                    disabled={voteStatus !== 'idle' || !selectedRegion}
                    className="rounded-md bg-blue-500 px-8 py-4 text-2xl font-bold text-white transition hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {topic.option_a}
                  </button>
                  <button
                    onClick={() => handleVote('B')}
                    disabled={voteStatus !== 'idle' || !selectedRegion}
                    className="rounded-md bg-red-500 px-8 py-4 text-2xl font-bold text-white transition hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {topic.option_b}
                  </button>
                </div>

                {voteStatus === 'voting' && (
                  <p className="mt-4 text-lg text-green-600">투표를 기록하는 중...</p>
                )}
              </>
            )}

            {!loading && !topic && !error && (
              <p className="text-xl">해당 주제를 찾을 수 없습니다.</p>
            )}
          </>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>실시간 한국 여론 지형 지도</p>
      </div>
    </main>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-xl">Loading...</div>}>
      <VotePageContent />
    </Suspense>
  );
}
