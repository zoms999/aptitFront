# 📝 폰트 사용 가이드라인 (옥타그노시스 프로젝트)

## 1. 기본 폰트 정책

### 1.1 주요 폰트
- **기본 폰트**: 나눔스퀘어 네오 (NanumSquareNeo)
- **대체 폰트**: Apple SD Gothic Neo, Malgun Gothic, sans-serif

### 1.2 폰트 파일 위치
```
app/fonts/
├── NanumSquareNeo-Variable.woff2        # 가변 폰트 (권장)
├── NanumSquareNeoTTF-aLt.woff2         # 얇은 (Thin)
├── NanumSquareNeoTTF-bRg.woff2         # 보통 (Regular)
├── NanumSquareNeoTTF-cBd.woff2         # 굵은 (Bold)
├── NanumSquareNeoTTF-dEb.woff2         # 매우 굵은 (ExtraBold)
└── NanumSquareNeoTTF-eHv.woff2         # 가장 굵은 (Heavy)
```

## 2. 폰트 가중치 (Font Weight) 규칙

### 2.1 가중치 매핑
```css
font-weight: 100-200  → NanumSquareNeoTTF-aLt (Thin)
font-weight: 300-400  → NanumSquareNeoTTF-bRg (Regular)
font-weight: 500-600  → NanumSquareNeoTTF-cBd (Bold)
font-weight: 700-800  → NanumSquareNeoTTF-dEb (ExtraBold)
font-weight: 900      → NanumSquareNeoTTF-eHv (Heavy)
```

### 2.2 Tailwind CSS 클래스 매핑
```css
.font-thin       → font-weight: 100
.font-extralight → font-weight: 200
.font-light      → font-weight: 300
.font-normal     → font-weight: 400 (기본)
.font-medium     → font-weight: 500
.font-semibold   → font-weight: 600
.font-bold       → font-weight: 700
.font-extrabold  → font-weight: 800
.font-black      → font-weight: 900
```

## 3. 사용 권장사항

### 3.1 UI 요소별 폰트 가중치
- **제목 (h1-h3)**: font-bold (700) 또는 font-semibold (600)
- **부제목 (h4-h6)**: font-medium (500) 또는 font-semibold (600)
- **본문 텍스트**: font-normal (400)
- **강조 텍스트**: font-medium (500) 또는 font-semibold (600)
- **버튼 텍스트**: font-medium (500) 또는 font-semibold (600)
- **라벨/캡션**: font-normal (400) 또는 font-light (300)

### 3.2 폰트 크기 권장사항
```css
/* 제목 */
h1: text-3xl (30px → 28px)
h2: text-2xl (24px → 22.5px)
h3: text-xl (20px → 18.75px)
h4: text-lg (18px → 16.875px)
h5: text-base (16px → 15px)
h6: text-sm (14px → 13.125px)

/* 본문 */
본문: text-base (15px)
작은 텍스트: text-sm (13.125px)
캡션: text-xs (11.25px)
```

## 4. 코드 적용 예시

### 4.1 React 컴포넌트에서 사용
```tsx
// 제목
<h1 className="font-bold text-3xl">메인 제목</h1>
<h2 className="font-semibold text-2xl">부제목</h2>

// 본문
<p className="font-normal text-base">일반 텍스트</p>
<p className="font-medium text-base">강조 텍스트</p>

// 버튼
<button className="font-semibold text-sm">버튼 텍스트</button>
```

### 4.2 CSS에서 직접 사용
```css
.title {
  font-family: 'NanumSquareNeo', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-weight: 700;
  font-size: 1.875rem;
}

.body-text {
  font-family: 'NanumSquareNeo', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-weight: 400;
  font-size: 0.9375rem;
}
```

## 5. 성능 최적화

### 5.1 폰트 로딩 최적화
- **font-display: swap** 사용으로 FOIT(Flash of Invisible Text) 방지
- **preload** 속성으로 중요 폰트 우선 로딩
- **가변 폰트(Variable Font)** 우선 사용으로 파일 크기 최적화

### 5.2 폰트 서브셋팅
- 한글 완성형만 포함하여 파일 크기 최소화
- 사용하지 않는 특수문자 제거

## 6. 접근성 고려사항

### 6.1 가독성
- 최소 폰트 크기: 12px (0.75rem) 이상
- 충분한 행간: 1.4-1.6 권장
- 적절한 자간: -0.01em ~ 0.02em

### 6.2 대비율
- 텍스트와 배경 간 명도 대비 4.5:1 이상 유지
- 중요한 텍스트는 7:1 이상 권장

## 7. 브라우저 호환성

### 7.1 지원 브라우저
- Chrome 36+
- Firefox 39+
- Safari 12+
- Edge 79+

### 7.2 대체 폰트 전략
```css
font-family: 
  'NanumSquareNeo',           /* 기본 웹폰트 */
  'Apple SD Gothic Neo',      /* macOS */
  'Malgun Gothic',           /* Windows */
  'Noto Sans KR',            /* Google Fonts 대체 */
  sans-serif;                /* 시스템 기본 */
```

## 8. 유지보수 가이드

### 8.1 폰트 업데이트 시
1. 기존 폰트 파일 백업
2. 새 폰트 파일로 교체
3. 브라우저 캐시 클리어 확인
4. 다양한 환경에서 테스트

### 8.2 문제 해결
- 폰트가 로드되지 않을 때: 네트워크 탭에서 404 에러 확인
- 폰트가 깨져 보일 때: 문자 인코딩(UTF-8) 확인
- 성능 이슈 시: 폰트 서브셋팅 또는 CDN 사용 검토

---

**📌 주의사항**
- 폰트 라이선스 준수 (나눔폰트는 오픈소스 라이선스)
- 상업적 사용 시 라이선스 조건 재확인
- 폰트 파일 크기로 인한 로딩 시간 고려 