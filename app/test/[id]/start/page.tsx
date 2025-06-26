"use client";

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getLanguageHeaders } from '../../../../lib/i18n';

// 컴포넌트 임포트
import TestHeader from '@/components/test/TestHeader';
import PersonalityTest from '@/components/test/PersonalityTest';
import ThinkingTest from '@/components/test/ThinkingTest';
import PreferenceTest from '@/components/test/PreferenceTest';
import TestCompletionModal from '@/components/test/TestCompletionModal';
import TestNavButton from '@/components/test/TestNavButton';

interface TestStartPageProps {
  params: Promise<{
    id: string;
  }>;
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
  qu_images?: string[];
  qu_time_limit_sec?: number | null;
  choices: Choice[];
}

interface Choice {
  an_val: number;
  an_text: string;
  an_desc: string | null;
  an_sub: string | null;
  an_wei: number;
  choice_image_path?: string;
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
  
  // params를 unwrap
  const resolvedParams = use(params);
  // 테스트 ID
  const testId = parseInt(resolvedParams.id, 10);

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
      const response = await fetch(`/api/test/${testId}/start`, {
        headers: getLanguageHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API 오류]', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        let errorMessage = errorData.error || '테스트 데이터를 가져오는데 실패했습니다';
        if (errorData.details) {
          errorMessage += ` (상세: ${errorData.details})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      console.log('API 응답 데이터의 questions:', data.questions);
      console.log('questions 배열 길이:', data.questions ? data.questions.length : 'undefined');
      console.log('API 응답 step:', data.step);
      console.log('API 응답 debug_info:', data.debug_info);
      
      // [1단계] API 응답에서 각 문항의 qu_time_limit_sec 값을 엄격하게 검증
      if (data.questions && Array.isArray(data.questions)) {
        console.log('[타이머 검증] 다음 단계 이동 시 문항별 타이머 값 검증 시작');
        
        const questionsWithTimer: string[] = [];
        const questionsWithoutTimer: string[] = [];
        
        data.questions.forEach((question: Question) => {
          const dbTimerValue = question.qu_time_limit_sec;
          const hasValidTimer = dbTimerValue !== null && 
                               dbTimerValue !== undefined && 
                               Number(dbTimerValue) > 0;
          
          if (hasValidTimer) {
            questionsWithTimer.push(`${question.qu_code}(${dbTimerValue}초)`);
          } else {
            questionsWithoutTimer.push(`${question.qu_code}(${dbTimerValue})`);
          }
          
          console.log(`[타이머 검증] ${question.qu_code}:`, {
            qu_time_limit_sec: dbTimerValue,
            type: typeof dbTimerValue,
            hasValidTimer,
            willShowTimer: hasValidTimer
          });
        });
        
        console.log('[타이머 요약] 타이머가 있는 문항:', questionsWithTimer);
        console.log('[타이머 요약] 타이머가 없는 문항:', questionsWithoutTimer);
        console.log(`[타이머 요약] 전체 ${data.questions.length}개 문항 중 ${questionsWithTimer.length}개에 타이머 표시됨`);
      } else {
        console.log('[타이머 검증] questions 배열이 없거나 비어있음:', data.questions);
      }
      
      // API에서 제공하는 진행률 정보 사용
      const currentNumber = data.current_number || data.completed_pages + 1 || 1;
      const totalQuestions = data.total_questions || 150; // 성향 진단 기본값
      const completedPages = data.completed_pages || 0;
      
      console.log('API에서 받은 진행률 정보:', {
        completed_pages: data.completed_pages,
        total_questions: data.total_questions,
        current_number: data.current_number
      });
      
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
      console.log('enhancedData.questions:', enhancedData.questions);
      console.log('enhancedData.questions 길이:', enhancedData.questions ? enhancedData.questions.length : 'undefined');
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

  // 선택지 선택 핸들러
  const handleSelectChoice = (questionCode: string, choiceValue: number, choiceWeight: number) => {
    console.log(`문항 ${questionCode}에 대한 응답: ${choiceValue}, 가중치: ${choiceWeight}`);
    setSelectedAnswers(prev => ({
      ...prev,
      [questionCode]: choiceValue
    }));
  };

  // 다음 문항으로 이동하는 핸들러
  const handleNextQuestion = async () => {
    if (isSubmitting || !testData) return;
    
    setIsSubmitting(true);
    
    try {
      // TestCompletionModal에서 호출된 경우 (단계 완료 후 다음 단계 시작)
      if (testData.isStepCompleted) {
        console.log('단계 완료 모달에서 다음 단계 시작 요청');
        
        // isStepCompleted를 false로 초기화하고 새로운 테스트 데이터 가져오기
        setTestData(prev => prev ? ({
          ...prev,
          isStepCompleted: false,
          questions: []
        }) : null);
        
        // 새로운 테스트 데이터 가져오기
        await fetchTestData();
        setIsSubmitting(false);
        return;
      }

      // 일반적인 답변 저장 및 다음 문항 이동
      const selectedAnswersList = Object.entries(selectedAnswers);
      if (selectedAnswersList.length === 0) {
        alert('답변을 선택해주세요.');
        setIsSubmitting(false);
        return;
      }

      // 각 문항의 답변을 순차적으로 저장
      for (const [questionCode, selectedValue] of selectedAnswersList) {
        const question = testData.questions.find(q => q.qu_code === questionCode);
        const selectedChoice = question?.choices.find(c => c.an_val === selectedValue);
        
        if (selectedValue === undefined || !selectedChoice || !question) continue;

        const response = await fetch(`/api/test/${testId}/save-answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getLanguageHeaders()
          },
          body: JSON.stringify({
            anp_seq: testData.anp_seq,
            qu_code: questionCode,
            an_val: selectedValue,
            an_wei: selectedChoice.an_wei,
            step: testData.step
          })
        });

        if (!response.ok) {
          throw new Error('답변 저장에 실패했습니다');
        }

        const data = await response.json();
        console.log('답변 저장 응답:', data);
        
        if (data.isStepCompleted) {
          // 현재 단계가 완료된 경우, 완료 화면 표시
          console.log('단계 완료 감지:', {
            current_step: testData.step,
            next_step: data.nextQuestion?.step,
            completed_pages: data.completed_pages,
            total_questions: data.total_questions
          });
          
          setTestData(prev => prev ? ({
            ...prev,
            questions: [],
            isStepCompleted: true,
            step: data.nextQuestion?.step || prev.step,
            prev_step: prev.step,
            test_step: getTestStep(data.nextQuestion?.step || prev.step),
            // 진행률 정보도 업데이트
            completed_pages: data.completed_pages,
            total_questions: data.total_questions
          }) : null);
          setIsSubmitting(false);
          return;
        }
        
        // 마지막 문항 구간에 도달한 경우 (완료 직전 상태)
        if (data.isStepCompletingSoon && testData.step === 'tnd') {
          console.log('성향 진단 마지막 문항 구간 도달');
        }
        
        // 다음 문항 데이터로 업데이트
        if (data.questions && data.questions.length > 0) {
          setTestData(prev => prev ? ({
            ...prev,
            ...data.nextQuestion,
            questions: data.questions,
            test_step: getTestStep(data.nextQuestion?.step || prev.step),
            // 완료 페이지와 총 페이지 수 정보 업데이트
            completed_pages: data.completed_pages,
            total_questions: data.total_questions
          }) : null);
          
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

  // 선호도 진단 유형인지 확인
  const isImagePreferenceTest = testData?.step === 'img';

  // 성향 진단 유형인지 확인
  const isPersonalityTest = testData?.step === 'tnd';

  // 사고력 진단 유형인지 확인
  const isThinkingTest = testData?.step === 'thk';

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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">테스트를 준비 중입니다</h2>
            <p className="text-gray-600 text-lg mb-6">최적의 검사 환경을 구성하고 있습니다...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex flex-col relative overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-md rounded-t-3xl shadow-xl border-t border-white/30 p-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl mr-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-600">검사 오류 발생</h1>
                <p className="text-gray-600">시스템에 문제가 발생했습니다</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-grow flex items-center justify-center p-6 relative z-10">
          <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-10 hover:shadow-3xl transition-all duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 shadow-lg animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-red-600">테스트 오류</h2>
              <p className="text-gray-700 text-lg mb-8">{error}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/personal')}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* 모던한 상단 헤더 */}
      <TestHeader testData={testData} />

      {/* 컨텐츠 영역 */}
      <div className="flex-grow relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* 성향 진단 단계명 표시 */}
          {isPersonalityTest && (
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg font-bold">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                검사 단계 {testData?.qua_type || 1}
              </div>
            </div>
          )}

          {/* 디버깅 정보 */}
          {/* {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-yellow-100 rounded-lg">
              <h3 className="font-bold text-yellow-800">디버깅 정보:</h3>
              <p>testData 존재: {testData ? 'true' : 'false'}</p>
              <p>testData.questions 존재: {testData?.questions ? 'true' : 'false'}</p>
              <p>testData.questions 길이: {testData?.questions?.length || 0}</p>
              <p>testData.step: {testData?.step}</p>
              <p>testData.prev_step: {testData?.prev_step}</p>
              <p>testData.isStepCompleted: {testData?.isStepCompleted ? 'true' : 'false'}</p>
              <p>isPersonalityTest: {isPersonalityTest ? 'true' : 'false'}</p>
              <p>isThinkingTest: {isThinkingTest ? 'true' : 'false'}</p>
              <p>isImagePreferenceTest: {isImagePreferenceTest ? 'true' : 'false'}</p>
            </div>
          )} */}

          {/* 테스트 완료 모달이 우선 표시되어야 함 */}
          {testData && testData.isStepCompleted ? (
            <TestCompletionModal 
              onNextStep={handleNextQuestion} 
              currentStep={testData.prev_step || testData.step}
            />
          ) : testData && testData.questions && testData.questions.length > 0 ? (
            <div className="space-y-8">
              {/* 1. 성향 진단 */}
              {isPersonalityTest && (
                <PersonalityTest
                  questions={testData.questions}
                  selectedAnswers={selectedAnswers}
                  onSelectChoice={handleSelectChoice}
                />
              )}

              {/* 2. 사고력 진단 */}
              {isThinkingTest && (
                <ThinkingTest
                  questions={testData.questions}
                  selectedAnswers={selectedAnswers}
                  onSelectChoice={handleSelectChoice}
                />
              )}

              {/* 3. 선호도 진단 */}
              {isImagePreferenceTest && (
                <PreferenceTest
                  questions={testData.questions}
                  selectedAnswers={selectedAnswers}
                  onSelectChoice={handleSelectChoice}
                  currentImageNumber={currentImageNumber}
                />
              )}

              {/* 다음 버튼 */}
              <TestNavButton
                onClick={handleNextQuestion}
                isSubmitting={isSubmitting}
              />
            </div>
          ) : (
            <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">문항을 불러오는 중입니다</h3>
              <p className="text-gray-600 text-lg">잠시만 기다려주세요...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 