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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-500">오류 발생</h1>
          <p className="text-gray-700">{error}</p>
          
          {errorDetails && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h2 className="text-lg font-semibold mb-2">오류 상세 정보:</h2>
              <pre className="text-sm overflow-auto">{JSON.stringify(errorDetails, null, 2)}</pre>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h2 className="text-lg font-semibold mb-2">세션 정보:</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(session, null, 2)}</pre>
          </div>
          
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  // 기본 대시보드 페이지에 표시할 내용 (리다이렉트되지 않은 경우)
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 bg-gray-50">
        <div className="w-full max-w-4xl mx-auto">
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h1 className="mb-4 text-2xl font-bold text-gray-800">대시보드 리다이렉트 중...</h1>
            <p className="text-gray-600">잠시만 기다려주세요. 적절한 대시보드로 이동합니다.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 