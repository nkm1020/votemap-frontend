# Vercel 배포 가이드

## 방법 1: Vercel 대시보드에서 배포 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 접속
   - 로그인 후 "Add New..." → "Project" 클릭

2. **Git 저장소 연결**
   - GitHub 저장소 선택: `nkm1020/votemap-frontend`
   - Import 클릭

3. **프로젝트 설정**
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)

4. **환경 변수 설정** (중요!)
   - "Environment Variables" 섹션에서 다음 변수 추가:
   ```
   NEXT_PUBLIC_API_URL=https://votemap-backend.onrender.com
   ```
   - Environment: Production, Preview, Development 모두 선택

5. **Deploy 클릭**
   - 배포가 자동으로 시작됩니다
   - 완료되면 배포 URL이 제공됩니다

## 방법 2: Vercel CLI로 배포

```bash
# Vercel CLI 설치 (이미 설치되어 있다면 생략)
npm i -g vercel

# 프로젝트 디렉토리로 이동
cd /Users/kangmin/Documents/votemap-frontend

# Vercel 로그인
vercel login

# 배포 (처음 배포 시)
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_API_URL production
# 값 입력: https://votemap-backend.onrender.com

# 재배포
vercel --prod
```

## 환경 변수

프로덕션 환경에서 다음 환경 변수가 필요합니다:

- `NEXT_PUBLIC_API_URL`: 백엔드 API URL
  - 값: `https://votemap-backend.onrender.com`

## 배포 후 확인 사항

1. 프론트엔드 URL에서 백엔드 API 연결 확인
2. 투표 기능 테스트
3. 실시간 결과 업데이트 (WebSocket) 확인
4. 지도 표시 확인

## 참고

- Vercel은 Git 저장소에 푸시할 때마다 자동으로 재배포됩니다
- 환경 변수를 변경하면 자동으로 재배포가 트리거됩니다
- 프리뷰 배포는 Pull Request마다 자동으로 생성됩니다

