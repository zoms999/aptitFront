// 타입 확장을 위한 선언 파일
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      type: string;
      // 개인 사용자 추가 필드
      sex?: string;
      isPaid?: boolean;
      productType?: string;
      isExpired?: boolean;
      state?: string;
      // 기관 사용자 추가 필드
      sessionCode?: string;
    };
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    type: string;
    // 개인 사용자 추가 필드
    sex?: string;
    isPaid?: boolean;
    productType?: string;
    isExpired?: boolean;
    state?: string;
    // 기관 사용자 추가 필드
    sessionCode?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    type: string;
    // 개인 사용자 추가 필드
    sex?: string;
    isPaid?: boolean;
    productType?: string;
    isExpired?: boolean;
    state?: string;
    // 기관 사용자 추가 필드
    sessionCode?: string;
  }
} 