# 관리자 대시보드 마이그레이션 문서

## 기존 시스템 분석
- 기존 시스템은 레거시 대시보드 형태로 최근 등록, 최근동록(기관), 검사완료(개인), 검사완료(팀별) 등의 리스트를 표시
- 좌측 네비게이션에는 Dashboard, 기업정보, 매니저관리, 계정목록, 문의글 관리, 검사결과 등의 메뉴 구성
- 시간 순서대로 정렬된 데이터 표시 방식

## 마이그레이션 요구사항
1. 데이터 구조 유지
   - 사용자 정보: 이름/ID(kimmingi09), 타임스탬프(2025-04-12 03:19:37) 형식 유지
   - 기관 정보: 기관명(장철도대학교 교수), ID(gwsu20250411) 형식 유지

2. UI/UX 현대화
   - 반응형 디자인 적용
   - 테이블 형식에서 카드 형태의 그리드 레이아웃으로 변경
   - 다크 모드 지원
   - 필터링 및 검색 기능 강화

3. 기능 개선
   - 실시간 업데이트 기능 추가
   - 데이터 시각화 차트 추가
   - 페이지네이션 개선
   - 각 항목별 상세 정보 확인 기능 추가

4. 권한 관리
   - 관리자/매니저/기업 관리자 등 역할 기반 권한 체계 구현
   - 각 역할별 접근 가능한 메뉴 및 기능 제한

## 마이그레이션 진행 상황

### 1. 기술 스택 업데이트
- [x] Next.js 15.3.0 프로젝트 생성
- [x] TypeScript 통합
- [x] Tailwind CSS 설정
- [x] 관련 패키지 설치 (React Hook Form, Zod, Headless UI, Chart.js, NextAuth.js, PostgreSQL)

### 2. 인증 시스템 구현
- [x] NextAuth.js 통합
- [x] PostgreSQL 연결 설정
- [x] 인증 오류 처리 개선
- [x] 권한 기반 인증 구현
- [x] 로그인 기록 데이터베이스 저장

### 3. 사용자 인터페이스
- [x] 반응형 레이아웃 구현
- [x] 로그인 페이지 구현
- [x] 대시보드 메인 페이지 구현
- [x] 네비게이션 바 구현
- [ ] 다크 모드 구현 (진행 중)

### 4. 데이터 관리
- [x] 데이터베이스 연결 설정
- [x] 사용자 권한 관리 구현


### 5. 데이터 시각화
- [x] Chart.js 통합
- [x] 기본 차트 구현
- [ ] 실시간 데이터 업데이트 구현 (진행 중)
- [ ] 고급 필터링 기능 구현 (계획됨)

## 주의사항
- PostgreSQL 데이터베이스 연결 시 올바른 호스트, 포트, 사용자 이름 및 비밀번호 설정 필요
- 환경 변수(.env.local)를 통한 민감한 정보 관리
- 관리자 계정 생성 시 강력한 비밀번호 설정 권장
- 데이터베이스에 CRYPT 함수 사용하여 비밀번호 암호화 적용됨



# Cursor AI 최적화 룰 파일 (Next.js 15.3.0)

## 프로젝트 위치
E:\work_test\aptit-front


## 개발 환경 설정
- Node.js 18.17.0 이상 필수 (Next.js 15.3.0 요구사항)
- TypeScript 5.1.6 이상 사용
- ESLint + Prettier 통합 설정
  ```
  # .eslintrc.json
  {
    "extends": [
      "next/core-web-vitals",
      "prettier"
    ],
    "rules": {
      "react/no-unescaped-entities": "off"
    }
  }
  ```
- husky + lint-staged 설정으로 커밋 전 코드 품질 검사 자동화

## Next.js 15.3.0 최적화 활용

### 주요 기능 활용
- Server Actions 적극 활용
- Turbopack으로 개발 서버 성능 향상 (`--turbo` 플래그 사용)
- Partial Prerendering (PPR) 활용
- 새로운 `use-router`, `use-search-params`, `use-scroll-position` 훅 활용
- Server-only 컴포넌트 최대한 활용

### App Router 최적화 활용
```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <main>
      <h1>Welcome</h1>
      <ClientComponent />
    </main>
  );
}

// (서버 컴포넌트에서는 데이터 불러오는 로직 배치)
async function getData() {
  const res = await fetch('https://api.example.com/data');
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}

// app/products/[id]/page.tsx (동적 라우트)
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <ProductDetails product={product} />;
}
```

### Server Actions 활용
```typescript
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function createUser(formData: FormData) {
  const validatedFields = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });
  
  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }
  
  // DB 저장 로직
  
  revalidatePath('/users');
  return { success: true };
}
```

### Partial Prerendering (PPR)
```typescript
// app/layout.tsx
export const runtime = 'experimental-edge';
export const preferredRegion = 'auto';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

## 코드 구조 및 아키텍처

### 디렉토리 구조
```
src/
├── app/                # Next.js App Router 페이지
│   ├── (auth)/         # 인증 관련 라우트 그룹
│   ├── (dashboard)/    # 대시보드 라우트 그룹
│   ├── api/            # API 라우트
│   └── layout.tsx      # 루트 레이아웃
├── components/         # 리액트 컴포넌트
│   ├── ui/             # 공통 UI 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   └── [feature]/      # 기능별 컴포넌트
├── lib/                # 유틸리티 함수
│   ├── actions/        # 서버 액션 모음
│   ├── db/             # 데이터베이스 연결/유틸리티
│   └── utils.ts        # 범용 유틸리티 함수
├── hooks/              # 클라이언트 훅
├── schemas/            # Zod 스키마 정의
├── types/              # TypeScript 타입 정의
└── styles/             # 글로벌 스타일
```

### 컴포넌트 구분
- 서버 컴포넌트: 복잡한 데이터 가져오기, DB 접근, 렌더링 최적화
- 클라이언트 컴포넌트: 인터랙션, 이벤트 핸들링, useState/useEffect
- 공유 컴포넌트: 각 기능별로 모아서 구성

## 개발 표준 및 패턴

### TypeScript 규칙
- `any` 타입 사용 금지
- 세부적인 타입 정의로 자동완성/타입 안전성 극대화
- 서버 컴포넌트와 클라이언트 컴포넌트 props 타입 분리

```typescript
// types/product.ts
export type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  images: string[];
};

// 서버 컴포넌트에서만 사용하는 타입
export type ProductWithInventory = Product & {
  inventory: {
    count: number;
    warehouses: string[];
  }
};

// props 타입 정의
export type ProductCardProps = {
  product: Product;
  variant?: 'default' | 'compact';
};
```

### 컴포넌트 패턴
```typescript
// components/ui/button.tsx
'use client'

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // 기본 스타일
          'inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none focus:ring-2',
          // 사이즈별 스타일
          size === 'sm' ? 'px-3 py-1.5 text-sm' : 
          size === 'lg' ? 'px-5 py-3 text-lg' : 'px-4 py-2 text-base',
          // 변형별 스타일
          variant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
          variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' :
          variant === 'outline' ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground' :
          'bg-ghost hover:bg-accent hover:text-accent-foreground',
          // 로딩 상태
          isLoading && 'cursor-wait opacity-70',
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2">
            <LoadingSpinner className="h-4 w-4" />
          </span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
```

## 상태 관리 및 데이터 가져오기

### 서버 상태 관리
- 최대한 서버 컴포넌트에서 데이터 로딩
- React Server Components 활용하여 클라이언트 번들 크기 최소화
- React Query(TanStack Query) 사용 (클라이언트 상태 관리가 필요한 경우)

```typescript
// app/products/page.tsx
export default async function ProductsPage({
  searchParams
}: {
  searchParams: { q?: string; category?: string }
}) {
  // 클라이언트가 아닌 서버에서 데이터 불러오기
  const products = await getProducts({
    query: searchParams.q,
    category: searchParams.category
  });
  
  return (
    <main>
      <h1>Products</h1>
      <ProductFilter />
      <ProductList products={products} />
    </main>
  );
}
```

### 클라이언트 상태 관리
- 로컬 UI 상태: `useState`, `useReducer`
- 폼 상태: React Hook Form + Zod
- 전역 상태: Zustand 또는 Context API
- 상태관리 라이브러리 최소화 (서버 컴포넌트 활용으로 대체)

### 데이터 캐싱 및 재검증
```typescript
// app/dashboard/page.tsx
export const revalidate = 60; // 60초마다 재검증

// lib/actions/products.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache';

export async function createProduct(data) {
  // DB 저장 로직
  
  // 특정 경로 재검증
  revalidatePath('/products');
  
  // 태그 기반 재검증
  revalidateTag('products');
}
```

## 폼 처리 및 유효성 검사

### Server Actions과 React Hook Form 통합
```typescript
// components/forms/product-form.tsx
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProduct } from '@/lib/actions/products';
import { productSchema, type ProductFormValues } from '@/schemas/product';
import { useFormState } from 'react-dom';

export function ProductForm() {
  const [state, formAction] = useFormState(createProduct, { message: '' });
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      description: '',
    },
  });
  
  return (
    <form action={formAction}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required />
      </div>
      
      <div>
        <label htmlFor="price">Price</label>
        <input id="price" name="price" type="number" step="0.01" required />
      </div>
      
      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" />
      </div>
      
      {state.message && <p className="text-red-500">{state.message}</p>}
      
      <button type="submit">Create Product</button>
    </form>
  );
}
```

### 스키마 정의
```typescript
// schemas/product.ts
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, '제품명은 2자 이상이어야 합니다'),
  price: z.number().min(0, '가격은 0 이상이어야 합니다'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
```

## 스타일링

### Tailwind CSS 최적화
- Tailwind v3.4 이상 사용 권장
- JIT 모드로 최적화된 CSS 번들 생성
- 여러 변형이 있는 컴포넌트는 `cva` 패턴 사용

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 다크 모드 지원
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

// components/theme-toggle.tsx
'use client'

import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}
```

## API 및 데이터베이스 연결

### API 통합
- 서버 컴포넌트에서는 직접 fetch 사용
- 클라이언트 컴포넌트에서는 React Query 사용
- TypeScript와 Zod를 사용한 타입 안전한 API 호출

```typescript
// lib/db/index.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// app/api/products/route.ts
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { productSchema } from '@/schemas/product';

export async function GET(request: Request) {
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    const validatedData = productSchema.parse(body);
    const product = await prisma.product.create({
      data: validatedData
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

## 성능 최적화

### 이미지 최적화
```typescript
// components/ui/optimized-image.tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';

type OptimizedImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  ...props
}: OptimizedImageProps) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={width || 800}
        height={height || 600}
        className="object-cover"
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
}
```

### 로딩 최적화
- Next.js 15의 Streaming SSR 활용
- `loading.tsx` 파일로 로딩 상태 표시
- 부분적인 스켈레톤 UI 구현

```typescript
// app/products/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="h-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 번들 최적화
- 다이나믹 임포트 활용
- 중요하지 않은 컴포넌트 지연 로딩

```typescript
// app/page.tsx
import dynamic from 'next/dynamic';

// 지연 로딩 컴포넌트
const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false // 클라이언트 사이드에서만 렌더링
});

export default function Home() {
  return (
    <main>
      <h1>Dashboard</h1>
      <HeavyChart />
    </main>
  );
}
```

## 테스트 및 품질 관리

### 테스트 설정
- Jest + React Testing Library
- 컴포넌트 단위 테스트
- 서버 액션 테스트
- Playwright로 E2E 테스트

```typescript
// components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders with default styles', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 접근성
- ESLint 접근성 규칙 설정
- 컴포넌트에 적절한 ARIA 속성 추가
- Headless UI 활용하여 접근성 자동 관리

## 배포 및 운영

### 배포 최적화
- Vercel 또는 Cloudflare Pages에 배포
- 정적 생성과 서버 렌더링의 적절한 조합
- 국제화(i18n) 지원

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 경로에서 로케일 정보 추출
  const locale = request.nextUrl.locale || 'ko';
  
  // 로케일에 따른 처리
  // ...
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 모니터링 및 분석
- Vercel Analytics 설정
- Next.js 15의 메트릭 수집 활용
- Sentry를 통한 에러 모니터링

## 협업 및 개발 효율성

### 컴포넌트 문서화
- Storybook 설정
- MDX 파일로 컴포넌트 사용법 문서화

### Git 컨벤션
```
# 커밋 메시지 형식
feat: 상품 검색 기능 추가
fix: 장바구니 아이템 삭제 오류 수정
chore: 패키지 업데이트
docs: README 업데이트
```

### 코드 리뷰 프로세스
- PR 템플릿 사용
- 자동화된 CI 검사
- 코드 소유자 지정

## 확장성 및 보안

### 확장 가능한 아키텍처
- 마이크로 프론트엔드 고려
- 모듈식 기능 구조
- 최소한의 의존성

### 보안 강화
- Next.js의 헤더 최적화
- CSP(Content Security Policy) 설정
- CSRF 보호


## 파일 및 컴포넌트 길이 규칙
- 파일 길이는 최대 900줄, 권장 600줄 이하
- 컴포넌트는 150줄 이하 권장
- 200줄 이상일 경우 반드시 분리
- 반복적인 컴포넌트 사용 시 @components/ 폴더에 별도 분리