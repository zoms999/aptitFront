import React, { useEffect, useState, useMemo } from 'react';
import { TemplateProps, TimerState } from './types';
import {
  CircularProgress,
  formatTime,
  getTimerProgress,
  getCurrentStep,
  getCompletedTimersFromStorage,
  saveCompletedTimerToStorage,
  DevControls,
} from './utils';

export default function TimedCreativityTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    return questions;
  }, [questions]);

  // --- 타이머 상태 관리 및 로직 (변경 없음) ---
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
          newTimerStates[question.qu_code] = { timeLeft: 0, isActive: false, isCompleted: true, totalTime: timeLimitSec };
        } else {
          newTimerStates[question.qu_code] = { timeLeft: timeLimitSec, isActive: true, isCompleted: false, totalTime: timeLimitSec };
        }
      }
    });
    setTimerStates(newTimerStates);
    if (!isReady) setIsReady(true);
  }, [stableQuestions, isReady]);

  useEffect(() => {
    if (!isReady) return;
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
  }, [isReady, stableQuestions]);

  // --- 개발 모드 함수들 (변경 없음) ---
  const handleManualAutoSelect = () => { /* 로직 생략 */ };
  const handleForceCompleteTimer = () => { /* 로직 생략 */ };
  const handleClearCompletedTimers = () => { /* 로직 생략 */ };

  const hasActiveTimers = Object.values(timerStates).some((state) => state?.isActive);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        <span className="ml-2 text-gray-600">문항을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="relative group">
       <DevControls
          onManualAutoSelect={handleManualAutoSelect}
          onForceCompleteTimer={handleForceCompleteTimer}
          onClearCompletedTimers={handleClearCompletedTimers}
          hasActiveTimers={hasActiveTimers}
        />
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        
        {stableQuestions.map((question) => {
          const timerState = timerStates[question.qu_code];
          const isTimerActive = timerState?.isActive;
          const isTimerCompleted = timerState?.isCompleted;

          // 'passageParts' 변수는 더 이상 필요 없으므로 삭제합니다.

          return (
            <div key={question.qu_code}>
              <div className="flex items-start gap-3 md:gap-4 mb-6">
                <span className="text-2xl font-bold text-pink-600 flex-shrink-0 mt-1">
                  {question.qu_order}.
                </span>
                <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                  다음은 안도현 시인이 쓴 ‘연탄 한 장’이라는 시의 일부분입니다.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* ✅ [수정] 시 내용을 하나의 큰 박스에 표시 (2칼럼 차지) */}
                <div className="lg:col-span-2">
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm h-full">
                    <div className="text-slate-700 text-base leading-relaxed space-y-2">
                      {question.qu_passage?.split('\n').map((line, lineIndex) => (
                        <p key={lineIndex}>{line || '\u00A0'}</p> // 빈 줄 유지를 위해   처리
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. 지시/정답 (1칼럼 차지) */}
                <div className="space-y-4">
                  {/* 지시문 (빨간색) */}
                  <div className="p-4 bg-red-100/60 border-l-4 border-red-500 rounded-r-lg">
                    <div className="text-red-800 font-medium text-sm leading-relaxed space-y-1">
                      {question.qu_instruction?.split('\n').map((line, lineIndex) => (
                        <p key={lineIndex}>{line}</p>
                      ))}
                    </div>
                  </div>
                  
                  {/* 정답 (파란색 - 타이머 종료 후 표시) */}
                  {isTimerCompleted && question.qu_explain && (
                    <div className="p-4 bg-blue-100/60 border-l-4 border-blue-500 rounded-r-lg animate-fade-in">
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
              
              {isTimerActive && (
                <div className="text-center p-8 bg-pink-50/50 rounded-2xl border-2 border-dashed border-pink-200/80">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-24 h-24">
                      <CircularProgress progress={getTimerProgress(timerState)} size={96} strokeWidth={6} color="pink" />
                      <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-pink-600">
                        {formatTime(timerState.timeLeft)}
                      </div>
                    </div>
                    <div className="text-pink-700 font-medium">시간이 종료되면 선택지가 나타납니다.</div>
                    <div className="text-pink-600 text-sm">제시된 내용을 충분히 살펴보세요.</div>
                  </div>
                </div>
              )}

              {isTimerCompleted && (
                <div className="mt-8 pt-8 border-t border-gray-200 animate-fade-in">
                  <div className="mb-6 text-center">
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

// 애니메이션을 위한 CSS (tailwind.config.js 또는 global.css에 추가)
/* 
@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
*/