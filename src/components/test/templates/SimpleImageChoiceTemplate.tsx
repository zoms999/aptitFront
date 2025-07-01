import React, { useState, useEffect, useMemo } from 'react';
import { TemplateProps, TimerState } from './types';
import { 
  formatTime, 
  getCurrentStep, 
  getCompletedTimersFromStorage, 
  saveCompletedTimerToStorage,
} from './utils';

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
          // ✅ 처음에는 비활성화 상태로 설정
          newTimerStates[question.qu_code] = { timeLeft: timeLimitSec, isActive: false, isCompleted: false, totalTime: timeLimitSec };
        }
      }
    });
    setTimerStates(newTimerStates);
    if (!isReady) setIsReady(true);
    
    console.log('[SimpleImageChoice] 타이머 상태 초기화:', newTimerStates);
    
    // ✅ stableQuestions가 변경될 때마다 대기 상태를 다시 활성화
    setIsPreTimerActive(true);
    console.log('[SimpleImageChoice] 대기 상태 활성화됨');
  }, [stableQuestions, isReady]);

  // ✅ stableQuestions가 변경될 때마다 15초 대기 후 타이머 활성화
  useEffect(() => {
    // stableQuestions가 없으면 실행하지 않음
    if (!stableQuestions || stableQuestions.length === 0) return;
    
    console.log('[SimpleImageChoice] 15초 대기 시작, stableQuestions:', stableQuestions.length);
    
    const preTimer = setTimeout(() => {
      console.log('[SimpleImageChoice] 15초 완료, 타이머 활성화 시작');
      setIsPreTimerActive(false);
      // 15초 후 모든 타이머를 활성화
      setTimerStates(prev => {
        const newStates = { ...prev };
        Object.keys(newStates).forEach(questionCode => {
          const state = newStates[questionCode];
          if (state && !state.isCompleted) {
            console.log(`[SimpleImageChoice] 타이머 활성화: ${questionCode}`);
            newStates[questionCode] = {
              ...state,
              isActive: true
            };
          }
        });
        return newStates;
      });
    }, 15000); // 15초

    return () => {
      console.log('[SimpleImageChoice] 타이머 정리');
      clearTimeout(preTimer);
    };
  }, [stableQuestions]); // ✅ stableQuestions 의존성 추가

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
  }, [isReady, stableQuestions, isPreTimerActive]); // ✅ isPreTimerActive 의존성 추가

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
          
          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-200/80 pt-10 mt-10' : ''}`}>
              
              {question.qu_code === 'thk06070' ? (
                <div className="flex items-center mb-8">
                  <div className="flex-shrink-0 mr-4">
                    <span className="inline-flex items-center px-4 py-2 text-base font-bold text-white bg-green-600 rounded-md" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%)' }}>
                      사고력{question.qu_order}
                    </span>
                  </div>
                  <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                    {question.qu_title}
                  </p>
                </div>
              ) : (
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
              )}

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
                    {!isPreTimerActive && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full transition-all duration-1000 ease-linear ${timerState.timeLeft <= 5 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(timerState.timeLeft / timerState.totalTime) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* ✅ [수정] 중첩 삼항 연산자로 문항별 레이아웃 분기 로직을 수정했습니다. */}
              {question.qu_code === 'thk06070' ? (
                // thk06070 레이아웃
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    {(question.qu_passage?.split('|') || []).map((situation, index) => (
                      <div key={index} className="text-center space-y-3">
                        <p className="font-semibold text-slate-800 text-base h-12 flex items-center justify-center">
                          {situation.trim()}
                        </p>
                        {imagesToRender[index] && (
                          <div className="p-2 bg-white rounded-xl shadow-md">
                            <div className="bg-slate-50 rounded-lg overflow-hidden h-40 flex items-center justify-center">
                              <img src={imagesToRender[index]} alt={situation.trim()} className="max-w-full max-h-full object-contain" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {question.qu_instruction && (
                    <div className="text-center p-4 bg-blue-50/70 rounded-lg">
                      <p className="font-semibold text-blue-800"
                        dangerouslySetInnerHTML={{ __html: question.qu_instruction.replace(/(\d+초)/g, '<span class="text-blue-600 font-bold">$1</span>')}}
                      />
                    </div>
                  )}
                </div>
              ) : question.qu_code === 'thk06060' ? (
                // thk06060 레이아웃: 제시문 왼쪽, 이미지 오른쪽
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* 왼쪽: 제시문 */}
                  <div className="w-full md:w-1/2">
                    {question.qu_passage && (
                      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 h-full">
                        <h4 className="text-lg font-bold text-slate-800 mb-4">제시문</h4>
                        <div className="text-slate-700 text-base leading-relaxed space-y-2">
                          {question.qu_passage.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* 오른쪽: 이미지 */}
                  <div className="w-full md:w-1/2">
                    {imagesToRender[0] && (
                      <div className="p-2 bg-white rounded-xl shadow-md">
                        <div className="w-full flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden">
                          <img src={imagesToRender[0]} alt="문제 이미지" className="max-w-full max-h-full object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                 // 다른 모든 문항에 대한 기본 레이아웃
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

                  {/* thk06060가 아닐 때만 제시문이 이 위치에 렌더링되도록 함 */}
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
              
              {/* 선택지는 모든 문항에 공통으로 표시 */}
              {showChoices && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
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