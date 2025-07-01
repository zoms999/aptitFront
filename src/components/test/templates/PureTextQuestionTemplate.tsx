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

const PRE_TIMER_DELAY_MS = 15000; // 15초

export default function PureTextQuestionTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    return questions;
  }, [questions]);

  // 타이머 상태 관리
  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>({});
  const [isReady, setIsReady] = useState(false);

  // --- 타이머 관련 로직 (15초 지연 포함) ---
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
        newTimerStates[question.qu_code] = {
          timeLeft: isAlreadyCompleted ? 0 : timeLimitSec,
          isActive: false, 
          isCompleted: isAlreadyCompleted,
          totalTime: timeLimitSec,
        };
      }
    });
    setTimerStates(newTimerStates);
    if (!isReady) setIsReady(true);
  }, [stableQuestions, isReady]);
  
  useEffect(() => {
    if (!isReady) return;
    const pendingTimerCodes = Object.keys(timerStates).filter(
      (code) => timerStates[code] && !timerStates[code].isActive && !timerStates[code].isCompleted
    );
    if (pendingTimerCodes.length === 0) return;

    const delayTimeoutId = setTimeout(() => {
      setTimerStates((prevStates) => {
        const newStates = { ...prevStates };
        pendingTimerCodes.forEach(code => {
          if (newStates[code]) {
            newStates[code].isActive = true;
          }
        });
        return newStates;
      });
    }, PRE_TIMER_DELAY_MS);

    return () => clearTimeout(delayTimeoutId);
  }, [isReady, timerStates]);

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

  // --- 개발 환경 관련 로직 (기존과 동일) ---
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
  
  const handleManualAutoSelect = () => { /* ... */ };
  const handleForceCompleteTimer = () => { /* ... */ };
  const handleClearCompletedTimers = () => { /* ... */ };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">문항을 불러오는 중...</span>
      </div>
    );
  }

  const hasActiveTimers = Object.values(timerStates).some(state => state.isActive);

  return (
    <div className="relative group">
      <DevControls
        onManualAutoSelect={handleManualAutoSelect}
        onForceCompleteTimer={handleForceCompleteTimer}
        onClearCompletedTimers={handleClearCompletedTimers}
        hasActiveTimers={hasActiveTimers}
      />
      
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        
        {stableQuestions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code];
          const hasTimeLimit = timerState !== undefined;
          const isTimerActive = hasTimeLimit && timerState?.isActive;
          const isTimerCompleted = hasTimeLimit && timerState?.isCompleted;
          const isDelayPhase = hasTimeLimit && !isTimerActive && !isTimerCompleted;
          const showChoices = !hasTimeLimit || isTimerCompleted;

          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
              
              <div className="flex items-baseline gap-4 md:gap-5 mb-8">
                <span className="text-2xl md:text-3xl font-bold text-indigo-600 flex-shrink-0">
                  {question.qu_order}.
                </span>
                <p className="text-xl md:text-2xl text-slate-800 leading-relaxed font-semibold">
                  {question.qu_text}
                </p>
              </div>

              <div className="pl-8 md:pl-11 space-y-6">
                {question.qu_title && 
                  question.qu_title.trim() !== '' && 
                  question.qu_title.trim() !== question.qu_text.trim() && (
                  <div>
                    <p className="text-gray-600 text-base leading-relaxed">{question.qu_title}</p>
                  </div>
                )}

                {question.qu_passage && question.qu_passage.trim() !== '' && (
                  (hasTimeLimit && isTimerCompleted) ? (
                    <div className="px-5 py-4 bg-gray-100 rounded-lg border-l-4 border-gray-400">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                        <span className="text-gray-600 font-bold text-sm">지문 검토 시간 종료</span>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span className="text-blue-800 font-bold text-sm">지문</span>
                      </div>
                      <div className="text-slate-700 text-base leading-relaxed space-y-2">
                         {question.qu_passage.split('\n').map((line, index) => (
                           <p key={index}>{line || '\u00A0'}</p>
                         ))}
                      </div>
                    </div>
                  )
                )}

                {question.qu_instruction && (
                  <div className="px-5 py-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                      <span className="text-yellow-800 font-bold text-sm">지시문</span>
                    </div>
                    <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                  </div>
                )}
                
                {isDelayPhase ? (
                  <div className={`mt-4 p-5 rounded-2xl border shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200/50`}>
                     <div className="flex items-center justify-center space-x-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-center">
                          <div className="text-gray-700 font-medium">잠시 후 타이머가 시작됩니다.</div>
                          <div className="text-gray-500 text-sm mt-1">지문을 미리 읽어보세요.</div>
                        </div>
                      </div>
                  </div>
                ) : hasTimeLimit && (
                  <div className={`mt-4 p-5 rounded-2xl border shadow-lg transition-all duration-300
                    ${isTimerActive
                      ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200/50' 
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50'}`
                  }>
                    {isTimerActive ? (
                      <div className="flex items-center justify-center space-x-6">
                        <div className="relative"><CircularProgress progress={getTimerProgress(timerState)} /></div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 font-mono tracking-wider">{formatTime(timerState.timeLeft)}</div>
                          <div className="text-sm text-red-500 font-medium mt-2">보기는 타이머 종료 후 나타납니다</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="text-center">
                          <div className="text-green-700 font-bold text-base">타이머 완료!</div>
                          <div className="text-green-600 text-sm mt-1">이제 답안을 선택하세요</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 pl-8 md:pl-11">
                {showChoices ? (
                  <div className="grid grid-cols-1 gap-3 max-w-3xl">
                    {question.choices.map((choice) => (
                      <div key={choice.an_val} className="relative group/choice">
                        <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${selectedAnswers[question.qu_code] === choice.an_val ? 'bg-gradient-to-r from-indigo-500 to-purple-600 opacity-75' : 'bg-gradient-to-r from-indigo-400 to-purple-500'}`}></div>
                        <button 
                          onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                          // ✅ [수정] 버튼 패딩 조정
                          className={`relative w-full h-full px-4 py-4 text-left rounded-xl font-semibold transition-all hover:scale-105 hover:-translate-y-1 ${selectedAnswers[question.qu_code] === choice.an_val ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl scale-105 -translate-y-1' : 'bg-white/90 border border-gray-200/60 text-gray-700 hover:bg-white'}`}
                        >
                          <div className="flex flex-row items-center">
                            {/* ✅ [수정] 아이콘-텍스트 간격 조정 */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition mr-4 ${selectedAnswers[question.qu_code] === choice.an_val ? 'bg-white text-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                              {choice.an_val}
                            </div>
                            {/* ✅ [수정] 보기 폰트 크기 변경 (sm -> base) */}
                            <span className="text-base font-medium">{choice.an_text}</span>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  null
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}