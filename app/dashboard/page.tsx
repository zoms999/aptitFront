"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Header 및 Footer 컴포넌트 추가
//import Header from '../components/Header';
import Footer from '../components/Footer';
import Header from "@/components/Header";

interface AccountStatus {
  cr_pay: string;
  pd_kind: string;
  expire: string;
  state: string;
}

interface Test {
  num: number;
  cr_seq: number;
  cr_pay: string;
  pd_name: string;
  anp_seq: number;
  startdate: string;
  enddate: string;
  done: string;
  rview: string;
  expiredate: string;
}

interface DashboardData {
  accountStatus: AccountStatus;
  tests: Test[];
  completedTests: number;
  isOrganization?: boolean;
  instituteInfo?: Record<string, unknown>;
  members?: Array<Record<string, unknown>>;
  userInfo?: Record<string, unknown>;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // 인증 상태 확인
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      fetchDashboardData();
    }
  }, [status, router, session]);

  // API 오류 발생 시 세션 검증 및 로그아웃 처리 함수 추가
  useEffect(() => {
    if (errorDetails) {
      console.log('API 오류 발생:', errorDetails);
      
      // 계정 정보를 찾을 수 없는 경우
      if (errorDetails.error === "계정 정보를 찾을 수 없습니다.") {
        console.log('계정 정보를 찾을 수 없어 메인 페이지로 이동');
        router.push('/?redirected=true&reason=account_not_found');
        return;
      }
      
      // 기타 세션 만료 관련 오류의 경우
      if (errorDetails.requireLogin || errorDetails.forceLogout) {
        console.log('세션 만료로 로그아웃 처리');
        router.push('/login?expired=true');
      }
    }
  }, [errorDetails, router]);

  const fetchDashboardData = async () => {
    try {
      // 세션 상태 추가 검증
      if (!session?.user || !('id' in session.user)) {
        console.log('세션 정보가 불완전하여 메인 페이지로 이동');
        router.push('/?redirected=true&reason=incomplete_session');
        return;
      }
      
      setLoading(true);
      console.log('Fetching dashboard data...');
      console.log('Session info:', session);
      
      const response = await fetch('/api/dashboard');
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        setErrorDetails(errorData);
        throw new Error(errorData.error || '데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      console.log('Dashboard data received:', data);
      setDashboardData(data);
      
      // 회원 유형에 따라 적절한 대시보드 페이지로 리다이렉트
      if (data.isOrganization !== undefined) {
        if (data.isOrganization) {
          // 기관 회원인 경우
          router.push('/dashboard/organization');
          return;
        } else {
          // 일반 회원인 경우
          router.push('/dashboard/personal');
          return;
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-12 relative z-10 hover:shadow-3xl transition-all duration-300 max-w-md mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg animate-pulse">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">대시보드 로딩 중</h2>
            <p className="text-gray-600 text-lg mb-6">사용자 정보를 확인하고 있습니다...</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 p-4 relative overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-10 relative z-10 hover:shadow-3xl transition-all duration-300">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 shadow-lg animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-red-600 mb-4">오류 발생</h1>
            <p className="text-gray-700 text-xl">{error}</p>
          </div>
          
          {errorDetails && (
            <div className="mb-8 p-8 bg-gray-50/90 backdrop-blur-sm rounded-2xl border border-gray-200 hover:bg-gray-50/95 transition-all duration-300">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                오류 상세 정보
              </h2>
              <pre className="text-sm overflow-auto bg-white/90 p-6 rounded-xl border text-gray-700 backdrop-blur-sm font-mono max-h-64">{JSON.stringify(errorDetails, null, 2)}</pre>
            </div>
          )}
          
          <div className="mb-8 p-8 bg-blue-50/90 backdrop-blur-sm rounded-2xl border border-blue-200 hover:bg-blue-50/95 transition-all duration-300">
            <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              세션 정보
            </h2>
            <pre className="text-sm overflow-auto bg-white/90 p-6 rounded-xl border text-gray-700 backdrop-blur-sm font-mono max-h-64">{JSON.stringify(session, null, 2)}</pre>
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={fetchDashboardData}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  // 기본 대시보드 페이지에 표시할 내용 (리다이렉트되지 않은 경우)
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="flex-grow p-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">대시보드 리다이렉트 중...</h1>
            <p className="text-lg text-gray-600 mb-8">잠시만 기다려주세요. 적절한 대시보드로 이동합니다.</p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center px-4 py-2 bg-blue-100 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-blue-700">회원 유형 확인 중</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-indigo-100 rounded-full">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                <span className="text-indigo-700">데이터 로딩 중</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 