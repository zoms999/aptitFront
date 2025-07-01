import React, { useEffect, useState, useMemo } from 'react';
import { TemplateProps, TimerState } from './types';
import {
  formatTime,
  getCurrentStep,
  getCompletedTimersFromStorage,
  saveCompletedTimerToStorage,
  DevControls,
} from './utils';

const PRE_TIMER_DELAY_MS = 15000; // 15초

export default function TimedCreativityTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    return questions;
  }, [questions]);

  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>({});
  const [isReady, setIsReady] = useState(false);
  const [isPreTimerActive, setIsPreTimerActive] = useState(true);
  
  // --- 타이머 상태 초기화 Effect ---
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
          newTimerStates[question.qu_code] = { timeLeft: 0, isActive: false, isCompleted: true, totalTime: timeLimitSec };
        } else {
          newTimerStates[question.qu_code] = { timeLeft: timeLimitSec, isActive: false, isCompleted: false, totalTime: timeLimitSec };
        }
      }
    });
    setTimerStates(newTimerStates);
    if (!isReady) setIsReady(true);
    
    setIsPreTimerActive(true);
  }, [stableQuestions]);

  // --- 15초 대기 후 타이머 활성화 Effect ---
  useEffect(() => {
    if (!stableQuestions || stableQuestions.length === 0) return;
    
    const preTimer = setTimeout(() => {
      setIsPreTimerActive(false);
      setTimerStates(prev => {
        const newStates = { ...prev };
        Object.keys(newStates).forEach(questionCode => {
          const state = newStates[questionCode];
          if (state && !state.isCompleted) {
            newStates[questionCode] = { ...state, isActive: true };
          }
        });
        return newStates;
      });
    }, PRE_TIMER_DELAY_MS);

    return () => clearTimeout(preTimer);
  }, [stableQuestions]);

  // --- 실제 카운트다운 Effect ---
  useEffect(() => {
    if (!isReady || isPreTimerActive) return;

    const intervalId = setInterval(() => {
      setTimerStates((prevStates) => {
        const newStates = { ...prevStates };
        let hasChanges = false;
        Object.keys(newStates).forEach((code) => {
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
  }, [isReady, stableQuestions, isPreTimerActive]);

  // --- 개발용 함수들 ---
  const handleSkipTimer = (questionCode: string) => {
    if (process.env.NODE_ENV !== 'development') return;
    setTimerStates(prev => ({
      ...prev,
      [questionCode]: {
        ...prev[questionCode],
        timeLeft: 0,
        isActive: false,
        isCompleted: true,
      },
    }));
    setIsPreTimerActive(false);
    const currentStep = getCurrentStep(stableQuestions);
    saveCompletedTimerToStorage(questionCode, currentStep);
  };
  
  const handleManualAutoSelect = (): void => {
    if (process.env.NODE_ENV !== 'development') return;
    stableQuestions.forEach(q => {
      const timerState = timerStates[q.qu_code];
      if (timerState && !timerState.isCompleted) return;
      if (q.choices.length > 0 && !selectedAnswers[q.qu_code]) {
        const randomChoice = q.choices[Math.floor(Math.random() * q.choices.length)];
        onSelectChoice(q.qu_code, randomChoice.an_val, randomChoice.an_wei);
      }
    });
  };

  const handleClearCompletedTimers = (): void => {
    if (process.env.NODE_ENV !== 'development') return;
    const currentStep = getCurrentStep(stableQuestions);
    localStorage.removeItem(`completedTimers_${currentStep}`);
    setIsReady(false); 
    setTimerStates({});
  };
  
  const hasActiveTimers = Object.values(timerStates).some((state) => state?.isActive);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        <span className="ml-2 text-gray-600">문항을 불러오는 중...</span>
      </div>
    );
  }

  const getPoemParts = (passage: string) => {
    const lines = passage.split('\n').filter(line => line.trim() !== '' || line === '');
    const midPoint = Math.ceil(lines.length / 2);
    return {
      left: lines.slice(0, midPoint),
      right: lines.slice(midPoint)
    };
  };

  return (
    <div className="relative group">
       <DevControls
          onManualAutoSelect={handleManualAutoSelect}
          onForceCompleteTimer={() => stableQuestions.forEach(q => q.qu_time_limit_sec && handleSkipTimer(q.qu_code))}
          onClearCompletedTimers={handleClearCompletedTimers}
          hasActiveTimers={hasActiveTimers}
        />
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        
        {stableQuestions.map((question) => {
          const timerState = timerStates[question.qu_code];
          const hasTimeLimit = timerState !== undefined;
          const isTimerCompleted = timerState?.isCompleted;
          const showChoices = !hasTimeLimit || isTimerCompleted;
          
          const poemParts = getPoemParts(question.qu_passage || '');

          return (
            <div key={question.qu_code}>
              <div className="flex items-start gap-3 md:gap-4 mb-6">
                <span className="text-xl font-bold text-slate-800 flex-shrink-0 mt-1">
                  {question.qu_order}.
                </span>
                <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                  {question.qu_title || question.qu_text}
                </p>
              </div>

              {/* ✅ 타이머 UI 복원 및 렌더링 */}
              {hasTimeLimit && !showChoices && (
                <div className="mb-6">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl shadow-sm">
                    {isPreTimerActive ? (
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-sky-500 animate-pulse">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-sky-700">잠시 후 시작합니다</div>
                          <div className="text-sm text-gray-600">문제 내용을 미리 확인하세요.</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${timerState.isActive ? 'bg-pink-500 animate-pulse' : 'bg-gray-500'}`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                            <div className={`text-2xl font-bold ${timerState.timeLeft <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
                              {formatTime(timerState.timeLeft)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {timerState.isActive ? '제한 시간' : '시간 종료 - 답을 선택하세요'}
                            </div>
                          </div>
                        </div>
                        {process.env.NODE_ENV === 'development' && timerState.isActive && (
                          <button onClick={() => handleSkipTimer(question.qu_code)} className="px-3 py-1 bg-sky-500 text-white text-xs font-bold rounded-full shadow hover:bg-sky-600 transition-all transform hover:scale-105" title="개발용: 타이머를 즉시 종료합니다.">
                            스킵
                          </button>
                        )}
                      </div>
                    )}
                    {!isPreTimerActive && timerState.totalTime > 0 && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full transition-all duration-1000 ease-linear ${timerState.timeLeft <= 5 ? 'bg-red-500' : 'bg-pink-500'}`} style={{ width: `${(timerState.timeLeft / timerState.totalTime) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm h-full">
                    {!isTimerCompleted ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="text-slate-700 text-base leading-relaxed space-y-2">
                          {poemParts.left.map((line, lineIndex) => (
                            <p key={`left-${lineIndex}`}>{line || '\u00A0'}</p>
                          ))}
                        </div>
                        <div className="text-slate-700 text-base leading-relaxed space-y-2">
                          {poemParts.right.map((line, lineIndex) => (
                            <p key={`right-${lineIndex}`}>{line || '\u00A0'}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-center h-full min-h-[200px]">
                        <p className="text-gray-500">시간이 종료되어 지문이 가려졌습니다.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                      <div className="p-4 bg-red-100/60 border border-red-200 rounded-lg">
                        <div className="text-red-800 font-medium text-sm leading-relaxed space-y-1">
                          {question.qu_instruction?.split('\n').map((line, lineIndex) => (
                            <p key={lineIndex}>{line}</p>
                          ))}
                        </div>
                      </div>
                      
                      {isTimerCompleted && question.qu_explain && (
                        <div className="p-4 bg-blue-100/60 border border-blue-200 rounded-lg animate-fade-in">
                          <p className="text-blue-800 font-medium text-sm">
                            답 문장 : 
                            <span className="font-bold ml-1">
                              {question.qu_explain.replace('답 문장 : (', '').replace(')', '')}
                            </span>
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {showChoices && (
                <div className="mt-8 pt-8 border-t border-gray-200 animate-fade-in">
                  <div className="mb-6">
                    <p className="text-xl text-slate-800 font-semibold">{question.qu_text}</p>

                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
                    {question.choices.map((choice) => (
                      <button
                        key={choice.an_val}
                        onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                        className={`w-full p-4 text-center rounded-xl font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
                          selectedAnswers[question.qu_code] === choice.an_val
                            ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/40 transform scale-105'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span className="text-base">{choice.an_text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}