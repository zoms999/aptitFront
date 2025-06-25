# APTIT 프로젝트 디자인 시스템 가이드

## 1. 프로젝트 개요
- **프로젝트명**: APTIT (적성검사 플랫폼)
- **기술 스택**: Next.js 15, TypeScript, Tailwind CSS, Prisma
- **디자인 컨셉**: 모던 글래스모피즘 + 그라데이션 기반의 신뢰감 있는 검사 플랫폼

## 2. 디자인 토큰 (Design Tokens)

### 2.1 색상 팔레트
```css
:root {
  /* Primary Colors - 검사 단계별 브랜딩 */
  --color-primary-blue: #3B82F6;      /* 성향 진단 */
  --color-primary-indigo: #6366F1;    /* 사고력 진단 */
  --color-primary-purple: #8B5CF6;    /* 선호도 진단 */
  --color-primary-teal: #14B8A6;      /* 종합검사 브랜딩 */
  
  /* Secondary Colors */
  --color-emerald: #10B981;
  --color-orange: #F97316;
  --color-yellow: #F59E0B;
  --color-pink: #EC4899;
  
  /* Neutral Colors */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-600: #4B5563;
  --color-gray-900: #111827;
  --color-white: #FFFFFF;
  
  /* Background Gradients */
  --bg-gradient-primary: linear-gradient(135deg, #EBF8FF 0%, #E0E7FF 50%, #F3E8FF 100%);
  --bg-gradient-card: rgba(255, 255, 255, 0.9);
  --bg-gradient-backdrop: rgba(255, 255, 255, 0.8);
}
```

### 2.2 타이포그래피
```css
/* Font System */
--font-primary: 'Geist Sans', 'Noto Sans KR', sans-serif;
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 0.9375rem; /* 15px - 프로젝트 기본 */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### 2.3 스페이싱 시스템 (8px Grid)
```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

### 2.4 브레이크포인트
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## 3. 컴포넌트 디자인 시스템

### 3.1 레이아웃 구조
```tsx
// 기본 페이지 레이아웃
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col relative overflow-hidden">
  {/* 배경 장식 요소 */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
    {/* 추가 배경 요소들 */}
  </div>
  
  {/* 헤더 */}
  <header className="bg-white/90 backdrop-blur-md shadow-xl border-b border-white/30 relative z-10">
    {/* 헤더 내용 */}
  </header>
  
  {/* 메인 컨텐츠 */}
  <main className="flex-grow relative z-10">
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 컨텐츠 */}
    </div>
  </main>
</div>
```

### 3.2 진행 상황 헤더
```tsx
// 검사 진행 헤더 컴포넌트
<div className="bg-white/90 backdrop-blur-md shadow-xl border-b border-white/30">
  <div className="max-w-7xl mx-auto px-4 py-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
      {/* 검사 타입 표시 */}
      <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg">
        <svg className="w-5 h-5 mr-2">...</svg>
        종합검사
      </div>
      
      {/* 단계 표시 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 각 단계별 버튼들 */}
      </div>
      
      {/* 진행률 표시 */}
      <div className="flex items-center space-x-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30 shadow-lg">
          {/* 진행률 정보 */}
        </div>
        <div className="w-32 bg-gray-200/50 rounded-full h-3 overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 3.3 카드 컴포넌트
```scss
// 글래스모피즘 카드 스타일
.glass-card {
  @apply bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30;
  @apply hover:shadow-3xl transition-all duration-300;
  
  &--interactive {
    @apply hover:scale-[1.02] cursor-pointer;
  }
  
  &--padding-default {
    @apply p-8;
  }
  
  &--padding-large {
    @apply p-12;
  }
}

// 사용 예시
<div className="glass-card glass-card--interactive glass-card--padding-default">
  {/* 카드 내용 */}
</div>
```

### 3.4 버튼 시스템
```scss
// 기본 버튼 스타일
.btn {
  @apply font-medium rounded-xl transition-all duration-300;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  
  &--primary {
    @apply bg-gradient-to-r from-blue-500 to-indigo-600 text-white;
    @apply hover:from-blue-600 hover:to-indigo-700;
    @apply shadow-lg hover:shadow-xl hover:scale-105;
    @apply focus:ring-blue-500;
  }
  
  &--secondary {
    @apply bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700;
    @apply hover:bg-gray-50/80 hover:shadow-md;
    @apply focus:ring-gray-300;
  }
  
  &--success {
    @apply bg-gradient-to-r from-green-500 to-emerald-600 text-white;
    @apply hover:from-green-600 hover:to-emerald-700;
  }
  
  &--warning {
    @apply bg-gradient-to-r from-orange-500 to-orange-600 text-white;
    @apply hover:from-orange-600 hover:to-orange-700;
  }
  
  &--danger {
    @apply bg-gradient-to-r from-red-500 to-red-600 text-white;
    @apply hover:from-red-600 hover:to-red-700;
  }
  
  &--size-sm {
    @apply px-3 py-2 text-sm;
  }
  
  &--size-md {
    @apply px-4 py-2 text-base;
  }
  
  &--size-lg {
    @apply px-6 py-3 text-lg;
  }
  
  &--size-xl {
    @apply px-8 py-4 text-xl;
  }
}
```

### 3.5 검사 문항 컴포넌트

#### 성향 진단 (6점 척도)
```tsx
// 성향 진단 문항 스타일
<div className="glass-card glass-card--padding-default">
  {testData.questions.map((question, index) => (
    <div key={question.qu_code} className={`${index > 0 ? 'border-t border-gray-200/50 pt-8 mt-8' : ''}`}>
      {/* 질문 헤더 */}
      <div className="flex items-start mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
          <span className="text-white font-bold">{question.qu_order}</span>
        </div>
        <p className="text-lg pt-3 text-gray-900 leading-relaxed">{question.qu_text}</p>
      </div>
      
      {/* 6점 척도 선택지 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pl-16">
        {scaleOptions.map((option) => (
          <button
            key={option.value}
            className={`py-4 px-3 text-center rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
              selectedAnswers[question.qu_code] === option.value
                ? `bg-gradient-to-r ${option.color} text-white shadow-lg scale-105`
                : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700 hover:bg-gray-50/80 hover:shadow-md'
            }`}
          >
            <div className="text-sm">{option.text}</div>
          </button>
        ))}
      </div>
    </div>
  ))}
</div>
```

#### 사고력 진단 (객관식)
```tsx
// 사고력 진단 문항 스타일
<div className="glass-card glass-card--padding-default mb-8">
  <div className="flex items-start mb-6">
    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 mt-1 shadow-lg">
      <span className="text-white font-bold">{question.qu_order}</span>
    </div>
    <div className="flex-1">
      <p className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
        {question.qu_text}
      </p>
      {/* 이미지가 있는 경우 */}
      {question.qu_image && (
        <div className="bg-white/70 backdrop-blur-sm p-6 border border-gray-200/50 rounded-2xl mb-6 shadow-lg">
          <img src={question.qu_image} alt="문제 이미지" className="max-w-full h-auto mx-auto rounded-xl" />
        </div>
      )}
    </div>
  </div>
  
  {/* 객관식 선택지 */}
  <div className="space-y-4 pl-16">
    {question.choices.map((choice) => (
      <button
        key={choice.an_val}
        className={`w-full text-left py-4 px-6 border rounded-2xl transition-all duration-300 flex items-start hover:scale-[1.02] ${
          selectedAnswers[question.qu_code] === choice.an_val
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-xl scale-[1.02]'
            : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:bg-white/90 hover:shadow-lg text-gray-900'
        }`}
      >
        <span className="w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">
          {choice.an_val}
        </span>
        <span className="text-lg font-medium">{choice.an_text}</span>
      </button>
    ))}
  </div>
</div>
```

#### 선호도 진단 (이미지 기반)
```tsx
// 선호도 진단 문항 스타일
<div className="glass-card glass-card--padding-default mb-8">
  <div className="flex items-center mb-6">
    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
      <span className="text-white font-bold">{question.qu_order}</span>
    </div>
    <p className="text-xl text-gray-900 leading-relaxed">
      이미지를 보고 처음 떠오르는 느낌을 <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">빠르게</span> 선택해보자.
    </p>
  </div>

  {/* 문항 이미지 */}
  <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 mb-8 shadow-lg">
    <div className="w-full max-w-3xl mx-auto">
      <img src={question.qu_image} alt="검사 이미지" className="w-full h-auto rounded-xl shadow-lg" />
    </div>
  </div>

  {/* 선택지 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {question.choices.map((choice) => (
      <button
        key={choice.an_val}
        className={`py-6 px-6 text-center rounded-2xl border transition-all duration-300 hover:scale-105 ${
          selectedAnswers[question.qu_code] === choice.an_val
            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-purple-500 shadow-xl scale-105'
            : 'bg-white/80 backdrop-blur-sm border-gray-200/50 text-gray-700 hover:bg-white/90 hover:shadow-lg'
        }`}
      >
        <span className="text-lg font-medium">{choice.an_text}</span>
      </button>
    ))}
  </div>
</div>
```

## 4. 애니메이션 & 인터랙션

### 4.1 전환 애니메이션
```css
/* 페이지 전환 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 카드 호버 효과 */
.hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* 버튼 클릭 효과 */
.btn-click {
  transition: transform 0.1s ease;
}

.btn-click:active {
  transform: scale(0.95);
}
```

### 4.2 로딩 애니메이션
```tsx
// 로딩 스피너 컴포넌트
<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg animate-pulse">
  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
</div>
```

## 5. 접근성 (Accessibility)

### 5.1 ARIA 라벨링
```tsx
// 진행률 바
<div 
  role="progressbar" 
  aria-valuemin="0" 
  aria-valuemax="100" 
  aria-valuenow={progressPercentage}
  aria-label={`검사 진행률 ${progressPercentage}%`}
>
  <div style={{ width: `${progressPercentage}%` }} />
</div>

// 선택 버튼
<button
  aria-pressed={isSelected}
  aria-label={`선택지 ${choice.an_val}: ${choice.an_text}`}
>
  {choice.an_text}
</button>
```

### 5.2 키보드 네비게이션
```css
/* 포커스 스타일 */
.focus-visible:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* 스킵 링크 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}
```

## 6. 반응형 디자인

### 6.1 모바일 우선 접근
```css
/* 기본 (모바일) */
.container {
  padding: 1rem;
  max-width: 100%;
}

.question-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

/* 태블릿 */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
  
  .question-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .container {
    max-width: 1536px;
    margin: 0 auto;
  }
  
  .question-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
  }
}
```

### 6.2 터치 친화적 인터페이스
```css
/* 최소 터치 영역 44x44px */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* 모바일에서 호버 효과 비활성화 */
@media (hover: none) {
  .hover-effect:hover {
    transform: none;
  }
}
```

## 7. 성능 최적화

### 7.1 이미지 최적화
```tsx
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src={question.qu_image}
  alt="검사 이미지"
  width={800}
  height={600}
  className="rounded-xl shadow-lg"
  priority={index < 2} // 첫 두 이미지는 우선 로드
/>
```

### 7.2 CSS 최적화
```css
/* GPU 가속 활용 */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* 레이아웃 리플로우 최소화 */
.no-layout-shift {
  contain: layout style paint;
}
```

## 8. 다크 모드 지원

```css
/* 다크 모드 변수 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-gradient-primary: linear-gradient(135deg, #1E3A8A 0%, #3730A3 50%, #581C87 100%);
    --bg-gradient-card: rgba(17, 24, 39, 0.9);
    --color-text-primary: #F9FAFB;
    --color-text-secondary: #D1D5DB;
  }
}

/* 다크 모드 적용 */
.dark .glass-card {
  @apply bg-gray-900/90 border-gray-700/30;
}
```

## 9. 브랜드 가이드라인

### 9.1 로고 사용법
- 최소 크기: 24px (높이 기준)
- 여백: 로고 높이의 1/2 이상
- 배경: 충분한 대비 확보

### 9.2 색상 사용 원칙
- **파란색 계열**: 신뢰성, 안정성 (성향 진단)
- **보라색 계열**: 창의성, 혁신 (사고력 진단)
- **분홍색 계열**: 감성, 직관 (선호도 진단)
- **청록색**: 종합성, 완성도 (전체 검사)

### 9.3 톤앤매너
- **전문적이면서도 친근한** 언어 사용
- **긍정적이고 격려하는** 메시지
- **명확하고 간결한** 정보 전달
- **개인의 성장을 지원하는** 관점

## 10. 결과 리포트 디자인

### 10.1 전체 레이아웃 구조
```tsx
<article className="result-page max-w-4xl mx-auto p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
  {/* 헤더: 검사명·날짜·요약 */}
  <header className="result-header text-center mb-12">
    <h1 className="text-4xl font-bold text-gray-900 mb-4">APTIT 적성 검사 결과</h1>
    <p className="text-lg text-gray-600">2025-01-20 완료 • 소요 시간: 12분</p>
  </header>

  {/* 요약 도넛 차트: 전체 프로필 적합도 */}
  <section className="result-summary mb-16">
    <div className="glass-card text-center p-12">
      <h2 className="text-2xl font-bold mb-8">전체 적합도</h2>
      <canvas id="donutChart" aria-label="전체 적합도 비율" role="img"></canvas>
      <p className="text-5xl font-bold text-emerald-600 mt-6">76%</p>
    </div>
  </section>

  {/* 역량 분포 방사형 그래프 */}
  <section className="result-radar mb-16">
    <div className="glass-card p-12">
      <h2 className="text-2xl font-bold text-center mb-8">주요 역량 분포</h2>
      <canvas id="radarChart" aria-label="역량별 점수 분포" role="img"></canvas>
    </div>
  </section>

  {/* 세부 항목 막대그래프 */}
  <section className="result-bar mb-16">
    <div className="glass-card p-12">
      <h2 className="text-2xl font-bold text-center mb-8">직무 성향 점수</h2>
      <canvas id="barChart" aria-label="직무 성향 점수 막대그래프" role="img"></canvas>
    </div>
  </section>

  {/* 텍스트 해석 블록 */}
  <section className="result-text">
    <div className="glass-card p-12">
      <h2 className="text-2xl font-bold mb-8">심층 해석</h2>
      <p className="text-lg leading-relaxed mb-6 text-gray-700">
        당신은 분석적 사고와 창의적 문제 해결 역량이 뛰어납니다. 특히...
      </p>
      <ul className="space-y-3 text-lg text-gray-700">
        <li className="flex items-start">
          <span className="w-2 h-2 bg-emerald-500 rounded-full mt-3 mr-3 flex-shrink-0"></span>
          <span><strong>강점:</strong> 논리적 구조화, 세부사항 집중</span>
        </li>
        <li className="flex items-start">
          <span className="w-2 h-2 bg-orange-500 rounded-full mt-3 mr-3 flex-shrink-0"></span>
          <span><strong>개선 과제:</strong> 대인 커뮤니케이션 스킬 강화</span>
        </li>
      </ul>
    </div>
  </section>
</article>
```

### 10.2 차트 컴포넌트 스타일
```css
/* 차트 컨테이너 */
.chart-container {
  position: relative;
  height: 400px;
  margin: 2rem 0;
}

/* 차트 범례 */
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4B5563;
}

.chart-legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
```

이 디자인 시스템은 APTIT 프로젝트의 일관된 사용자 경험을 제공하며, 확장 가능하고 유지보수가 용이한 구조로 설계되었습니다. 🎨✨
  aria-label={`선택지 ${choice.an_val}: ${choice.an_text}`}
>
  {choice.an_text}
</button>
```

### 5.2 키보드 네비게이션
```css
/* 포커스 스타일 */
.focus-visible:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* 스킵 링크 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}
```

## 6. 반응형 디자인

### 6.1 모바일 우선 접근
```css
/* 기본 (모바일) */
.container {
  padding: 1rem;
  max-width: 100%;
}

.question-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

/* 태블릿 */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
  
  .question-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .container {
    max-width: 1536px;
    margin: 0 auto;
  }
  
  .question-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
  }
}
```

### 6.2 터치 친화적 인터페이스
```css
/* 최소 터치 영역 44x44px */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* 모바일에서 호버 효과 비활성화 */
@media (hover: none) {
  .hover-effect:hover {
    transform: none;
  }
}
```

## 7. 성능 최적화

### 7.1 이미지 최적화
```tsx
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src={question.qu_image}
  alt="검사 이미지"
  width={800}
  height={600}
  className="rounded-xl shadow-lg"
  priority={index < 2} // 첫 두 이미지는 우선 로드
/>
```

### 7.2 CSS 최적화
```css
/* GPU 가속 활용 */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* 레이아웃 리플로우 최소화 */
.no-layout-shift {
  contain: layout style paint;
}
```

## 8. 다크 모드 지원

```css
/* 다크 모드 변수 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-gradient-primary: linear-gradient(135deg, #1E3A8A 0%, #3730A3 50%, #581C87 100%);
    --bg-gradient-card: rgba(17, 24, 39, 0.9);
    --color-text-primary: #F9FAFB;
    --color-text-secondary: #D1D5DB;
  }
}

/* 다크 모드 적용 */
.dark .glass-card {
  @apply bg-gray-900/90 border-gray-700/30;
}
```

## 9. 브랜드 가이드라인

### 9.1 로고 사용법
- 최소 크기: 24px (높이 기준)
- 여백: 로고 높이의 1/2 이상
- 배경: 충분한 대비 확보

### 9.2 색상 사용 원칙
- **파란색 계열**: 신뢰성, 안정성 (성향 진단)
- **보라색 계열**: 창의성, 혁신 (사고력 진단)
- **분홍색 계열**: 감성, 직관 (선호도 진단)
- **청록색**: 종합성, 완성도 (전체 검사)

### 9.3 톤앤매너
- **전문적이면서도 친근한** 언어 사용
- **긍정적이고 격려하는** 메시지
- **명확하고 간결한** 정보 전달
- **개인의 성장을 지원하는** 관점

이 디자인 시스템은 APTIT 프로젝트의 일관된 사용자 경험을 제공하며, 확장 가능하고 유지보수가 용이한 구조로 설계되었습니다.


