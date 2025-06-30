import { FontConfig, TailwindFontWeight, FontSize, FontFamily } from '../types/fonts'

// 기본 폰트 설정
export const DEFAULT_FONT_SETTINGS = {
  heading: {
    h1: { family: 'font-sans' as FontFamily, weight: 'font-bold' as TailwindFontWeight, size: 'text-3xl' as FontSize },
    h2: { family: 'font-sans' as FontFamily, weight: 'font-bold' as TailwindFontWeight, size: 'text-2xl' as FontSize },
    h3: { family: 'font-sans' as FontFamily, weight: 'font-semibold' as TailwindFontWeight, size: 'text-xl' as FontSize },
    h4: { family: 'font-sans' as FontFamily, weight: 'font-semibold' as TailwindFontWeight, size: 'text-lg' as FontSize },
    h5: { family: 'font-sans' as FontFamily, weight: 'font-medium' as TailwindFontWeight, size: 'text-base' as FontSize },
    h6: { family: 'font-sans' as FontFamily, weight: 'font-medium' as TailwindFontWeight, size: 'text-sm' as FontSize },
  },
  body: { family: 'font-sans' as FontFamily, weight: 'font-normal' as TailwindFontWeight, size: 'text-base' as FontSize },
  caption: { family: 'font-sans' as FontFamily, weight: 'font-normal' as TailwindFontWeight, size: 'text-xs' as FontSize },
  button: { family: 'font-sans' as FontFamily, weight: 'font-medium' as TailwindFontWeight, size: 'text-sm' as FontSize },
  label: { family: 'font-sans' as FontFamily, weight: 'font-normal' as TailwindFontWeight, size: 'text-sm' as FontSize },
}

/**
 * 폰트 설정을 CSS 클래스 문자열로 변환
 */
export function fontConfigToClasses(config: FontConfig): string {
  return `${config.family} ${config.weight} ${config.size}`
}

/**
 * 여러 폰트 클래스를 결합
 */
export function combineFontClasses(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 제목 레벨에 따른 폰트 클래스 반환
 */
export function getHeadingClasses(level: 1 | 2 | 3 | 4 | 5 | 6): string {
  const headingKey = `h${level}` as keyof typeof DEFAULT_FONT_SETTINGS.heading
  return fontConfigToClasses(DEFAULT_FONT_SETTINGS.heading[headingKey])
}

/**
 * 본문 텍스트 폰트 클래스 반환
 */
export function getBodyClasses(): string {
  return fontConfigToClasses(DEFAULT_FONT_SETTINGS.body)
}

/**
 * 버튼 텍스트 폰트 클래스 반환
 */
export function getButtonClasses(): string {
  return fontConfigToClasses(DEFAULT_FONT_SETTINGS.button)
}

/**
 * 캡션 텍스트 폰트 클래스 반환
 */
export function getCaptionClasses(): string {
  return fontConfigToClasses(DEFAULT_FONT_SETTINGS.caption)
}

/**
 * 라벨 텍스트 폰트 클래스 반환
 */
export function getLabelClasses(): string {
  return fontConfigToClasses(DEFAULT_FONT_SETTINGS.label)
}

/**
 * 커스텀 폰트 클래스 생성
 */
export function createFontClasses(
  family: FontFamily = 'font-sans',
  weight: TailwindFontWeight = 'font-normal',
  size: FontSize = 'text-base'
): string {
  return fontConfigToClasses({ family, weight, size })
}

// 자주 사용되는 폰트 조합들
export const COMMON_FONT_CLASSES = {
  // 제목
  mainTitle: getHeadingClasses(1),
  subTitle: getHeadingClasses(2),
  sectionTitle: getHeadingClasses(3),
  
  // 본문
  bodyText: getBodyClasses(),
  smallText: createFontClasses('font-sans', 'font-normal', 'text-sm'),
  caption: getCaptionClasses(),
  
  // 인터페이스
  buttonPrimary: createFontClasses('font-sans', 'font-semibold', 'text-sm'),
  buttonSecondary: createFontClasses('font-sans', 'font-medium', 'text-sm'),
  label: getLabelClasses(),
  input: createFontClasses('font-sans', 'font-normal', 'text-base'),
  
  // 강조
  emphasis: createFontClasses('font-sans', 'font-medium', 'text-base'),
  strong: createFontClasses('font-sans', 'font-semibold', 'text-base'),
} as const 