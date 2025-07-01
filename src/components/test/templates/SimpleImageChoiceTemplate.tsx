import React, { useState, useEffect, useMemo } from 'react';
import { TemplateProps, TimerState } from './types';
import { 
  formatTime, 
  getCurrentStep, 
  getCompletedTimersFromStorage, 
  saveCompletedTimerToStorage,
} from './utils';

const PRE_TIMER_DELAY_MS = 15000; // 15초

export default function SimpleImageChoiceTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    return questions;
  }, [questions]);

  // --- 범용 타이머 상태 관리 ---
  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>({});
  const [isReady, setIsReady] = useState(false);
  const [isPreTimerActive, setIsPreTimerActive] = useState(true);

  // 타이머 초기화 로직
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
    setIsPreTimerActive(true); // 질문이 바뀔 때마다 대기 상태 재활성화
  }, [stableQuestions]);
  
  // 15초 후 타이머를 활성화하는 Effect
  useEffect(() => {
    if (!isReady || !stableQuestions.some(q => q.qu_time_limit_sec)) return;
    
    const preTimer = setTimeout(() => {
      setIsPreTimerActive(false);
      setTimerStates((prevStates) => {
        const newStates = { ...prevStates };
        Object.keys(newStates).forEach(code => {
          if (newStates[code] && !newStates[code].isCompleted) {
            newStates[code].isActive = true;
          }
        });
        return newStates;
      });
    }, PRE_TIMER_DELAY_MS);

    return () => clearTimeout(preTimer);
  }, [isReady, stableQuestions]);

  // 타이머 카운트다운 로직
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
  }, [isReady, isPreTimerActive]);

  // 개발용 타이머 스킵 함수
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

  const getImageLayoutConfig = (imageCount: number) => {
    if (imageCount === 1) return { gridCols: 'grid-cols-1', imageHeight: 'h-80 md:h-96', maxWidth: 'max-w-md' };
    if (imageCount === 2) return { gridCols: 'grid-cols-1 md:grid-cols-2', imageHeight: 'h-64 md:h-80', maxWidth: 'max-w-4xl' };
    if (imageCount <= 4) return { gridCols: 'grid-cols-2', imageHeight: 'h-48 md:h-56', maxWidth: 'max-w-4xl' };
    if (imageCount <= 6) return { gridCols: 'grid-cols-2 md:grid-cols-3', imageHeight: 'h-44 md:h-48', maxWidth: 'max-w-6xl' };
    return { gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4', imageHeight: 'h-36 md:h-40', maxWidth: 'max-w-7xl' };
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">문항을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        
        {stableQuestions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code];
          const hasTimeLimit = timerState !== undefined;
          const showChoices = !hasTimeLimit || timerState?.isCompleted;

          const specialImageDisplayCodes = ['thk04150', 'thk04390'];
          let imagesToRender = question.qu_images || [];
          if (specialImageDisplayCodes.includes(question.qu_code) && hasTimeLimit && !timerState?.isCompleted) {
            imagesToRender = imagesToRender.slice(0, 1);
          }
          
          const shouldHideImages = question.qu_code === 'thk06100' && hasTimeLimit && timerState?.isCompleted;
          
          const imageCount = imagesToRender.length;
          let layoutConfig = getImageLayoutConfig(imageCount);

          if (question.qu_code === 'thk06040' && imageCount === 3) {
            layoutConfig = { ...layoutConfig, gridCols: 'grid-cols-3', maxWidth: 'max-w-6xl' };
          }
          
          if (question.qu_code === 'thk06010') {
            layoutConfig = { ...layoutConfig, gridCols: 'grid-cols-3', maxWidth: 'max-w-6xl' };
          }
          
          const isSpecialLayout = question.qu_code === 'thk06060';
          
          const isPassageOverlayLayout = question.qu_code === 'thk06070';
          const passageLines = isPassageOverlayLayout ? question.qu_passage?.split('|') || [] : [];


          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-200/80 pt-10 mt-10' : ''}`}>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-3 md:gap-4">
                  <span className="text-2xl font-bold text-green-600 flex-shrink-0">
                    {question.qu_order}.
                  </span>
                  <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                    {question.qu_title}
                  </p>
                </div>
              </div>

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
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${timerState.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}>
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
                            <div className={`h-2.5 rounded-full transition-all duration-1000 ease-linear ${timerState.timeLeft <= 5 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(timerState.timeLeft / timerState.totalTime) * 100}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              )}
              
              {/* ✅ [수정] thk06070에 대한 특별 렌더링 블록: 텍스트를 이미지 위로 이동 */}
              {isPassageOverlayLayout ? (
                <div className="mb-8">
                  <div className={`${layoutConfig.maxWidth} mx-auto`}>
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6`}>
                      {imagesToRender.map((img, i) => (
                        <div key={i} className="flex flex-col gap-2">
                           {/* 텍스트 (이미지 위) */}
                           <div className="p-3 bg-slate-100 rounded-lg text-center h-full flex items-center justify-center">
                              <p className="text-slate-800 font-semibold text-base leading-snug">
                                {passageLines[i] || ''}
                              </p>
                            </div>
                           {/* 이미지 컨테이너 */}
                           <div className="relative group/image w-full p-2 bg-white rounded-xl shadow-md transform transition-transform hover:scale-105">
                            <div className={`w-full ${layoutConfig.imageHeight} flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden`}>
                              <img src={img} alt={`상황 이미지 ${i + 1}`} className="max-w-full max-h-full object-contain" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : isSpecialLayout ? (
                // thk06060에 대한 레이아웃
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {question.qu_passage && (
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 h-full">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">제시문</h4>
                      <div className="text-slate-700 text-base leading-relaxed space-y-2">
                        {question.qu_passage.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                      </div>
                    </div>
                  )}
                  {imagesToRender.length > 0 && (
                    <div>
                      <div className={`${layoutConfig.maxWidth} mx-auto`}>
                        <div className={`grid ${layoutConfig.gridCols} gap-4`}>
                          {imagesToRender.map((img, i) => (
                            <div key={i} className="relative group/image w-full p-2 bg-white rounded-xl shadow-md transform transition-transform hover:scale-105">
                              <div className={`w-full ${layoutConfig.imageHeight} flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden`}>
                                <img src={img} alt={`문제 이미지 ${i + 1}`} className="max-w-full max-h-full object-contain" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // 그 외 모든 문항에 대한 기본 레이아웃
                <>
                  {imagesToRender.length > 0 && (
                    <div className="mb-8">
                      <div className={`${layoutConfig.maxWidth} mx-auto`}>
                        <div className={`grid ${layoutConfig.gridCols} gap-4`}>
                          {imagesToRender.map((img, i) => (
                            <div key={i} className="relative group/image w-full p-2 bg-white rounded-xl shadow-md transform transition-transform hover:scale-105">
                              <div className={`w-full ${layoutConfig.imageHeight} flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden`}>
                                {shouldHideImages ? (
                                  <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                    <p className="text-sm font-medium">타이머 완료 - 이미지 숨김</p>
                                  </div>
                                ) : (
                                  <img src={img} alt={`문제 이미지 ${i + 1}`} className="max-w-full max-h-full object-contain" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {question.qu_passage && (
                    <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">제시문</h4>
                      <div className="text-slate-700 text-base leading-relaxed space-y-2">
                        {question.qu_passage.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {showChoices && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {question.choices.map((choice) => (
                    <button 
                      key={choice.an_val}
                      onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                      className={`w-full px-4 py-4 text-center rounded-xl font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                        selectedAnswers[question.qu_code] === choice.an_val 
                          ? 'bg-green-600 text-white shadow-lg shadow-green-500/40 transform scale-105' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className="text-lg">{choice.an_text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}