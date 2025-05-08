"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface TestStartPageProps {
  params: {
    id: string;
  };
}

interface TestData {
  anp_seq: number;
  pd_kind: string;
  qu_code: string;
  qu_filename: string;
  step: string;
  prev_step: string;
  qu_action: string;
  qua_type: string;
  questions: Question[];
}

interface Question {
  qu_code: string;
  qu_filename: string;
  qu_order: number;
  qu_text: string;
  qu_category: string;
  qu_action: string;
  choices: Choice[];
}

interface Choice {
  an_val: number;
  an_text: string;
  an_desc: string | null;
  an_sub: string | null;
  an_wei: number;
}

export default function TestStartPage({ params }: TestStartPageProps) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  
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
      fetchTestData();
    }
  }, [status, router, testId]);

  // 테스트 데이터 가져오기
  const fetchTestData = async () => {
    try {
      setLoading(true);
      
      // 1. 테스트 데이터 가져오기
      const response = await fetch(`/api/test/${testId}/start`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '테스트 데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      console.log('테스트 데이터:', data);
      
      setTestData(data);
    } catch (err) {
      console.error('테스트 데이터 로드 오류:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

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

  // 테스트 중단 처리
  const handleStopTest = () => {
    if (confirm('정말로 테스트를 중단하시겠습니까?')) {
      router.push('/dashboard/personal');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">테스트를 준비 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-xl font-bold">오류 발생</h1>
        </div>
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-red-500">테스트 오류</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard/personal')}
              className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 1단계 성향 검사 (pd_kind가 basic인 경우)
  const renderTestContent = () => {
    if (!testData) {
      return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">테스트 데이터 로드 중</h2>
          <p className="text-center text-gray-700">데이터를 불러오는 중입니다...</p>
        </div>
      );
    }

    // 디버깅용: 테스트 데이터 표시
    console.log('테스트 데이터 확인:', testData);

    // 선택지 선택 핸들러
    const handleSelectChoice = (questionCode: string, choiceValue: number, choiceWeight: number) => {
      console.log(`문항 ${questionCode}에 대한 응답: ${choiceValue}, 가중치: ${choiceWeight}`);
      setSelectedAnswers(prev => ({
        ...prev,
        [questionCode]: choiceValue
      }));
    };

    // 다음 문항으로 이동
    const handleNextQuestion = async () => {
      if (!testData) return;
      
      // 모든 문항에 답변했는지 확인
      const allQuestionsAnswered = testData.questions?.every(q => selectedAnswers[q.qu_code] !== undefined);
      
      if (!allQuestionsAnswered) {
        alert('모든 문항에 답변해주세요.');
        return;
      }
      
      try {
        setIsSubmitting(true);
        
        // 각 문항의 답변을 순차적으로 저장
        for (const question of testData.questions || []) {
          const selectedValue = selectedAnswers[question.qu_code];
          const selectedChoice = question.choices.find(c => c.an_val === selectedValue);
          
          if (selectedValue === undefined || !selectedChoice) continue;
          
          // 답변 저장 API 호출
          const response = await fetch(`/api/test/${testId}/save-answer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              anp_seq: testData.anp_seq,
              qu_code: question.qu_code,
              an_val: selectedValue,
              an_wei: selectedChoice.an_wei,
              step: testData.step
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || '답변을 저장하는데 실패했습니다');
          }
          
          const data = await response.json();
          console.log('답변 저장 결과:', data);
          
          // 테스트 완료 여부 확인
          if (data.isCompleted) {
            // 테스트 결과 페이지로 이동
            router.push(`/test-result/${testId}`);
            return;
          }
          
          // 다음 문항 데이터로 업데이트
          if (data.questions && data.questions.length > 0) {
            setTestData({
              ...testData,
              ...data.nextQuestion,
              questions: data.questions
            });
            // 진행률 업데이트
            if (data.progress && typeof data.progress.completion_percentage === 'number') {
              setProgress(data.progress.completion_percentage);
            }
            // 선택 답변 초기화
            setSelectedAnswers({});
          }
        }
      } catch (err) {
        console.error('답변 저장 오류:', err);
        alert(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setIsSubmitting(false);
      }
    };

    // basic 유형이고 성향 검사 단계인 경우
    if (testData.pd_kind === 'basic' && testData.step === 'tnd') {
      return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">1단계: 성향 검사</h2>
          
          {/* 디버깅용: 테스트 데이터 정보 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 mb-6 bg-gray-100 rounded-lg text-sm overflow-auto">
              <h3 className="font-bold mb-2">테스트 데이터 정보 (디버깅용)</h3>
              <pre>{JSON.stringify(testData, null, 2)}</pre>
            </div>
          )} 
          
          <div className="mb-8">
            <p className="text-lg mb-4">다음 항목들에 대해 자신의 생각과 가장 일치하는 답변을 선택해 주세요.</p>
            <p className="text-gray-700 mb-2">솔직하게 답변할수록 더 정확한 결과를 얻을 수 있습니다.</p>
          </div>
          
          {/* 질문 목록 표시 */}
          {testData.questions && testData.questions.length > 0 ? (
            <div className="space-y-10">
              {testData.questions.map((question) => (
                <div key={question.qu_code} className="border rounded-lg p-6 mb-8 bg-blue-50">
                  <h3 className="text-xl font-bold mb-4 text-blue-800">
                    {question.qu_order}. {question.qu_text}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
                    {question.choices.map((choice) => (
                      <button
                        key={`${question.qu_code}-${choice.an_val}`}
                        onClick={() => handleSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                        className={`py-3 px-4 border rounded-lg transition-colors ${
                          selectedAnswers[question.qu_code] === choice.an_val
                            ? 'bg-blue-200 border-blue-500 font-bold'
                            : 'border-gray-300 hover:bg-blue-100 hover:border-blue-300'
                        }`}
                      >
                        {choice.an_text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-100 rounded-lg">
              <p>문항을 불러오는 중이거나 문항이 없습니다.</p>
            </div>
          )}
          
          <div className="mt-8 flex justify-center">
            <button 
              onClick={handleNextQuestion}
              disabled={isSubmitting}
              className={`px-6 py-2 text-white rounded-lg shadow-md flex items-center ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </>
              ) : '다음 문항'}
            </button>
          </div>
        </div>
      );
    }
    
    // 다른 단계/유형의 경우 기본 화면 표시
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">테스트가 시작되었습니다</h2>
        
        <div className="mb-8 text-center">
          <p className="text-lg mb-4">지시사항에 따라 문제를 해결해주세요.</p>
          <p className="text-gray-700">
            문제가 나타나기까지 잠시만 기다려주세요...
          </p>
        </div>
        
        <div className="border-t pt-6 mt-8">
          <div className="text-center text-gray-500">
            <p>테스트가 시작되었습니다. 화면을 주시해 주세요.</p>
            <p className="mt-2">창을 닫거나 브라우저를 벗어나면 테스트가 중단될 수 있습니다.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 테스트 헤더 */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">테스트 진행 중</h1>
          <div className="flex items-center space-x-4">
            {progress > 0 && (
              <div className="flex items-center">
                <span className="mr-2">진행률:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="ml-2">{Math.round(progress)}%</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="material-icons mr-2">timer</span>
              <span>남은 시간: 제한 없음</span>
            </div>
          </div>
        </div>
      </div>

      {/* 테스트 컨텐츠 */}
      <div className="flex-grow p-6">
        {renderTestContent()}
      </div>

      {/* 테스트 푸터 */}
      <div className="bg-gray-100 p-3 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-600">
            © 한국진로적성센터
          </div>
          <div className="text-sm text-gray-600">
            <button 
              onClick={handleStopTest}
              className="ml-4 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              테스트 중단
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 