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

export default function TimedCreativityTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    return questions;
  }, [questions]);

  // 이미지 개수에 따라 동적으로 레이아웃을 결정하는 함수
  const getImageLayoutConfig = (imageCount: number) => {
    if (imageCount === 1) {
      return { gridCols: 'grid-cols-1', imageHeight: 'h-96 md:h-[32rem]', maxWidth: 'max-w-2xl mx-auto' };
    } else if (imageCount === 2) {
      return { gridCols: 'grid-cols-1 md:grid-cols-2', imageHeight: 'h-64 md:h-80', maxWidth: 'max-w-4xl mx-auto' };
    } else if (imageCount <= 4) {
      return { gridCols: 'grid-cols-2', imageHeight: 'h-48 md:h-56', maxWidth: 'max-w-4xl mx-auto' };
    } else if (imageCount <= 6) {
      return { gridCols: 'grid-cols-2 md:grid-cols-3', imageHeight: 'h-44 md:h-48', maxWidth: 'max-w-6xl mx-auto' };
    } else {
      return { gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4', imageHeight: 'h-36 md:h-40', maxWidth: 'max-w-7xl mx-auto' };
    }
  };

  // --- 타이머 상태 관리 및 로직 ---
  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>({});
  const [isReady, setIsReady] = useState(false);

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
      const hasValidTimer = dbTimerValue !== null && dbTimerValue !== undefined && Number(dbTimerValue) > 0;
      
      if (hasValidTimer) {
        const timeLimitSec = Number(dbTimerValue);
        const isAlreadyCompleted = completedTimers[question.qu_code] === true;
        
        if (isAlreadyCompleted) {
          newTimerStates[question.qu_code] = { 
            timeLeft: 0, 
            isActive: false, 
            isCompleted: true, 
            totalTime: timeLimitSec 
          };
        } else {
          newTimerStates[question.qu_code] = { 
            timeLeft: timeLimitSec, 
            isActive: true, 
            isCompleted: false, 
            totalTime: timeLimitSec 
          };
        }
      }
    });
    
    setTimerStates(newTimerStates);
    if (!isReady) setIsReady(true);
  }, [stableQuestions, isReady]);

  useEffect(() => {
    if (!isReady) return;
    
    const intervalId = setInterval(() => {
      setTimerStates(prevStates => {
        const newStates = { ...prevStates };
        let hasChanges = false;
        
        Object.keys(newStates).forEach(code => {
          const state = newStates[code];
          if (state && state.isActive && state.timeLeft > 0) {
            newStates[code] = { ...state, timeLeft: state.timeLeft - 1 };
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

  // 개발 모드에서 자동 답변 선택
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isReady) {
      const timer = setTimeout(() => {
        stableQuestions.forEach((question) => {
          if (selectedAnswers[question.qu_code]) return;
          const timerState = timerStates[question.qu_code];
          if (timerState && !timerState.isCompleted) return;
          
          const availableChoices = question.choices;
          if (availableChoices.length > 0) {
            const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
            onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
          }
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stableQuestions, selectedAnswers, onSelectChoice, timerStates, isReady]);

  // --- 개발 모드 함수들 ---
  const handleManualAutoSelect = () => {
    if (process.env.NODE_ENV === 'development') {
      stableQuestions.forEach((question) => {
        const timerState = timerStates[question.qu_code];
        if (timerState && !timerState.isCompleted) return;
        
        const availableChoices = question.choices;
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
            newStates[code] = { ...newStates[code], timeLeft: 0, isActive: false, isCompleted: true };
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
      localStorage.removeItem(`completedTimers_${currentStep}`);
      setIsReady(false); // 상태를 다시 초기화하도록 트리거
    }
  };
  
  const hasActiveTimers = Object.values(timerStates).some(state => state?.isActive);

  // --- 로딩 상태 UI ---
  if (!stableQuestions || stableQuestions.length === 0 || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">창의성 테스트 문항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">시간 제한 창의성 테스트</h1>
          <p className="text-gray-600 text-lg">주어진 시간 내에 창의적으로 사고하여 응답해보세요</p>
        </div>

        {/* 개발 모드 컨트롤 */}
        <DevControls
          onManualAutoSelect={handleManualAutoSelect}
          onForceCompleteTimer={handleForceCompleteTimer}
          onClearCompletedTimers={handleClearCompletedTimers}
          hasActiveTimers={hasActiveTimers}
        />

        {/* 문항 목록 */}
        <div className="space-y-8">
          {stableQuestions.map((question, questionIndex) => {
            const timerState = timerStates[question.qu_code] || { 
              timeLeft: 0, 
              isActive: false, 
              isCompleted: true, 
              totalTime: question.qu_time_limit_sec || 0 
            };
            const hasTimer = timerStates[question.qu_code] !== undefined;
            const isTimerActive = timerState.isActive;
            const isTimerCompleted = timerState.isCompleted;
            const shouldShowChoices = !hasTimer || isTimerCompleted; // 타이머가 없거나 완료된 경우 선택지 표시
            const shouldShowContent = !hasTimer || !isTimerCompleted; // 타이머가 없거나 진행 중인 경우 내용 표시
            const imageCount = question.qu_images?.length || 0;
            const layoutConfig = getImageLayoutConfig(imageCount);

            return (
              <div key={question.qu_code} className="bg-white rounded-xl shadow-lg border border-pink-100 overflow-hidden">
                {/* 문항 헤더 */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">문항 {questionIndex + 1}</span>
                      <span className="text-white text-sm opacity-90">{question.qu_code}</span>
                    </div>
                    {hasTimer && (
                      <div className="flex items-center space-x-3">
                        {isTimerActive && <CircularProgress progress={getTimerProgress(timerState)} size={50} />}
                        <div className="text-white text-right">
                          <div className="text-lg font-bold">{formatTime(timerState.timeLeft)}</div>
                          <div className="text-xs opacity-80">
                            {isTimerActive ? '진행 중' : isTimerCompleted ? '완료' : '대기'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 문항 내용 */}
                <div className="p-6">
                  {/* 창의성 지시문 */}
                  {shouldShowContent && question.qu_instruction && (
                    <div className="mb-6 px-5 py-4 bg-pink-50 rounded-lg border-l-4 border-pink-400">
                      <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                    </div>
                  )}

                  {/* 제시문 */}
                  {shouldShowContent && question.qu_passage && (
                    <div className="mb-6 p-6 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">제시문</h4>
                      <div className="text-slate-700 text-base leading-relaxed space-y-4">
                        {question.qu_passage.split('\n').map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 이미지 표시 */}
                  {shouldShowContent && imageCount > 0 && (
                    <div className="mb-6">
                      <div className={`${layoutConfig.maxWidth} bg-gray-50/80 p-4 rounded-2xl border border-gray-200/50 shadow-lg`}>
                        <div className={`${layoutConfig.gridCols} gap-4`}>
                          {question.qu_images!.map((img, i) => (
                            <div key={i} className="relative">
                              {/* thk04030 문항에 대한 특별 처리 */}
                              {question.qu_code === 'thk04030' && (
                                <div className="absolute top-2 left-2 w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-lg">
                                  {i + 1}
                                </div>
                              )}
                              <img 
                                src={img} 
                                alt={`문제 이미지 ${i + 1}`} 
                                className={`w-full ${layoutConfig.imageHeight} object-cover rounded-xl shadow-md`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 핵심 질문 */}
                  {shouldShowContent && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200">
                      <p className="text-xl text-slate-800 leading-relaxed font-semibold">{question.qu_text}</p>
                    </div>
                  )}

                  {/* 선택지 (타이머가 없거나 완료된 경우에만 표시) */}
                  {shouldShowChoices && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {question.choices.map((choice) => (
                        <div key={choice.an_val} className="relative group/choice">
                          <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${
                            selectedAnswers[question.qu_code] === choice.an_val 
                              ? 'bg-gradient-to-r from-pink-500 to-rose-600 opacity-75' 
                              : 'bg-gradient-to-r from-pink-400 to-rose-500'
                          }`}></div>
                          <button 
                            onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                            className={`relative w-full p-4 text-left rounded-xl font-medium transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                              selectedAnswers[question.qu_code] === choice.an_val 
                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xl scale-[1.02] -translate-y-0.5' 
                                : 'bg-white/90 border-2 border-pink-200/60 text-gray-700 hover:bg-white hover:border-pink-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mr-4 ${
                                selectedAnswers[question.qu_code] === choice.an_val 
                                  ? 'bg-white text-pink-600' 
                                  : 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                              }`}>
                                {choice.an_val}
                              </div>
                              <span className="text-base leading-relaxed">{choice.an_text}</span>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 타이머 진행 중일 때 안내 메시지 */}
                  {isTimerActive && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center px-6 py-3 bg-pink-100 rounded-full">
                        <svg className="w-5 h-5 text-pink-600 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-pink-800 font-medium">시간이 종료되면 선택지가 나타납니다</span>
                      </div>
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