// votemap-frontend/src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // 추가: 페이지 이동을 위한 라우터

interface Topic {
  id: number;
  title: string;
  option_a: string;
  option_b: string;
}

type VoteStatus = 'idle' | 'voting' | 'voted';

export default function HomePage() {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('idle');
  
  const router = useRouter(); // 추가: 라우터 기능 초기화

  useEffect(() => {
    const fetchCurrentTopic = async () => {
      try {
        const response = await axios.get('http://localhost:3000/topics/current');
        setTopic(response.data);
      } catch (err) {
        setError('오늘의 주제를 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentTopic();
  }, []);
  
  const handleVote = async (choice: 'A' | 'B') => {
    if (!topic) return;
    
    setVoteStatus('voting');
    setError(null);

    try {
      const voteResponse = await axios.post('http://localhost:3000/votes', {
        topic_id: topic.id,
        choice: choice,
        region: '서울',
      });

      setVoteStatus('voted');
      
      // 추가: 투표 성공 후 1.5초 뒤에 결과 페이지로 자동 이동!
      setTimeout(() => {
        router.push('/results');
      }, 1500); // 1.5초 대기

    } catch (err) {
      setError('투표를 기록하는 데 실패했습니다. 다시 시도해주세요.');
      setVoteStatus('idle');
      console.error(err);
    }
  };

  // ... (return 이하 화면을 그리는 코드는 이전과 동일합니다)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-24">
      <header className="absolute top-0 left-0 p-4">
        <h1 className="text-2xl font-bold">VOTEMAP.LIVE</h1>
      </header>

      <div className="w-full max-w-2xl rounded-lg bg-white p-8 text-center shadow-lg">
        {loading && <p className="text-xl">오늘의 주제를 불러오는 중...</p>}
        
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
                <h2 className="mb-6 text-4xl font-bold">{topic.title}</h2>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => handleVote('A')}
                    disabled={voteStatus === 'voting'}
                    className="rounded-md bg-blue-500 px-8 py-4 text-2xl font-bold text-white transition hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {topic.option_a}
                  </button>
                  <button
                    onClick={() => handleVote('B')}
                    disabled={voteStatus === 'voting'}
                    className="rounded-md bg-red-500 px-8 py-4 text-2xl font-bold text-white transition hover:bg-red-600 disabled:bg-gray-400"
                  >
                    {topic.option_b}
                  </button>
                </div>
                {voteStatus === 'voting' && <p className="mt-4 text-lg">투표하는 중...</p>}
              </>
            )}
            
            {!loading && !topic && !error && (
              <p className="text-xl">진행 중인 주제가 없습니다.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}