"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from "@/components/Header";
import Footer from "../../components/Footer";

interface TestResult {
  cr_seq: number;
  pd_name: string;
  pe_name: string;
  startdate: string;
  enddate: string;
  done: string;
  // 추가 결과 데이터는 필요에 따라 확장
}

export default function TestResultPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const cr_seq = params.cr_seq as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && cr_seq) {
      fetchTestResult();
    }
  }, [status, cr_seq, router]);

  const fetchTestResult = async () => {
    try {
      setLoading(true);
      
      // 임시 데이터 (실제로는 API에서 가져와야 함)
      const mockResult: TestResult = {
        cr_seq: parseInt(cr_seq),
        pd_name: "기본 검사",
        pe_name: "테스트 사용자",
        startdate: "2024-01-01 10:00:00",
        enddate: "2024-01-01 11:30:00",
        done: "E"
      };
      
      setTestResult(mockResult);
    } catch (err) {
      console.error('Test result fetch error:', err);
      setError(err instanceof Error ? err.message : '결과를 가져오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg animate-pulse">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">결과 로딩 중</h2>
            <p className="text-gray-600">검사 결과를 불러오고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">오류 발생</h1>
              <p className="text-gray-700 mb-6">{error}</p>
              <button 
                onClick={() => router.back()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                돌아가기
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!testResult) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="flex-grow p-4 relative">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  검사 결과
                </h1>
                <p className="text-gray-600 mt-2">검사 ID: {cr_seq}</p>
              </div>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                돌아가기
              </button>
            </div>
          </div>

          {/* 검사 정보 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              검사 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-blue-700 mb-2">검사명</h3>
                <p className="text-xl font-bold text-blue-900">{testResult.pd_name}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50/80 to-green-100/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-green-700 mb-2">응시자</h3>
                <p className="text-xl font-bold text-green-900">{testResult.pe_name}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm border border-purple-200/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-purple-700 mb-2">상태</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-800 shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                  완료
                </span>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50/80 to-orange-100/80 backdrop-blur-sm border border-orange-200/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-orange-700 mb-2">시작 시간</h3>
                <p className="text-lg font-bold text-orange-900">{testResult.startdate}</p>
              </div>
              
              <div className="bg-gradient-to-br from-teal-50/80 to-teal-100/80 backdrop-blur-sm border border-teal-200/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-teal-700 mb-2">완료 시간</h3>
                <p className="text-lg font-bold text-teal-900">{testResult.enddate}</p>
              </div>
            </div>
          </div>

          {/* 결과 상세 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              검사 결과 상세
            </h2>
            
            <div className="text-center py-16 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">상세 결과 준비 중</h3>
              <p className="text-gray-500 text-lg">검사 결과 상세 분석이 곧 제공될 예정입니다.</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 