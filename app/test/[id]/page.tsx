"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TestStartModal from '@/components/test/TestStartModal';
import Header from '@/components/Header';
import Footer from '../../components/Footer';

interface TestPageProps {
  params: {
    id: string;
  };
}

export default function TestPage({ params }: TestPageProps) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 항상 모달을 표시하도록 상태 변수 수정
  const showModal = true;

  // 테스트 ID를 숫자로 변환
  const testId = parseInt(params.id, 10);

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
  }, [status, router, params.id]);

  const fetchTestData = async () => {
    try {
      setLoading(true);
      
      // 테스트 데이터를 가져오는 API 호출
      const response = await fetch(`/api/test/${params.id}`);
      
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">테스트 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-md">
            <h1 className="mb-4 text-2xl font-bold text-red-500">오류 발생</h1>
            <p className="text-gray-700">{error}</p>
            <button 
              onClick={() => router.push('/dashboard/personal')}
              className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              대시보드로 돌아가기
            </button>
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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="w-full max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">테스트가 곧 시작됩니다</h1>
          <p>모달이 닫힌 후 보여질 내용입니다. 이 페이지는 일반적으로 보이지 않습니다.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
} 