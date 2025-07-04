"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
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

interface UserInfo {
  pe_name: string;
  pe_sex: string;
  pe_email: string;
  pe_cellphone: string;
  pe_birth_year: number;
  pe_birth_month: number;
  pe_birth_day: number;
}

interface DashboardData {
  accountStatus: AccountStatus;
  tests: Test[];
  completedTests: number;
  userInfo: UserInfo;
  isOrganization: boolean;
}

export default function PersonalDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 인증 상태 확인
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching personal dashboard data...');
      
      const response = await fetch('/api/dashboard/personal');
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.error || '데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      console.log('Personal dashboard data received:', data);
      
      // 일반 회원 확인
      if (data.isOrganization) {
        // 기관 회원인 경우 기관 대시보드로 리다이렉트
        router.push('/dashboard/organization');
        return;
      }
      
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 결제 페이지로 이동
  const handlePayment = () => {
    router.push('/payment');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 relative z-10 hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg animate-pulse">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터 로딩 중</h2>
            <p className="text-gray-600">개인 대시보드를 준비하고 있습니다...</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4 relative overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="w-full max-w-3xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 relative z-10 hover:shadow-2xl transition-all duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full mb-4 shadow-lg animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-2">오류 발생</h1>
            <p className="text-gray-700 text-lg">{error}</p>
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

  const { accountStatus, tests, completedTests, userInfo } = dashboardData;
  
  // 계정 상태에 따른 표시 정보
  const isPaid = accountStatus.cr_pay === 'Y';
  const isExpired = accountStatus.expire === 'N';
  const expireDate = tests.length > 0 ? tests[0].expiredate : '만료일 없음';

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      {/* 상단 헤더 */}
      <Header />
      
      <main className="flex-grow p-4 relative z-10">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* 환영 메시지 및 헤더 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {userInfo?.pe_name || session?.user?.name || '사용자'}님, 환영합니다!
                    </h1>
                    <p className="text-gray-600 mt-1">개인 회원 대시보드에서 검사 결과와 계정 정보를 확인할 수 있습니다.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handlePayment}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                결제하기
              </button>
            </div>
          </div>

          {/* 내 정보 카드 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in-delay-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              내 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-700">계정 상태</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl font-bold text-blue-900">{isPaid ? '결제 완료' : '미결제'}</p>
              </div>
              
              <div className={`bg-gradient-to-br ${isPaid ? 'from-green-50/80 to-green-100/80 border-green-200/50' : 'from-red-50/80 to-red-100/80 border-red-200/50'} backdrop-blur-sm border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 group`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-sm font-medium ${isPaid ? 'text-green-700' : 'text-red-700'}`}>결제 상태</h3>
                  <div className={`w-10 h-10 bg-gradient-to-br ${isPaid ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-xl font-bold ${isPaid ? 'text-green-900' : 'text-red-900'}`}>
                  {isPaid ? '결제됨' : '미결제'}
                </p>
              </div>
              
              <div className={`bg-gradient-to-br ${isExpired ? 'from-red-50/80 to-red-100/80 border-red-200/50' : 'from-green-50/80 to-green-100/80 border-green-200/50'} backdrop-blur-sm border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 group`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-sm font-medium ${isExpired ? 'text-red-700' : 'text-green-700'}`}>만료일</h3>
                  <div className={`w-10 h-10 bg-gradient-to-br ${isExpired ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-lg font-bold ${isExpired ? 'text-red-900' : 'text-green-900'}`}>
                  {expireDate}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm border border-purple-200/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-purple-700">완료된 검사</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl font-bold text-purple-900">{completedTests}개</p>
              </div>
            </div>
          </div>

          {/* 내 검사 목록 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in-delay-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              내 검사 목록
            </h2>
            
            {tests.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">검사 내역이 없습니다</h3>
                <p className="text-gray-500 text-lg mb-4">새로운 검사를 시작해보세요!</p>
                <button
                  onClick={handlePayment}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  새 검사 시작하기
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50/90 to-gray-100/90 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">번호</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">검사명</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">시작일</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">종료일</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">유효일자</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">결과</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-gray-200/50">
                      {tests.map((test, index) => (
                        <tr key={test.cr_seq} className={`${index % 2 === 0 ? 'bg-white/60' : 'bg-gray-50/60'} hover:bg-blue-50/60 transition-all duration-200 hover:shadow-sm`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{test.num}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{test.pd_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.startdate || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.enddate || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.expiredate || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {test.done === 'R' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm">
                                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2 animate-pulse"></div>
                                준비됨
                              </span>
                            ) : test.done === 'I' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 shadow-sm">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                                진행중
                              </span>
                            ) : test.done === 'E' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-800 shadow-sm">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                                완료
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 shadow-sm">
                                <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                                상태없음
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {test.done === 'R' ? (
                              <button
                                onClick={() => router.push(`/test/${test.cr_seq}`)}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                검사 시작
                              </button>
                            ) : test.done === 'I' ? (
                              <button
                                onClick={() => router.push(`/test/${test.cr_seq}/start`)}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xs font-bold rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                계속하기
                              </button>
                            ) : test.done === 'E' && (test.rview === 'Y' || test.rview === 'P') ? (
                              <button
                                onClick={() => router.push(`/test-result/${test.cr_seq}`)}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                결과보기
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs font-medium">결과 없음</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* 하단 푸터 */}
      <Footer />
      
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
      `}</style>
    </div>
  );
} 