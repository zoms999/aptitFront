"use client";

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TestStartModal from '@/components/test/TestStartModal';
import Header from '@/components/Header';
import Footer from '../../components/Footer';

interface TestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TestPage({ params }: TestPageProps) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 항상 모달을 표시하도록 상태 변수 수정
  const showModal = true;

  // params를 unwrap
  const resolvedParams = use(params);
  // 테스트 ID를 숫자로 변환
  const testId = parseInt(resolvedParams.id, 10);

  useEffect(() => {
    // 인증 상태 확인
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // 테스트 데이터 로드
    if (status === 'authenticated') {
      fetchTestData();
    }
  }, [status, router, resolvedParams.id]);

  const fetchTestData = async () => {
    try {
      setLoading(true);
      
      // 테스트 데이터를 가져오는 API 호출
      const response = await fetch(`/api/test/${resolvedParams.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '테스트 정보를 가져오는데 실패했습니다');
      }
      
      // API 응답 처리
      await response.json();
    } catch (err) {
      console.error('테스트 정보 로드 오류:', err);
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">테스트 준비 중</h2>
            <p className="text-gray-600 text-lg mb-6">테스트 정보를 불러오는 중입니다...</p>
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
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 relative overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-10 hover:shadow-3xl transition-all duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 shadow-lg animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-red-600 mb-4">오류 발생</h1>
              <p className="text-gray-700 text-xl">{error}</p>
            </div>
            <div className="flex justify-center">
              <button 
                onClick={() => router.push('/dashboard/personal')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                대시보드로 돌아가기
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 테스트 시작 모달 표시
  if (showModal) {
    return <TestStartModal testId={testId} />;
  }

  // 모달이 닫힌 후 보여질 테스트 페이지 내용
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <Header />
      <main className="flex-grow relative z-10">
        <div className="w-full max-w-4xl mx-auto p-6">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-12 text-center hover:shadow-3xl transition-all duration-300">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl mb-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">테스트가 곧 시작됩니다</h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">모든 준비가 완료되었습니다.<br />최고의 검사 환경에서 정확한 결과를 얻으세요.</p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center px-6 py-3 bg-blue-100/80 backdrop-blur-sm rounded-full border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse group-hover:animate-none"></div>
                <span className="text-blue-700 font-semibold">테스트 준비 완료</span>
              </div>
              <div className="flex items-center px-6 py-3 bg-green-100/80 backdrop-blur-sm rounded-full border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse group-hover:animate-none"></div>
                <span className="text-green-700 font-semibold">시스템 정상</span>
              </div>
              <div className="flex items-center px-6 py-3 bg-purple-100/80 backdrop-blur-sm rounded-full border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse group-hover:animate-none"></div>
                <span className="text-purple-700 font-semibold">보안 연결</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 