import React, { useEffect, useState, useMemo } from 'react';
import { TemplateProps, TimerState } from './types';
import { 
  CircularProgress, 
  formatTime, 
  getTimerProgress, 
  getCurrentStep, 
  getCompletedTimersFromStorage, 
  saveCompletedTimerToStorage,
  DevControls 
} from './utils';

export default function TimedMemoryTestTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    
    console.log('[TimedMemoryTest] 문항 로드:', questions.map(q => ({
      qu_code: q.qu_code,
      qu_time_limit_sec: q.qu_time_limit_sec,
      hasValidTimer: q.qu_time_limit_sec !== null && q.qu_time_limit_sec !== undefined && Number(q.qu_time_limit_sec) > 0
    })));
    
    return questions;
  }, [questions]);

  // 타이머 상태 관리
  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>({});
  const [isReady, setIsReady] = useState(false);

  // 타이머 상태 초기화
  useEffect(() => {
    if (!stableQuestions || stableQuestions.length === 0) {
      setIsReady(false);
      setTimerStates({});
      return;
    }

    const currentStep = getCurrentStep(stableQuestions);
    const completedTimers = getCompletedTimersFromStorage(currentStep);
    
    const newTimerStates: Record<string, TimerState> = {};

    stableQuestions.forEach((question) => {
      const dbTimerValue = question.qu_time_limit_sec;
      const hasValidTimer = dbTimerValue !== null && 
                           dbTimerValue !== undefined && 
                           Number(dbTimerValue) > 0;
      
      if (hasValidTimer) {
        const timeLimitSec = Number(dbTimerValue);
        const isAlreadyCompleted = completedTimers[question.qu_code] === true;
        
        if (isAlreadyCompleted) {
          newTimerStates[question.qu_code] = {
            timeLeft: 0,
            isActive: false,
            isCompleted: true,
            totalTime: timeLimitSec,
          };
        } else {
          newTimerStates[question.qu_code] = {
            timeLeft: timeLimitSec,
            isActive: true,
            isCompleted: false,
            totalTime: timeLimitSec,
          };
        }
      }
    });

    setTimerStates(newTimerStates);
    if (!isReady) {
      setIsReady(true);
    }
  }, [stableQuestions, isReady]);

  // 타이머 실행
  useEffect(() => {
    if (!isReady) return;

    const intervalId = setInterval(() => {
      setTimerStates(prevStates => {
        const newStates = { ...prevStates };
        let hasChanges = false;
        
        Object.keys(newStates).forEach(code => {
          const state = newStates[code];
          if (state && state.isActive && state.timeLeft > 0) {
            newStates[code] = {
              ...state,
              timeLeft: state.timeLeft - 1,
            };
            hasChanges = true;
            
            if (newStates[code].timeLeft <= 0) {
              newStates[code].isActive = false;
              newStates[code].isCompleted = true;
              const currentStep = getCurrentStep(stableQuestions);
              saveCompletedTimerToStorage(code, currentStep);
            }
          }
        });
        
        return hasChanges ? newStates : prevStates;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isReady, stableQuestions]);

  // 개발 환경 자동 답변
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isReady) {
      const timer = setTimeout(() => {
        stableQuestions.forEach((question) => {
          if (selectedAnswers[question.qu_code]) return;
          const timerState = timerStates[question.qu_code];
          if (timerState && !timerState.isCompleted) return;
          
          const availableChoices = question.choices.filter(c => c.an_val >= 1 && c.an_val <= 5);
          if (availableChoices.length > 0) {
            const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
            onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
          }
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stableQuestions, selectedAnswers, onSelectChoice, timerStates, isReady]);

  // 개발 모드 함수들
  const handleManualAutoSelect = () => {
    if (process.env.NODE_ENV === 'development') {
      stableQuestions.forEach((question) => {
        const timerState = timerStates[question.qu_code];
        if (timerState && !timerState.isCompleted) return;
        const availableChoices = question.choices.filter(c => c.an_val >= 1 && c.an_val <= 5);
        if (availableChoices.length > 0) {
          const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
          onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
        }
      });
    }
  };

  const handleForceCompleteTimer = () => {
    if (process.env.NODE_ENV === 'development') {
      setTimerStates(prev => {
        const newStates = { ...prev };
        Object.keys(newStates).forEach(code => {
          if (newStates[code]) {
            newStates[code] = {
              ...newStates[code],
              timeLeft: 0,
              isActive: false,
              isCompleted: true,
            };
          }
        });
        return newStates;
      });
      
      const currentStep = getCurrentStep(stableQuestions);
      stableQuestions.forEach(q => {
        if (timerStates[q.qu_code]) {
          saveCompletedTimerToStorage(q.qu_code, currentStep);
        }
      });
    }
  };

  const handleClearCompletedTimers = () => {
    if (process.env.NODE_ENV === 'development') {
      const currentStep = getCurrentStep(stableQuestions);
      const key = `completedTimers_${currentStep}`;
      localStorage.removeItem(key);
      
      const newTimerStates: Record<string, TimerState> = {};
      stableQuestions.forEach((question) => {
        const dbTimerValue = question.qu_time_limit_sec;
        const hasValidTimer = dbTimerValue !== null && 
                             dbTimerValue !== undefined && 
                             Number(dbTimerValue) > 0;
        
        if (hasValidTimer) {
          const timeLimitSec = Number(dbTimerValue);
          newTimerStates[question.qu_code] = {
            timeLeft: timeLimitSec,
            isActive: true,
            isCompleted: false,
            totalTime: timeLimitSec,
          };
        }
      });
      
      setTimerStates(newTimerStates);
    }
  };

  const hasActiveTimers = Object.values(timerStates).some(state => state?.isActive);

  if (!stableQuestions || stableQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-red-600 font-medium">메모리 테스트 문항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-teal-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-teal-600 bg-clip-text text-transparent mb-2">
            기억력 테스트
          </h1>
          <p className="text-gray-600 text-lg">
            주어진 정보를 기억하고 정확히 응답해보세요
          </p>
        </div>

        {/* 개발 모드 컨트롤 */}
        <DevControls
          onManualAutoSelect={handleManualAutoSelect}
          onForceCompleteTimer={handleForceCompleteTimer}
          onClearCompletedTimers={handleClearCompletedTimers}
          hasActiveTimers={hasActiveTimers}
        />

        {/* 문항들 */}
        <div className="space-y-8">
          {stableQuestions.map((question, questionIndex) => {
            const timerState = timerStates[question.qu_code];
            const hasTimer = timerState !== undefined;
            const isTimerActive = hasTimer && timerState.isActive;
            const isTimerCompleted = hasTimer && timerState.isCompleted;
            const shouldHideChoices = hasTimer && isTimerActive;

            return (
              <div
                key={question.qu_code}
                className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden"
              >
                {/* 문항 헤더 */}
                <div className="bg-gradient-to-r from-red-500 to-teal-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">
                        문항 {questionIndex + 1}
                      </span>
                      <span className="text-white text-sm opacity-90">
                        {question.qu_code}
                      </span>
                    </div>
                    
                    {/* 타이머 표시 */}
                    {hasTimer && (
                      <div className="flex items-center space-x-3">
                        {isTimerActive && (
                          <CircularProgress 
                            progress={getTimerProgress(timerState)} 
                            size={50}
                          />
                        )}
                        <div className="text-center">
                          <div className={`text-lg font-bold ${isTimerActive ? 'text-red-100' : 'text-white'}`}>
                            {formatTime(timerState.timeLeft)}
                          </div>
                          <div className="text-xs text-red-100">
                            {isTimerActive ? '기억 시간' : '시간 종료'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 문항 내용 */}
                <div className="p-6">
                  {/* 제목 */}
                  {question.qu_title && (
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {question.qu_title}
                    </h3>
                  )}
                  
                  {/* 지시사항 */}
                  {question.qu_instruction && (
                    <div className="bg-gradient-to-r from-red-50 to-teal-50 border-l-4 border-red-400 p-4 mb-6">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-700 font-medium leading-relaxed">
                          {question.qu_instruction}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 기억해야 할 내용 */}
                  {question.qu_passage && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 mb-6 border-2 border-dashed border-gray-300">
                      <div className="flex items-center mb-3">
                        <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h4 className="text-lg font-bold text-gray-800">기억해야 할 내용</h4>
                      </div>
                      <div className="text-gray-700 text-lg leading-relaxed font-medium">
                        {question.qu_passage.split('\n').map((line, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 문제 텍스트 */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      {question.qu_text}
                    </h4>
                  </div>

                  {/* 이미지들 */}
                  {question.qu_images && question.qu_images.length > 0 && (
                    <div className="mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.qu_images.map((image, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={image} 
                              alt={`문항 이미지 ${index + 1}`}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 타이머 상태별 메시지 */}
                  {hasTimer && (
                    <div className="mb-6">
                      {isTimerActive ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-700 font-medium">
                              지금 내용을 잘 기억해두세요. 시간이 지나면 선택지가 나타납니다.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-teal-700 font-medium">
                              기억 시간이 종료되었습니다. 아래 선택지에서 정답을 골라주세요.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 선택지 */}
                  {!shouldHideChoices && (
                    <div className="space-y-3">
                      <h5 className="text-md font-semibold text-gray-700 mb-3">선택지를 골라주세요:</h5>
                      {question.choices.map((choice) => {
                        const isSelected = selectedAnswers[question.qu_code] === choice.an_val;
                        
                        return (
                          <button
                            key={choice.an_val}
                            onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                              isSelected
                                ? 'border-red-500 bg-gradient-to-r from-red-50 to-teal-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-red-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-teal-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full border-2 mr-3 flex-shrink-0 ${
                                isSelected 
                                  ? 'border-red-500 bg-red-500' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <span className={`text-sm font-medium ${
                                  isSelected ? 'text-red-700' : 'text-gray-500'
                                }`}>
                                  {choice.an_val}번
                                </span>
                                <p className={`mt-1 ${
                                  isSelected ? 'text-gray-800 font-medium' : 'text-gray-700'
                                }`}>
                                  {choice.an_text}
                                </p>
                                {choice.an_desc && (
                                  <p className={`text-sm mt-1 ${
                                    isSelected ? 'text-gray-600' : 'text-gray-500'
                                  }`}>
                                    {choice.an_desc}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 