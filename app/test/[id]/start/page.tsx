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
  test_kind?: string;
  test_step?: number;
  current_number?: number;
  total_questions?: number;
  questions: Question[];
}

interface Question {
  qu_code: string;
  qu_filename: string;
  qu_order: number;
  qu_text: string;
  qu_category: string;
  qu_action: string;
  qu_image?: string;
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
  const [currentImageNumber, setCurrentImageNumber] = useState<number>(2);
  
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
      
      // 추가 정보 설정
      const enhancedData = {
        ...data,
        test_kind: '종합검사',
        test_step: getTestStep(data.step),
        current_number: 6,
        total_questions: 135
      };
      
      setTestData(enhancedData);
    } catch (err) {
      console.error('테스트 데이터 로드 오류:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 단계 번호 반환
  const getTestStep = (step: string): number => {
    switch(step) {
      case 'tnd': return 1; // 성향 진단
      case 'thk': return 2; // 사고력 진단
      case 'img': return 3; // 선호도 진단
      default: return 1;
    }
  };

  // 단계별 색상 테마 반환
  const getStepTheme = () => {
    if (!testData) return {
      headerBg: 'bg-blue-800',
      activeBg: 'bg-blue-500',
      buttonBg: 'bg-blue-700',
      selectedBg: 'bg-blue-100',
      selectedBorder: 'border-blue-500',
      selectedText: 'text-blue-700'
    };

    switch(testData.step) {
      case 'tnd': // 성향 진단
        return {
          headerBg: 'bg-blue-800',
          activeBg: 'bg-blue-500',
          buttonBg: 'bg-blue-700',
          selectedBg: 'bg-blue-100',
          selectedBorder: 'border-blue-500',
          selectedText: 'text-blue-700'
        };
      case 'thk': // 사고력 진단
        return {
          headerBg: 'bg-indigo-800',
          activeBg: 'bg-indigo-500',
          buttonBg: 'bg-indigo-700',
          selectedBg: 'bg-indigo-100',
          selectedBorder: 'border-indigo-500',
          selectedText: 'text-indigo-700'
        };
      case 'img': // 선호도 진단
        return {
          headerBg: 'bg-green-800',
          activeBg: 'bg-green-500',
          buttonBg: 'bg-green-700',
          selectedBg: 'bg-green-100',
          selectedBorder: 'border-green-500',
          selectedText: 'text-green-700'
        };
      default:
        return {
          headerBg: 'bg-blue-800',
          activeBg: 'bg-blue-500',
          buttonBg: 'bg-blue-700',
          selectedBg: 'bg-blue-100',
          selectedBorder: 'border-blue-500',
          selectedText: 'text-blue-700'
        };
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
          // 이미지 번호 증가
          setCurrentImageNumber(prev => (prev % 10) + 1);
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

  // 테마 색상 설정
  const theme = getStepTheme();

  // 선호도 진단 유형인지 확인
  const isImagePreferenceTest = testData?.step === 'img';

  // 성향 진단 유형인지 확인
  const isPersonalityTest = testData?.step === 'tnd';

  // 사고력 진단 유형인지 확인
  const isThinkingTest = testData?.step === 'thk';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상단 헤더 - 단계별 다른 색상 */}
      <div className={`${theme.headerBg} text-white py-4`}>
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 rounded-lg bg-teal-500 text-white font-bold">종합검사</div>
            
            <div className="flex items-center">
              <button className={`px-4 py-2 rounded-full ${testData?.test_step === 1 ? theme.activeBg : 'bg-transparent border border-white'} mr-2`}>
                단계1 <span className="ml-2">성향 진단</span>
              </button>
              
              <button className={`px-4 py-2 rounded-full ${testData?.test_step === 2 ? theme.activeBg : 'bg-transparent border border-white'} mr-2`}>
                단계2 <span className="ml-2">사고력 진단</span>
              </button>
              
              <button className={`px-4 py-2 rounded-full ${testData?.test_step === 3 ? theme.activeBg : 'bg-transparent border border-white'}`}>
                단계3 <span className="ml-2">선호도 진단</span>
              </button>
            </div>
          </div>
          
          <div className="text-white flex items-center">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-800 font-bold">
              <span className="material-icons">timer</span>
            </div>
            <span className="ml-2">{testData?.current_number || 6}/{testData?.total_questions || 135}</span>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 - 검사 종류에 따라 다른 디자인 */}
      <div id="content" className="examine">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* 선호도 진단일 경우 이미지 번호 표시 */}
          {isImagePreferenceTest && (
            <div className="bg-gray-500 text-white px-4 py-1 rounded-md w-28 mb-8">
              이미지 {currentImageNumber}
            </div>
          )}

          {testData && testData.questions && testData.questions.length > 0 ? (
            <div className="space-y-8">
              {testData.questions.map((question) => (
                <div key={question.qu_code} className={`mb-8 ${isThinkingTest ? 'bg-gray-50 p-6 rounded-lg shadow-sm' : ''}`}>
                  {/* 문항 영역 - 검사 종류에 따라 다른 스타일 */}
                  {/* 1. 성향 진단 */}
                  {isPersonalityTest && (
                    <div className="test-form">
                      <div className="question">
                        <div className="flex items-center mb-4">
                          <div className="bg-blue-200 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                            <span className="text-blue-800 font-bold">{question.qu_order}</span>
                          </div>
                          <p className="text-lg font-bold text-gray-800">
                            {question.qu_text}
                          </p>
                        </div>
                      </div>
                      <div className="answer">
                        <div className={`grid ${question.choices.length > 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'} gap-3 mt-4`}>
                          {question.choices.map((choice) => (
                            <button
                              key={`${question.qu_code}-${choice.an_val}`}
                              onClick={() => handleSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                              className={`py-3 px-4 text-center border transition-colors ${
                                selectedAnswers[question.qu_code] === choice.an_val
                                  ? `${theme.selectedBg} ${theme.selectedBorder} font-bold ${theme.selectedText}`
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {choice.an_text}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. 사고력 진단 */}
                  {isThinkingTest && (
                    <div className="test-form">
                      <div className="question">
                        <div className="flex items-start mb-6">
                          <div className="bg-indigo-200 rounded-full w-10 h-10 flex items-center justify-center mr-4 mt-1">
                            <span className="text-indigo-800 font-bold">{question.qu_order}</span>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-800 mb-4">
                              {question.qu_text}
                            </p>
                            {question.qu_image && (
                              <div className="bg-white p-4 border border-gray-300 rounded-lg mb-6">
                                <img 
                                  src={question.qu_image} 
                                  alt="문제 이미지" 
                                  className="max-w-full h-auto mx-auto"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="answer pl-14">
                        <div className="space-y-3">
                          {question.choices.map((choice) => (
                            <button
                              key={`${question.qu_code}-${choice.an_val}`}
                              onClick={() => handleSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                              className={`w-full text-left py-3 px-4 border rounded transition-colors flex items-start ${
                                selectedAnswers[question.qu_code] === choice.an_val
                                  ? `${theme.selectedBg} ${theme.selectedBorder} font-bold ${theme.selectedText}`
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                {choice.an_val}
                              </span>
                              <span>{choice.an_text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. 선호도 진단 */}
                  {isImagePreferenceTest && (
                    <div className="test-form">
                      <div className="question">
                        <div className="flex items-center mb-4">
                          <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                            <span className="text-gray-700 font-bold">{question.qu_order}</span>
                          </div>
                          <p className="text-lg">
                            이미지를 보고 처음 떠오르는 느낌을 <span className="text-red-500 font-bold">빠르게</span> 선택해보자.
                          </p>
                        </div>
                      </div>

                      {/* 문항 이미지 */}
                      <div className="border border-gray-200 rounded-lg p-4 mb-6">
                        <div className="w-full max-w-2xl mx-auto">
                          <img 
                            src="https://via.placeholder.com/600x400?text=Test+Image" 
                            alt="검사 이미지" 
                            className="w-full h-auto"
                          />
                        </div>
                      </div>

                      {/* 선택지 영역 */}
                      <div className="grid grid-cols-3 gap-4">
                        {question.choices.map((choice) => (
                          <button
                            key={`${question.qu_code}-${choice.an_val}`}
                            onClick={() => handleSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                            className={`py-3 px-6 text-center rounded-full border ${
                              selectedAnswers[question.qu_code] === choice.an_val
                                ? `${theme.selectedBg} ${theme.selectedBorder} font-bold ${theme.selectedText}`
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {choice.an_text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* 다음 버튼 */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className={`px-6 py-3 text-white rounded-full hover:bg-opacity-90 disabled:bg-gray-400 flex items-center ${theme.buttonBg}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      저장 중...
                    </>
                  ) : (
                    <>
                      다음 <span className="ml-2">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-100 rounded-lg">
              <p>문항을 불러오는 중이거나 문항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 