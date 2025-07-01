import React, { useState, useEffect } from 'react';
import { TemplateProps } from './types';

export default function TimedProblemTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  const [timerStates, setTimerStates] = useState<{
    [key: string]: {
      timeLeft: number;
      isActive: boolean;
      isCompleted: boolean;
    }
  }>({});

  const [isPreTimerActive, setIsPreTimerActive] = useState(true);

  // 타이머 초기화 로직
  useEffect(() => {
    const initialStates: { [key: string]: {
      timeLeft: number;
      isActive: boolean;
      isCompleted: boolean;
    } } = {};
    questions.forEach(question => {
      const timeLimit = question.qu_time_limit_sec || 30;
      initialStates[question.qu_code] = {
        timeLeft: timeLimit,
        isActive: false, // 처음에는 비활성화
        isCompleted: false,
      };
    });
    setTimerStates(initialStates);
    
    // ✅ questions가 변경될 때마다 대기 상태를 다시 활성화
    setIsPreTimerActive(true);
  }, [questions]);

  // ✅ questions가 변경될 때마다 15초 대기 후 타이머 활성화
  useEffect(() => {
    // questions가 없으면 실행하지 않음
    if (!questions || questions.length === 0) return;
    
    const preTimer = setTimeout(() => {
      setIsPreTimerActive(false);
      // 15초 후 모든 타이머를 활성화
      setTimerStates(prev => {
        const newStates = { ...prev };
        Object.keys(newStates).forEach(questionCode => {
          newStates[questionCode] = {
            ...newStates[questionCode],
            isActive: true
          };
        });
        return newStates;
      });
    }, 15000); // 15초

    return () => clearTimeout(preTimer);
  }, [questions]); // ✅ questions 의존성 추가

  // 메인 카운트다운 로직
  useEffect(() => {
    if (isPreTimerActive) return;

    const interval = setInterval(() => {
      setTimerStates(prev => {
        const newStates = { ...prev };
        Object.keys(newStates).forEach(questionCode => {
          const state = newStates[questionCode];
          if (state.isActive && state.timeLeft > 0) {
            newStates[questionCode] = { ...state, timeLeft: state.timeLeft - 1 };
          } else if (state.isActive && state.timeLeft <= 0) {
            newStates[questionCode] = { ...state, isActive: false, isCompleted: true, timeLeft: 0 };
          }
        });
        return newStates;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPreTimerActive]); 

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
  };

  const getImageLayoutConfig = (imageCount: number) => {
    if (imageCount === 1) return { gridCols: 'grid-cols-1', imageHeight: 'h-80 md:h-96', maxWidth: 'max-w-md mx-auto' };
    if (imageCount === 2) return { gridCols: 'grid-cols-1 md:grid-cols-2', imageHeight: 'h-64 md:h-80', maxWidth: 'max-w-4xl mx-auto' };
    if (imageCount <= 4) return { gridCols: 'grid-cols-2', imageHeight: 'h-48 md:h-56', maxWidth: 'max-w-4xl mx-auto' };
    if (imageCount <= 6) return { gridCols: 'grid-cols-2 md:grid-cols-3', imageHeight: 'h-44 md:h-48', maxWidth: 'max-w-6xl mx-auto' };
    return { gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4', imageHeight: 'h-36 md:h-40', maxWidth: 'max-w-7xl mx-auto' };
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        
        <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-800">{(testData.test_name as string) || '시간 제한 문제'}</h2>
            <p className="text-sm text-slate-500 mt-1">제한 시간 안에 문제를 해결해주세요.</p>
        </div>
        
        {questions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code] || { 
            timeLeft: question.qu_time_limit_sec || 30, 
            isActive: false, 
            isCompleted: false, 
          };
          
          let imagesToRender = question.qu_images || [];
          if (timerState.isCompleted) {
            if (question.qu_code === 'thk02020') {
              imagesToRender = imagesToRender.slice(1);
            } else {
              imagesToRender = [];
            }
          }
          
          const layoutConfig = getImageLayoutConfig(imagesToRender.length);

          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-200/80 pt-8 mt-8' : ''}`}>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-3 md:gap-4">
                  <span className="text-2xl font-bold text-orange-600 flex-shrink-0">
                    {question.qu_order}.
                  </span>
                  <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                    {question.qu_title || question.qu_text}
                  </p>
                </div>
              </div>

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
                    <>
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
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full transition-all duration-1000 ease-linear ${timerState.timeLeft <= 5 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${(timerState.timeLeft / (question.qu_time_limit_sec || 30)) * 100}%` }}></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {imagesToRender.length > 0 && (
                <div className="mb-8">
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

              {!isPreTimerActive && timerState.isCompleted && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  {question.choices.map((choice) => (
                    <div key={choice.an_val} className="relative group/choice">
                      <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${selectedAnswers[question.qu_code] === choice.an_val ? 'bg-gradient-to-r from-orange-500 to-red-600 opacity-75' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}></div>
                      <button onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} className={`relative w-full p-4 text-left rounded-xl font-medium transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${selectedAnswers[question.qu_code] === choice.an_val ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl scale-[1.02] -translate-y-0.5' : 'bg-white/90 border-2 border-orange-200/60 text-gray-700 hover:bg-white hover:border-orange-300'}`}>
                        <div className="flex items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mr-4 ${selectedAnswers[question.qu_code] === choice.an_val ? 'bg-white text-orange-600' : 'bg-gradient-to-br from-orange-500 to-red-600 text-white'}`}>{choice.an_val}</div><span className="text-base leading-relaxed">{choice.an_text}</span></div>
                      </button>
                    </div>
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