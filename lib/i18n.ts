// 다국어 지원 유틸리티 함수

export type SupportedLanguage = 'ko-KR' | 'en-US' | 'ja-JP' | 'zh-CN';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ko-KR';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  'ko-KR': '한국어',
  'en-US': 'English',
  'ja-JP': '日本語',
  'zh-CN': '中文'
};

/**
 * 브라우저 언어 설정을 기반으로 지원되는 언어를 반환
 */
export function detectLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const browserLang = navigator.language;
  
  // 정확한 매치 확인
  if (Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)) {
    return browserLang as SupportedLanguage;
  }
  
  // 언어 코드만으로 매치 확인 (예: 'ko' -> 'ko-KR')
  const langCode = browserLang.split('-')[0];
  const matchedLang = Object.keys(SUPPORTED_LANGUAGES).find(lang => 
    lang.startsWith(langCode)
  );
  
  return (matchedLang as SupportedLanguage) || DEFAULT_LANGUAGE;
}

/**
 * 현재 언어 설정 가져오기 (로컬 스토리지 우선)
 */
export function getCurrentLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const savedLang = localStorage.getItem('language');
  if (savedLang && Object.keys(SUPPORTED_LANGUAGES).includes(savedLang)) {
    return savedLang as SupportedLanguage;
  }

  return detectLanguage();
}

/**
 * 언어 설정 저장
 */
export function setLanguage(language: SupportedLanguage): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('language', language);
  
  // 페이지 새로고침 없이 언어 변경을 반영하기 위한 이벤트 발생
  window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
}

/**
 * 언어별 텍스트 객체에서 현재 언어의 텍스트 반환
 */
export function getLocalizedText(
  textMap: Partial<Record<SupportedLanguage, string>>,
  fallbackLanguage: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  const currentLang = getCurrentLanguage();
  
  return textMap[currentLang] || 
         textMap[fallbackLanguage] || 
         Object.values(textMap)[0] || 
         '';
}

/**
 * API 호출 시 사용할 언어 헤더 생성
 */
export function getLanguageHeaders(): Record<string, string> {
  return {
    'Accept-Language': getCurrentLanguage()
  };
} 