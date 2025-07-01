import React, { useEffect, useState, useMemo } from 'react';
import { TemplateProps, TimerState } from './types';
import { 
  formatTime, 
  getCurrentStep, 
  getCompletedTimersFromStorage, 
  saveCompletedTimerToStorage,
  DevControls 
} from './utils';

const HiddenContentPlaceholder = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center text-center h-full min-h-[200px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
    <div className="flex flex-col items-center space-y-3">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
        <p className="text-gray-500 font-medium">{message}</p>
    </div>
  </div>
);

export default function TimedMemoryTestTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    return questions;
  }, [questions]);

  const getImageLayoutConfig = (imageCount: number) => {
    if (imageCount === 1) {
      return { gridCols: 'grid-cols-1', imageHeight: 'h-96 md:h-[32rem]', maxWidth: 'max-w-2xl mx-auto' };
    } if (imageCount === 2) {
      return { gridCols: 'grid-cols-1 md:grid-cols-2', imageHeight: 'h-64 md:h-80', maxWidth: 'max-w-4xl mx-auto' };
    } if (imageCount <= 4) {
      return { gridCols: 'grid-cols-2', imageHeight: 'h-48 md:h-56', maxWidth: 'max-w-4xl mx-auto' };
    } if (imageCount <= 6) {
      return { gridCols: 'grid-cols-2 md:grid-cols-3', imageHeight: 'h-44 md:h-48', maxWidth: 'max-w-6xl mx-auto' };
    } 
      return { gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4', imageHeight: 'h-36 md:h-40', maxWidth: 'max-w-7xl mx-auto' };
  };

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
          newTimerStates[question.qu_code] = { timeLeft: timeLimitSec, isActive: false, isCompleted: false, totalTime: timeLimitSec };
        }
      }
    });
    setTimerStates(newTimerStates);
    if (!isReady) setIsReady(true);
    
    setIsPreTimerActive(true);
  }, [stableQuestions]);

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
    }, 15000);

    return () => clearTimeout(preTimer);
  }, [stableQuestions]);

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

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isReady && !isPreTimerActive) {
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
  }, [stableQuestions, selectedAnswers, onSelectChoice, timerStates, isReady, isPreTimerActive]);

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
  
  const handleManualAutoSelect = () => { /* ... */ };
  const handleForceCompleteTimer = () => { /* ... */ };
  const handleClearCompletedTimers = () => { /* ... */ };
  
  const hasActiveTimers = Object.values(timerStates).some(state => state?.isActive);

  if (!stableQuestions || stableQuestions.length === 0 || !isReady) {
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-teal-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-teal-600 bg-clip-text text-transparent mb-2">기억력 테스트</h1>
          <p className="text-gray-600 text-lg">주어진 정보를 기억하고 정확히 응답해보세요</p>
        </div>

        <DevControls
          onManualAutoSelect={handleManualAutoSelect}
          onForceCompleteTimer={() => stableQuestions.forEach(q => q.qu_time_limit_sec && handleSkipTimer(q.qu_code))}
          onClearCompletedTimers={handleClearCompletedTimers}
          hasActiveTimers={hasActiveTimers}
        />

        <div className="space-y-12">
          {stableQuestions.map((question, questionIndex) => {
            const timerState = timerStates[question.qu_code] || { timeLeft: 0, isActive: false, isCompleted: true, totalTime: question.qu_time_limit_sec || 0 };
            const hasTimer = timerStates[question.qu_code] !== undefined;
            const isTimerRunning = hasTimer && !timerState.isCompleted;
            const imageCount = question.qu_images?.length || 0;
            const layoutConfig = getImageLayoutConfig(imageCount);

            return (
              <div key={question.qu_code} className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden p-6 md:p-8">
                
                {/* ✅ [수정] 문항 헤더 스타일을 ImageAsChoiceTemplate과 동일하게 변경 */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-red-600 flex-shrink-0">
                      {question.qu_order}.
                    </span>
                    <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                      {question.qu_title || question.qu_text}
                    </p>
                  </div>
                </div>

                {hasTimer && (
                    <div className="mb-6">
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl shadow-sm">
                        {isPreTimerActive ? (
                            <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-sky-500 animate-pulse">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-sky-700">잠시 후 시작합니다</div>
                                <div className="text-sm text-gray-600">내용을 미리 확인하세요.</div>
                            </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${timerState.isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}>
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                <div className={`text-2xl font-bold ${timerState.timeLeft <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
                                    {formatTime(timerState.timeLeft)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {timerState.isActive ? '기억 시간' : '시간 종료 - 답을 선택하세요'}
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
                                <div className={`h-2.5 rounded-full transition-all duration-1000 ease-linear ${timerState.timeLeft <= 5 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${(timerState.timeLeft / timerState.totalTime) * 100}%` }}></div>
                            </div>
                            </div>
                        )}
                        </div>
                    </div>
                )}
                
                <div className="space-y-6">
                    {isTimerRunning ? (
                        <>
                            {question.qu_instruction && (
                                <div className="bg-gradient-to-r from-red-50 to-teal-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                                <div className="flex"><svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="text-red-700 font-medium leading-relaxed">{question.qu_instruction}</p></div>
                                </div>
                            )}
                            {imageCount > 0 && question.qu_images && (
                                <div className="mb-8"><div className={`${layoutConfig.maxWidth} mx-auto`}><div className={`grid ${layoutConfig.gridCols} gap-4`}>{question.qu_images.map((img, i) => (<div key={i} className="relative group/image w-full p-2 bg-white rounded-xl shadow-md"><div className={`w-full ${layoutConfig.imageHeight} flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden`}><img src={img} alt={`문제 이미지 ${i + 1}`} className="max-w-full max-h-full object-contain" /></div></div>))}</div></div></div>
                            )}
                            {question.qu_passage && (
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                                <div className="flex items-center mb-3"><svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg><h4 className="text-lg font-bold text-gray-800">기억해야 할 내용</h4></div>
                                <div className="text-gray-700 text-lg leading-relaxed font-medium">{question.qu_passage.split('\n').map((line, index) => (<p key={index} className="mb-2 last:mb-0">{line}</p>))}</div>
                                </div>
                            )}
                        </>
                    ) : (
                        hasTimer && <HiddenContentPlaceholder message="시간이 종료되어 내용이 가려졌습니다." />
                    )}
                </div>

                {!isTimerRunning && (
                    <div className="mt-8">
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-teal-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-teal-700 font-medium">기억 시간이 종료되었습니다. 아래 선택지에서 정답을 골라주세요.</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                            {question.choices.map((choice) => {
                                const isSelected = selectedAnswers[question.qu_code] === choice.an_val;
                                return (
                                <button key={choice.an_val} onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} className={`w-full px-5 py-4 text-center rounded-xl font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${ isSelected ? 'bg-red-600 text-white shadow-lg shadow-red-500/40 transform scale-105' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' }`}>
                                    <span className="text-base">{choice.an_text}</span>
                                </button>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}