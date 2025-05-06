"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface TestStartPageProps {
  params: {
    id: string;
  };
}

export default function TestStartPage({ params }: TestStartPageProps) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // 테스트 ID
  const testId = parseInt(params.id, 10);

  useEffect(() => {
    // 인증 상태 확인
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // 페이지 로드 시 처리
    if (status === 'authenticated') {
      setLoading(false);
      // 필요한 테스트 데이터 로드나 초기화 로직을 여기에 추가
    }
  }, [status, router, testId]);

  useEffect(() => {
    // 풀스크린 상태 유지
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        // 사용자가 수동으로 풀스크린을 종료한 경우, 다시 풀스크린 요청
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('풀스크린 재진입 실패:', err);
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      
      // 컴포넌트 언마운트 시 풀스크린 해제
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error('풀스크린 해제 실패:', err);
        });
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">테스트를 준비 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 테스트 헤더 */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">테스트 진행 중</h1>
          <div className="flex items-center">
            <span className="material-icons mr-2">timer</span>
            <span>남은 시간: 제한 없음</span>
          </div>
        </div>
      </div>

      {/* 테스트 컨텐츠 */}
      <div className="flex-grow p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">테스트가 시작되었습니다</h2>
          
          <div className="mb-8 text-center">
            <p className="text-lg mb-4">지시사항에 따라 문제를 해결해주세요.</p>
            <p className="text-gray-700">
              문제가 나타나기까지 잠시만 기다려주세요...
            </p>
          </div>
          
          {/* 여기에 실제 테스트 컨텐츠가 표시됩니다 */}
          <div className="border-t pt-6 mt-8">
            <div className="text-center text-gray-500">
              <p>테스트가 시작되었습니다. 화면을 주시해 주세요.</p>
              <p className="mt-2">창을 닫거나 브라우저를 벗어나면 테스트가 중단될 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 테스트 푸터 */}
      <div className="bg-gray-100 p-3 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-600">
            © 한국진로적성센터
          </div>
          <div className="text-sm text-gray-600">
            <button className="ml-4 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600">
              테스트 중단
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 