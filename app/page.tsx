"use client";

import LoginForm from "@/components/LoginForm";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 주요 특징을 보여주는 FeatureItem 컴포넌트 (가독성을 위해 분리)
interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, gradient }) => (
  <div className="flex items-start text-left">
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mr-5 shadow-lg`}>
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <p className="mt-1 text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 리다이렉션 로직은 기존의 안정적인 코드를 그대로 유지합니다.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirected = urlParams.get('redirected');
    const reason = urlParams.get('reason');
    
    if (redirected === 'true') {
      console.log("이미 리다이렉트되었으므로 추가 리다이렉트 중단", { reason });
      if (status === "authenticated" && reason) {
        if (reason === 'incomplete_session' || reason === 'account_not_found') {
          console.log("세션 또는 계정 문제가 감지되어 로그아웃 처리가 필요합니다");
        }
      }
      return;
    }
    
    if (status === "authenticated" && session?.user && 'id' in session.user) {
      console.log("인증된 사용자 - 대시보드로 리다이렉트", session);
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // 로딩 상태 UI (기존 코드 유지, 디자인 일관성을 위해 약간의 수정)
  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-600">로딩 중...</p>
          </div>
        </main>
      </div>
    );
  }

  // --- UI/UX가 개선된 메인 페이지 ---
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden font-nanum-variable">
      {/* 배경 장식 요소: 더 은은하고 부드럽게 개선 */}
      <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-gradient-to-br from-blue-200 to-transparent rounded-full blur-3xl opacity-50 animate-float"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-gradient-to-tl from-purple-200 to-transparent rounded-full blur-3xl opacity-50 animate-float-delay"></div>
      
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 
          [UI/UX 개선] 2단 그리드 레이아웃 적용
          - 넓은 화면에서는 왼쪽(정보)과 오른쪽(로그인)으로 나뉩니다.
          - 작은 화면(lg 미만)에서는 자동으로 수직으로 쌓입니다.
        */}
        <div className="grid lg:grid-cols-2 gap-x-16 items-center min-h-[calc(100vh-150px)] py-10">
          
          {/* --- 왼쪽: 정보 및 브랜딩 영역 --- */}
          <div className="animate-fade-in-left pt-10 lg:pt-0">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-5">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                APTIT
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-xl leading-relaxed font-medium">
              AI 기반 종합 적성 검사 시스템으로<br />
              <span className="text-indigo-600 font-semibold">당신의 성향, 사고력, 선호도</span>를 정확하게 분석하세요.
            </p>

            {/* 주요 특징 섹션: 로그인 폼 옆으로 이동하여 서비스의 가치를 강조 */}
            <div className="space-y-8">
              <FeatureItem 
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="정확한 분석"
                description="과학적 방법론과 AI 기술로 신뢰할 수 있는 결과를 제공합니다."
              />
              <FeatureItem 
                gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                title="빠른 결과"
                description="실시간 분석 엔진으로 검사 완료 즉시 상세한 결과를 확인하세요."
              />
              <FeatureItem 
                gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                title="안전한 보관"
                description="최고 수준의 보안으로 데이터를 안전하게 관리합니다."
              />
            </div>
          </div>
          
          {/* --- 오른쪽: 로그인 영역 --- */}
          <div className="flex items-center justify-center animate-fade-in-right mt-16 lg:mt-0">
            {/* 
              [사용자 요청] 로그인 창을 더 넓게 변경
              - max-w-md -> max-w-lg 로 변경하여 가로 폭 확대
            */}
            <div className="w-full max-w-lg bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 md:p-12 transition-all duration-300 hover:shadow-3xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">시작하기</h2>
                <p className="text-gray-500 mt-2">APTIT에 오신 것을 환영합니다.</p>
              </div>
              <LoginForm />
            </div>
          </div>
          
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 border-t pt-6">
          <p>© 2025 한국진로적성센터. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-indigo-600 transition-colors">이용약관</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">고객센터</a>
          </div>
        </div>
      </footer>
      
      {/* 애니메이션을 위한 CSS */}
      <style jsx>{`
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-left {
          animation: fade-in-left 0.7s ease-out forwards;
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.7s ease-out 0.2s forwards;
          opacity: 0; /* 애니메이션 시작 전 숨김 */
        }
        
        @keyframes float {
          0% { transform: translate(-33%, -33%) rotate(0deg); }
          50% { transform: translate(-30%, -36%) rotate(180deg); }
          100% { transform: translate(-33%, -33%) rotate(360deg); }
        }
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }

        @keyframes float-delay {
          0% { transform: translate(33%, 33%) rotate(0deg); }
          50% { transform: translate(36%, 30%) rotate(-180deg); }
          100% { transform: translate(33%, 33%) rotate(-360deg); }
        }
        .animate-float-delay {
          animation: float-delay 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}