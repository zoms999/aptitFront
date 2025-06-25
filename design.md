# ArtyLink - 종합 적성 검사 시스템

ArtyLink는 성향 진단, 사고력 진단, 선호도 진단을 포함한 종합적인 적성 검사 시스템입니다.

## 주요 기능

### 🌍 다국어 지원 (Multilingual Support)
- **지원 언어**: 한국어(ko-KR), 영어(en-US), 일본어(ja-JP), 중국어(zh-CN)
- **자동 언어 감지**: 브라우저 설정을 기반으로 자동 언어 선택
- **언어별 콘텐츠**: 질문, 선택지, 이미지까지 언어별로 관리
- **실시간 언어 전환**: 페이지 새로고침 없이 언어 변경 가능

### 📝 적성 검사 시스템
- **성향 진단**: 개인의 성격과 행동 패턴 분석
- **사고력 진단**: 논리적 사고력과 문제 해결 능력 평가
- **선호도 진단**: 이미지 기반 선호도 및 성향 분석

### 🎨 사용자 친화적 인터페이스
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **직관적인 UI**: 단계별 진행 상황 표시 및 명확한 네비게이션
- **다양한 입력 방식**: 텍스트, 이미지, 스케일 기반 선택지 지원

## 기술 스택

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **Internationalization**: Custom i18n utility functions

## 다국어 테이블 구조

### 핵심 테이블 (언어 독립적)
- `mwd_question`: 질문의 구조와 순서
- `mwd_question_asset`: 질문 이미지 자산
- `mwd_question_choice`: 선택지 구조와 가중치

### 번역 테이블 (언어별)
- `mwd_question_lang`: 질문 텍스트 번역
- `mwd_question_asset_lang`: 이미지 경로 번역
- `mwd_question_choice_lang`: 선택지 텍스트 번역

## 시작하기

### 1. 개발 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에서 데이터베이스 및 인증 설정

# 데이터베이스 스키마 적용
npx prisma generate
npx prisma db push
```

### 2. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

### 3. 다국어 데이터 마이그레이션

기존 데이터를 새로운 다국어 구조로 마이그레이션하려면:

```bash
# 마이그레이션 스크립트 실행
psql -d your_database -f scripts/migrate-to-multilingual.sql
```

## 다국어 지원 사용법

### 프론트엔드에서 언어 처리

```typescript
import { getCurrentLanguage, setLanguage, getLocalizedText } from '../lib/i18n';

// 현재 언어 가져오기
const currentLang = getCurrentLanguage();

// 언어 변경
setLanguage('en-US');

// 다국어 텍스트 처리
const localizedText = getLocalizedText({
  'ko-KR': '안녕하세요',
  'en-US': 'Hello',
  'ja-JP': 'こんにちは'
});
```

### API에서 언어 처리

```typescript
// API 호출 시 언어 헤더 포함
const response = await fetch('/api/test/1/start', {
  headers: getLanguageHeaders()
});
```

## 프로젝트 구조

```
aptit-front/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── test/              # 검사 페이지
│   └── components/        # 공통 컴포넌트
├── components/            # 재사용 가능한 컴포넌트
├── lib/                   # 유틸리티 함수
│   ├── i18n.ts           # 다국어 지원 유틸리티
│   └── db/               # 데이터베이스 설정
├── prisma/               # 데이터베이스 스키마
└── scripts/              # 마이그레이션 스크립트
```

## 환경 변수

```env
# 데이터베이스
DATABASE_URL="postgresql://..."

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth 제공자 (선택사항)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 가져오기
3. 환경 변수 설정
4. 자동 배포 완료

### 기타 플랫폼

Next.js는 다양한 플랫폼에서 배포 가능합니다. 자세한 내용은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 참조하세요.

## 기여하기

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.
