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
  completed_pages?: number;
  isStepCompleted?: boolean;
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
    console.log('useEffect 실행, status:', status);
    
    // 개발 환경에서는 인증 상태와 관계없이 테스트 데이터 로드
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 환경에서 fetchTestData 호출');
      fetchTestData();
      return;
    }
    
    if (status === 'loading') {
      console.log('인증 상태 로딩 중...');
      return;
    }
    
    if (status === 'unauthenticated') {
      console.log('인증되지 않은 사용자, 로그인 페이지로 이동');
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      console.log('인증된 사용자, fetchTestData 호출');
      fetchTestData();
    }
  }, [status, router, testId]);

  // 테스트 데이터가 로드되었을 때 자동으로 답변 선택
  useEffect(() => {
    // 테스트 목적으로 답변 자동 선택 (성향 진단만 해당)
    if (testData && testData.questions && testData.questions.length > 0 && testData.step === 'tnd') {
      const autoAnswers: Record<string, number> = {};
      
      // 각 문항에 대해 임의의 답변 선택 (1~6 사이의 값)
      testData.questions.forEach(question => {
        // 임의의 답변 생성 (1~6 사이)
        const randomAnswer = Math.floor(Math.random() * 6) + 1;
        autoAnswers[question.qu_code] = randomAnswer;
      });
      
      console.log('테스트용 답변 자동 선택:', autoAnswers);
      setSelectedAnswers(autoAnswers);
    }
  }, [testData]);

  // 테스트 데이터 가져오기
  const fetchTestData = async () => {
    try {
      console.log('fetchTestData 함수 실행 시작');
      setLoading(true);
      
      // 1. 테스트 데이터 가져오기
      console.log('API 호출 시작: /api/test/' + testId + '/start');
      const response = await fetch(`/api/test/${testId}/start`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '테스트 데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      
      // 현재 문항 번호와 총 문항 수 가져오기 (API에서 제공하는 경우)
      // API에서 해당 정보를 제공하지 않는 경우 기본값 사용
      const currentNumber = data.current_question || data.current_number || 1;
      const totalQuestions = data.total_questions || 30;
      const completedPages = data.completed_pages || currentNumber - 1; // 완료된 페이지 수
      
      // 추가 정보 설정
      const enhancedData = {
        ...data,
        test_kind: '종합검사',
        test_step: getTestStep(data.step),
        current_number: currentNumber,
        total_questions: totalQuestions,
        completed_pages: completedPages
      };
      
      console.log('enhancedData 객체:', enhancedData);
      setTestData(enhancedData);
      console.log('setTestData 호출 완료, step:', enhancedData.step, 'test_step:', enhancedData.test_step);
    } catch (err) {
      console.error('테스트 데이터 로드 오류:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
      console.log('fetchTestData 함수 실행 완료, loading:', false);
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
    
    // 단계 완료 화면에서의 다음 버튼 클릭 처리
    if (testData.isStepCompleted) {
      // 다음 단계의 데이터를 가져오기 위해 fetchTestData 호출
      await fetchTestData();
      return;
    }
    
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
        console.log('완료된 페이지:', data.completed_pages, '총 문항 수:', data.total_questions);
        
        // 테스트 완료 여부 확인
        if (data.isCompleted || data.isStepCompleted) {
          // 현재 단계가 'tnd'(성향진단)이고 단계가 완료된 경우, 완료 화면 표시
          if (testData.step === 'tnd') {
            setTestData({
              ...testData,
              questions: [],
              isStepCompleted: true
            });
            setIsSubmitting(false);
            return;
          }
          
          // 그 외의 경우 테스트 결과 페이지로 이동
          router.push(`/test-result/${testId}`);
          return;
        }
        
        // 마지막 문항 구간에 도달한 경우 (완료 직전 상태)
        if (data.isStepCompletingSoon && testData.step === 'tnd') {
          console.log('성향 진단 마지막 문항 구간 도달');
        }
        
        // 다음 문항 데이터로 업데이트
        if (data.questions && data.questions.length > 0) {
          setTestData({
            ...testData,
            ...data.nextQuestion,
            questions: data.questions,
            // 완료 페이지와 총 페이지 수 정보 업데이트
            completed_pages: data.completed_pages,
            total_questions: data.total_questions
          });
          
          // 상태 업데이트 후 확인 로그
          setTimeout(() => {
            console.log('테스트 데이터 업데이트 후:', {
              completed_pages: data.completed_pages,
              total_questions: data.total_questions
            });
          }, 0);
          
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
            
            <div className="flex items-center space-x-2">
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
            <div className="inline-flex items-center">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-800 font-bold mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">
                {testData?.completed_pages || 0}/{testData?.total_questions || 30}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 - 검사 종류에 따라 다른 디자인 */}
      <div id="content" className="examine">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* 성향 진단 단계명 표시 */}
          {isPersonalityTest && (
            <div className="bg-gray-500 text-white px-4 py-1 rounded-md w-28 mb-8">
              {testData?.qua_type || 1}
            </div>
          )}
          
          {/* 선호도 진단일 경우 이미지 번호 표시 */}
          {isImagePreferenceTest && (
            <div className="bg-gray-500 text-white px-4 py-1 rounded-md w-28 mb-8">
              이미지 {currentImageNumber}
            </div>
          )}

          {testData && testData.questions && testData.questions.length > 0 ? (
            <div className="space-y-8">
              {/* 1. 성향 진단 - 새로운 디자인 */}
              {isPersonalityTest && (
                <div>
                  {testData.questions.map((question) => (
                    <div key={question.qu_code} className="mb-10">
                      <div className="flex items-start mb-4">
                        <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
                          <span className="text-gray-700 font-bold">{question.qu_order}</span>
                        </div>
                        <p className="text-lg pt-2">{question.qu_text}</p>
                      </div>
                      
                      <div className="grid grid-cols-6 gap-1 mt-3 pl-14">
                        <button
                          onClick={() => handleSelectChoice(question.qu_code, 1, 0)}
                          className={`py-3 px-2 text-center rounded-md ${
                            selectedAnswers[question.qu_code] === 1
                              ? 'bg-blue-100 border border-blue-500 text-blue-700 font-bold'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          매우 그렇다
                        </button>
                        <button
                          onClick={() => handleSelectChoice(question.qu_code, 2, 0)}
                          className={`py-3 px-2 text-center rounded-md ${
                            selectedAnswers[question.qu_code] === 2
                              ? 'bg-blue-100 border border-blue-500 text-blue-700 font-bold'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          그렇다
                        </button>
                        <button
                          onClick={() => handleSelectChoice(question.qu_code, 3, 0)}
                          className={`py-3 px-2 text-center rounded-md ${
                            selectedAnswers[question.qu_code] === 3
                              ? 'bg-blue-100 border border-blue-500 text-blue-700 font-bold'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          약간 그렇다
                        </button>
                        <button
                          onClick={() => handleSelectChoice(question.qu_code, 4, 0)}
                          className={`py-3 px-2 text-center rounded-md ${
                            selectedAnswers[question.qu_code] === 4
                              ? 'bg-blue-100 border border-blue-500 text-blue-700 font-bold'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          별로 그렇지 않다
                        </button>
                        <button
                          onClick={() => handleSelectChoice(question.qu_code, 5, 0)}
                          className={`py-3 px-2 text-center rounded-md ${
                            selectedAnswers[question.qu_code] === 5
                              ? 'bg-blue-100 border border-blue-500 text-blue-700 font-bold'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          그렇지 않다
                        </button>
                        <button
                          onClick={() => handleSelectChoice(question.qu_code, 6, 0)}
                          className={`py-3 px-2 text-center rounded-md ${
                            selectedAnswers[question.qu_code] === 6
                              ? 'bg-blue-100 border border-blue-500 text-blue-700 font-bold'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          전혀 그렇지 않다
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. 사고력 진단 */}
              {isThinkingTest && (
                <>
                  {testData.questions.map((question) => (
                    <div key={question.qu_code} className="mb-8 bg-gray-50 p-6 rounded-lg shadow-sm">
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
                    </div>
                  ))}
                </>
              )}

              {/* 3. 선호도 진단 */}
              {isImagePreferenceTest && (
                <div className="mb-8">
                  {testData.questions.map((question) => (
                    <div key={question.qu_code} className="test-form">
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
                  ))}
                </div>
              )}

              {/* 다음 버튼 */}
              <div className="flex justify-center mt-12">
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

          {testData && testData.isStepCompleted && (
            <div className="space-y-8 text-center">
              <div className="flex flex-col items-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-6">검사가 완료되었습니다.</h2>
                <p className="text-lg mb-8">다음 검사를 진행하여 주십시오.</p>
                <button
                  onClick={handleNextQuestion}
                  className={`px-6 py-3 text-white rounded-full hover:bg-opacity-90 ${theme.buttonBg}`}
                >
                  다음 <span className="ml-2">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 