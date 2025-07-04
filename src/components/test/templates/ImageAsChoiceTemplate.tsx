import React, { useEffect, useState, useMemo } from 'react';
import { TemplateProps, TimerState } from './types';
import { 
  getCurrentStep, 
  getCompletedTimersFromStorage, 
  saveCompletedTimerToStorage,
  DevControls 
} from './utils';

export default function ImageAsChoiceTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    return questions;
  }, [questions]);

  // --- 타이머 상태 관리 및 로직 ---
  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>({});
  const [isReady, setIsReady] = useState(false);
  const [isPreTimerActive, setIsPreTimerActive] = useState(true);

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
          // ✅ 처음에는 비활성화 상태로 설정
          newTimerStates[question.qu_code] = { timeLeft: timeLimitSec, isActive: false, isCompleted: false, totalTime: timeLimitSec };
        }
      }
    });
    setTimerStates(newTimerStates);
    if (!isReady) setIsReady(true);
    
    // ✅ stableQuestions가 변경될 때마다 대기 상태를 다시 활성화
    setIsPreTimerActive(true);
  }, [stableQuestions, isReady]);

  // ✅ stableQuestions가 변경될 때마다 15초 대기 후 타이머 활성화
  useEffect(() => {
    // stableQuestions가 없으면 실행하지 않음
    if (!stableQuestions || stableQuestions.length === 0) return;
    
    const preTimer = setTimeout(() => {
      setIsPreTimerActive(false);
      // 15초 후 모든 타이머를 활성화
      setTimerStates(prev => {
        const newStates = { ...prev };
        Object.keys(newStates).forEach(questionCode => {
          const state = newStates[questionCode];
          if (state && !state.isCompleted) {
            newStates[questionCode] = {
              ...state,
              isActive: true
            };
          }
        });
        return newStates;
      });
    }, 15000); // 15초

    return () => clearTimeout(preTimer);
  }, [stableQuestions]); // ✅ stableQuestions 의존성 추가

  useEffect(() => {
    if (!isReady || isPreTimerActive) return;
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

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isReady) {
      const timer = setTimeout(() => {
        stableQuestions.forEach((question) => {
          if (selectedAnswers[question.qu_code]) return;
          const timerState = timerStates[question.qu_code];
          if (timerState && timerState.isActive) return;
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

  // --- 개발 모드 함수들 (변경 없음) ---
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
      <DevControls onManualAutoSelect={handleManualAutoSelect} onForceCompleteTimer={handleForceCompleteTimer} onClearCompletedTimers={handleClearCompletedTimers} hasActiveTimers={hasActiveTimers} />
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-purple-800 font-semibold text-sm">이미지 선택 문제</span>
          </div>
        </div>
        
        {stableQuestions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code];
          const hasTimeLimit = timerState !== undefined;
          const timerIsCompleted = hasTimeLimit && timerState?.isCompleted;
          const showChoices = !hasTimeLimit || timerIsCompleted;

          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-slate-100 pt-10 mt-10' : ''}`}>
              
              {/* ✅ [수정] 문항 번호와 텍스트 스타일 및 간격 조정 */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-purple-600 flex-shrink-0">
                    {question.qu_order}.
                  </span>
                  <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                    {question.qu_text}
                  </p>
                </div>
              </div>

              <div className="ml-8 md:ml-9">
                {question.qu_passage && (
                  <div className="mb-6 p-5 bg-purple-50/60 rounded-xl border border-purple-200/50">
                    <div className="text-slate-800 text-base leading-relaxed space-y-2">
                      {question.qu_passage.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* ✅ [수정] 문제 이미지(qu_images) 영역 가독성 향상 */}
                {question.qu_images && question.qu_images.length > 0 && (
                  <div className="mt-8">
                    <div className="bg-slate-50 border border-slate-200/80 p-4 sm:p-6 rounded-2xl">
                      {question.qu_code === 'thk05020' ? (
                        <div className="space-y-6">
                          {question.qu_images[0] && (
                            <div className="flex justify-center">
                              <div className="relative group max-w-2xl">
                                <img src={question.qu_images[0]} alt="메인 문제 이미지" className="w-full h-auto object-cover rounded-xl shadow-lg transition-transform group-hover:scale-105" />
                              </div>
                            </div>
                          )}
                          {question.qu_images.length > 1 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                              {question.qu_images.slice(1).map((img, i) => (
                                <div key={i + 1} className="relative group">
                                  <img src={img} alt={`선택지 이미지 ${i + 1}`} className="w-full h-auto object-cover rounded-xl shadow-md transition-transform group-hover:scale-105" />
                                  <div className="absolute top-2.5 left-2.5 z-10 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white/80">
                                    {i + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : question.qu_code === 'thk08040' ? (
                        <div className="space-y-6">
                          {/* 메인 문제 이미지 */}
                          {question.qu_images[0] && (
                            <div className="flex justify-center">
                              <div className="relative group max-w-3xl">
                                <img src={question.qu_images[0]} alt="메인 문제 이미지" className="w-full h-auto object-cover rounded-xl shadow-lg transition-transform group-hover:scale-105" />
                              </div>
                            </div>
                          )}
                          {/* 선택지 이미지들 (2x2 그리드) */}
                          {question.qu_images.length > 1 && (
                            <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
                              {question.qu_images.slice(1).map((img, i) => (
                                <div key={i + 1} className="relative group">
                                  <img src={img} alt={`선택지 이미지 ${i + 1}`} className="w-full h-auto object-cover rounded-xl shadow-md transition-transform group-hover:scale-105" />
                                  <div className="absolute top-2.5 left-2.5 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold text-base shadow-lg border-2 border-purple-600">
                                    {i + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                          {question.qu_images.map((img, i) => {
                            const isNumberedQuestion = question.qu_code === 'thk02040';
                            return (
                              <div key={i} className="relative group">
                                <img src={img} alt={`문제 이미지 ${i + 1}`} className="w-full h-auto object-cover rounded-xl shadow-md transition-transform group-hover:scale-105" />
                                {isNumberedQuestion && (
                                  <div className="absolute top-2.5 left-2.5 z-10 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white/80">
                                    {i + 1}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {showChoices ? (
                  /* ✅ [수정] 선택지(choices) 영역 가독성 향상 */
                  <div className="mt-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-1xl mx-auto">
                      {question.choices.map((choice) => {
                        const isSelected = selectedAnswers[question.qu_code] === choice.an_val;
                        return (
                          <div key={choice.an_val} className="group/choice">
                            <button 
                              onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                              className={`relative w-full p-2 sm:p-3 text-center rounded-xl font-semibold transition-all duration-200 border-2
                                ${isSelected
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-105' 
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400 hover:shadow-md'
                                }`}
                            >
                              {choice.choice_image_path ? (
                                <div className="flex flex-col items-center space-y-3">
                                  <div className="w-full rounded-lg overflow-hidden">
                                    <img src={choice.choice_image_path} alt={`선택지 ${choice.an_val}`} className="w-full h-28 object-cover transition-transform group-hover/choice:scale-105" />
                                  </div>
                                  {choice.an_text && <span className="text-base font-semibold pt-1">{choice.an_text}</span>}
                                </div>
                              ) : (
                                <div className="flex flex-row items-center justify-center h-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors
                                    ${isSelected
                                      ? 'bg-white text-purple-600'
                                      : 'bg-slate-100 text-slate-600 group-hover/choice:bg-purple-100 group-hover/choice:text-purple-600'
                                    }`}
                                  >
                                    {choice.an_val}
                                  </div>
                                  <span className="ml-3 text-base font-medium text-left">{choice.an_text}</span>
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 p-8 bg-purple-50/50 rounded-2xl border border-purple-200/50 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="text-purple-600 font-medium">이미지 선택지는 타이머 종료 후 나타납니다</div>
                      <div className="text-purple-500 text-sm">제시된 문제를 충분히 검토하세요</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}