/**
 * API 설정 및 유틸리티
 * 환경 변수에서 API URL을 가져옵니다.
 */

// 백엔드 API 기본 URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 디버깅: 환경 변수 확인
if (typeof window !== 'undefined') {
  console.log('[API Config] API_BASE_URL:', API_BASE_URL);
  console.log('[API Config] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  // 환경 변수가 없으면 경고
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn('[API Config] ⚠️ NEXT_PUBLIC_API_URL이 설정되지 않았습니다! Vercel 환경 변수를 확인하세요.');
  }
}

/**
 * API 엔드포인트를 생성합니다
 */
export function getApiUrl(endpoint: string): string {
  // endpoint가 이미 전체 URL인 경우 그대로 반환
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // 상대 경로인 경우 기본 URL과 결합
  const baseUrl = API_BASE_URL.replace(/\/$/, ''); // 끝의 슬래시 제거
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${path}`;
  
  // 디버깅: 생성된 URL 확인
  if (typeof window !== 'undefined') {
    console.log('[API] Request URL:', fullUrl);
  }
  
  return fullUrl;
}

/**
 * Socket.IO 서버 URL을 가져옵니다
 */
export function getSocketUrl(): string {
  return API_BASE_URL;
}


