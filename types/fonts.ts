// 나눔스퀘어 네오 폰트 가중치 타입
export type NanumSquareNeoWeight = 
  | '100' // Thin
  | '200' // ExtraLight
  | '300' // Light
  | '400' // Regular
  | '500' // Medium
  | '600' // SemiBold
  | '700' // Bold
  | '800' // ExtraBold
  | '900' // Heavy

// Tailwind 폰트 가중치 클래스 타입
export type TailwindFontWeight = 
  | 'font-thin'
  | 'font-extralight'
  | 'font-light'
  | 'font-normal'
  | 'font-medium'
  | 'font-semibold'
  | 'font-bold'
  | 'font-extrabold'
  | 'font-black'

// 폰트 패밀리 타입
export type FontFamily = 
  | 'font-sans'
  | 'font-nanum'
  | 'font-nanum-variable'

// 폰트 크기 타입
export type FontSize = 
  | 'text-xs'
  | 'text-sm'
  | 'text-base'
  | 'text-lg'
  | 'text-xl'
  | 'text-2xl'
  | 'text-3xl'
  | 'text-4xl'
  | 'text-5xl'
  | 'text-6xl'

// 폰트 설정 인터페이스
export interface FontConfig {
  family: FontFamily
  weight: TailwindFontWeight
  size: FontSize
}

// UI 요소별 폰트 설정 타입
export interface UIFontSettings {
  heading: {
    h1: FontConfig
    h2: FontConfig
    h3: FontConfig
    h4: FontConfig
    h5: FontConfig
    h6: FontConfig
  }
  body: FontConfig
  caption: FontConfig
  button: FontConfig
  label: FontConfig
} 