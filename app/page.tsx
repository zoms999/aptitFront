"use client";

import LoginForm from "@/components/LoginForm";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // URL에 redirected=true 파라미터가 있으면 리다이렉트 중단
    const urlParams = new URLSearchParams(window.location.search);
    const redirected = urlParams.get('redirected');
    const reason = urlParams.get('reason');
    
    if (redirected === 'true') {
      console.log("이미 리다이렉트되었으므로 추가 리다이렉트 중단", { reason });
      
      // 계정 정보 문제가 있는 경우 세션 상태를 확인하고 필요시 로그인 페이지로 이동
      if (status === "authenticated" && reason) {
        if (reason === 'incomplete_session' || reason === 'account_not_found') {
          console.log("세션 또는 계정 문제가 감지되어 로그아웃 처리가 필요합니다");
          // 여기서는 자동 로그아웃을 하지 않고 사용자가 로그인 화면에서 처리하도록 함
        }
      }
      return;
    }
    
    // 세션에 문제가 없는 인증된 사용자만 대시보드로 리다이렉트
    if (status === "authenticated" && session?.user && 'id' in session.user) {
      console.log("인증된 사용자 - 대시보드로 리다이렉트", session);
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // 로딩 중이거나 인증되지 않은 경우에만 로그인 화면 표시
  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 animate-pulse">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-lg text-gray-600 animate-pulse">로딩 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                  APTIT
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-delay-1 font-medium">
                AI 기반 종합 적성 검사 시스템으로<br />
                <span className="text-indigo-600 font-semibold">당신의 성향, 사고력, 선호도</span>를 정확하게 분석하세요
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 animate-fade-in-delay-2 mb-8">
              <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 animate-pulse group-hover:animate-none"></div>
                <span className="font-semibold text-blue-700">성향 진단</span>
              </div>
              <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full mr-3 animate-pulse group-hover:animate-none"></div>
                <span className="font-semibold text-indigo-700">사고력 진단</span>
              </div>
              <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-3 animate-pulse group-hover:animate-none"></div>
                <span className="font-semibold text-purple-700">선호도 진단</span>
              </div>
            </div>

            {/* 통계 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in-delay-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">10,000+</div>
                <div className="text-gray-600 font-medium">누적 검사 완료</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
                <div className="text-gray-600 font-medium">검사 정확도</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-gray-600 font-medium">언제든지 이용 가능</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-10 hover:shadow-3xl transition-all duration-300 animate-fade-in-delay-4 hover:scale-105">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <LoginForm />
          </div>

          {/* Features */}
          <div className="mt-16 space-y-6 animate-fade-in-delay-5">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">정확한 분석</h3>
                  <p className="text-gray-600 leading-relaxed">과학적 방법론과 AI 기술을 기반으로 한 정밀한 종합 검사로 신뢰할 수 있는 결과를 제공합니다.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">빠른 결과</h3>
                  <p className="text-gray-600 leading-relaxed">실시간 분석 엔진으로 검사 완료 즉시 상세한 결과를 확인할 수 있습니다.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="flex items-start">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">안전한 보관</h3>
                  <p className="text-gray-600 leading-relaxed">개인정보 보호법을 준수하며 최고 수준의 보안으로 데이터를 안전하게 관리합니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <div className="mb-4 md:mb-0">
              <span>© 2025 한국진로적성센터. All rights reserved.</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-blue-600 transition-colors duration-200 hover:scale-105 transform">이용약관</a>
              <a href="#" className="hover:text-blue-600 transition-colors duration-200 hover:scale-105 transform">개인정보처리방침</a>
              <a href="#" className="hover:text-blue-600 transition-colors duration-200 hover:scale-105 transform">고객센터</a>
            </div>
          </div>
        </div>
      </footer>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay-1 {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }
        
        .animate-fade-in-delay-3 {
          animation: fade-in 0.6s ease-out 0.6s both;
        }
        
        .animate-fade-in-delay-4 {
          animation: fade-in 0.6s ease-out 0.8s both;
        }
        
        .animate-fade-in-delay-5 {
          animation: fade-in 0.6s ease-out 1s both;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 