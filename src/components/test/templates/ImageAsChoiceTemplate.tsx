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

export default function ImageAsChoiceTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    
    console.log('[ImageAsChoice] 문항 로드:', questions.map(q => ({
      qu_code: q.qu_code,
      imageChoicesCount: q.choices.filter(c => c.choice_image_path).length
    })));
    
    return questions;
  }, [questions]);

  // 타이머 상태 관리 (PureTextQuestionTemplate과 동일한 로직)
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
      
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-purple-800 font-semibold text-sm">이미지 선택 문제</span>
          </div>
        </div>
        
        {stableQuestions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code];
          const hasTimeLimit = timerState !== undefined;
          const timerIsActive = hasTimeLimit && timerState?.isActive;
          const timerIsCompleted = hasTimeLimit && timerState?.isCompleted;
          const showChoices = !hasTimeLimit || timerIsCompleted;

          // 이미지 선택지 개수에 따른 그리드 클래스 결정
          const imageChoices = question.choices.filter(c => c.choice_image_path);
          const choiceGridClass = imageChoices.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 
                                 imageChoices.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                                 imageChoices.length === 4 ? 'grid-cols-2 md:grid-cols-4' :
                                 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';

          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
              
              {/* 문항 번호와 내용 */}
              <div className="flex items-start mb-8">
                <div className="relative group/number">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3">
                    <span className="text-white font-bold text-lg">{question.qu_order}</span>
                  </div>
                </div>
                
                <div className="flex-1 pt-2">
                  {/* 문제 도입부/제목 */}
                  {question.qu_title && 
                   question.qu_title.trim() !== '' && 
                   question.qu_title.trim() !== question.qu_text.trim() && (
                    <div className="mb-4">
                      <p className="text-gray-600 text-base leading-relaxed">{question.qu_title}</p>
                    </div>
                  )}

             

                  {/* 지시문 */}
                  {question.qu_instruction && (
                    <div className="mt-6 px-5 py-4 bg-pink-50 rounded-lg border-l-4 border-pink-400">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-pink-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-pink-800 font-bold text-sm">지시문</span>
                      </div>
                      <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                    </div>
                  )}

                  {/* 핵심 질문 */}
                  <div className="mt-6">
                    <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                  </div>

                  {/* 핵심 지문 */}
                  {question.qu_passage && question.qu_passage.trim() !== '' && (
                    <div className="mt-6 px-5 py-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="text-purple-800 font-bold text-sm">지문</span>
                      </div>
                      <div 
                        className="text-slate-700 text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: question.qu_passage }}
                      />
                    </div>
                  )}

                  {/* 타이머 UI */}
                  {timerIsActive && timerState && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200/50 shadow-lg">
                      <div className="flex items-center justify-center space-x-6">
                        <div className="relative">
                          <CircularProgress progress={getTimerProgress(timerState)} />
                          <div className="absolute -inset-2 bg-red-500 rounded-full animate-ping opacity-10"></div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 font-mono tracking-wider">
                            {formatTime(timerState.timeLeft)}
                          </div>
                          <div className="text-sm text-red-500 font-medium mt-2">
                            이미지 선택지는 타이머 종료 후 나타납니다
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {timerIsCompleted && (
                    <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 shadow-lg">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-700 font-bold text-base">타이머 완료!</div>
                          <div className="text-green-600 text-sm mt-1">이제 이미지를 선택하세요</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 문제 이미지들 */}
              {question.qu_images && question.qu_images.length > 0 && (
                <div className="mb-8 ml-20">
                  <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-200/50 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {question.qu_images.map((img, i) => (
                        <div key={i} className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition"></div>
                          <img 
                            src={img} 
                            alt={`문제 이미지 ${i + 1}`} 
                            className="relative w-full h-auto object-cover rounded-xl shadow-md transform transition-transform group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 이미지 선택지 */}
              {showChoices ? (
                <div className={`grid ${choiceGridClass} gap-6 ml-20`}>
                  {question.choices.map((choice) => (
                    <div key={choice.an_val} className="relative group/choice">
                      <div className={`absolute -inset-1 rounded-2xl blur opacity-0 group-hover/choice:opacity-60 transition ${
                        selectedAnswers[question.qu_code] === choice.an_val 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 opacity-75' 
                          : 'bg-gradient-to-r from-purple-400 to-pink-500'
                      }`}></div>
                      <button 
                        onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                        className={`relative w-full p-4 text-center rounded-2xl font-semibold transition-all hover:scale-105 hover:-translate-y-1 ${
                          selectedAnswers[question.qu_code] === choice.an_val 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl scale-105 -translate-y-1' 
                            : 'bg-white/90 border-2 border-purple-200/60 text-gray-700 hover:bg-white hover:border-purple-300'
                        }`}
                      >
                        {choice.choice_image_path ? (
                          <div className="flex flex-col items-center space-y-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                              selectedAnswers[question.qu_code] === choice.an_val 
                                ? 'bg-white text-purple-600' 
                                : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                            }`}>
                              {choice.an_val}
                            </div>
                            <div className="rounded-xl overflow-hidden shadow-lg">
                              <img 
                                src={choice.choice_image_path} 
                                alt={`선택지 ${choice.an_val}`} 
                                className="w-full h-32 object-cover transition-transform group-hover/choice:scale-110"
                              />
                            </div>
                            {choice.an_text && (
                              <span className="text-sm font-medium">{choice.an_text}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-row items-center justify-center h-full py-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition ${
                              selectedAnswers[question.qu_code] === choice.an_val 
                                ? 'bg-white text-purple-600' 
                                : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                            }`}>
                              {choice.an_val}
                            </div>
                            <span className="ml-3 text-sm font-medium text-left">{choice.an_text}</span>
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-20 p-8 bg-purple-50/50 rounded-2xl border border-purple-200/50 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-purple-600 font-medium">이미지 선택지는 타이머 종료 후 나타납니다</div>
                    <div className="text-purple-500 text-sm">제시된 문제를 충분히 검토하세요</div>
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