import localFont from 'next/font/local'

// 나눔스퀘어 네오 가변 폰트 (권장)
export const nanumSquareNeo = localFont({
  src: [
    {
      path: '../app/fonts/NanumSquareNeoTTF-aLt.woff2',
      weight: '100 200',
      style: 'normal',
    },
    {
      path: '../app/fonts/NanumSquareNeoTTF-bRg.woff2',
      weight: '300 400',
      style: 'normal',
    },
    {
      path: '../app/fonts/NanumSquareNeoTTF-cBd.woff2',
      weight: '500 600',
      style: 'normal',
    },
    {
      path: '../app/fonts/NanumSquareNeoTTF-dEb.woff2',
      weight: '700 800',
      style: 'normal',
    },
    {
      path: '../app/fonts/NanumSquareNeoTTF-eHv.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-nanum-square-neo',
  display: 'swap',
  preload: true,
  fallback: ['Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
})

// 가변 폰트 버전 (파일 크기 최적화)
export const nanumSquareNeoVariable = localFont({
  src: '../app/fonts/NanumSquareNeo-Variable.woff2',
  variable: '--font-nanum-square-neo-variable',
  display: 'swap',
  preload: true,
  fallback: ['Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
})

// 폰트 클래스명 상수
export const FONT_CLASSES = {
  nanum: nanumSquareNeo.className,
  nanumVariable: nanumSquareNeoVariable.className,
  nanumVar: nanumSquareNeo.variable,
  nanumVariableVar: nanumSquareNeoVariable.variable,
} as const

// 폰트 패밀리 CSS 변수
export const FONT_VARIABLES = {
  nanum: nanumSquareNeo.variable,
  nanumVariable: nanumSquareNeoVariable.variable,
} as const 