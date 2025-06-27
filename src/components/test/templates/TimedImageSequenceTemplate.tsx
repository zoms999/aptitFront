import React, { useState, useEffect } from 'react';
import { TemplateProps } from './types';

export default function TimedImageSequenceTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  // 각 문항별 타이머 상태 관리
  const [timerStates, setTimerStates] = useState<{[key: string]: {
    timeLeft: number;
    isActive: boolean;
    isCompleted: boolean;
    hasStarted: boolean;
  }}>({});

  // 각 문항의 타이머 초기화
  useEffect(() => {
    const initialStates: {[key: string]: any} = {};
    questions.forEach(question => {
      const timeLimit = question.qu_time_limit_sec || 30; // 기본 30초
      initialStates[question.qu_code] = {
        timeLeft: timeLimit,
        isActive: false,
        isCompleted: false,
        hasStarted: false
      };
    });
    setTimerStates(initialStates);
  }, [questions]);

  // 타이머 시작 함수
  const startTimer = (questionCode: string) => {
    setTimerStates(prev => ({
      ...prev,
      [questionCode]: {
        ...prev[questionCode],
        isActive: true,
        hasStarted: true
      }
    }));
  };

  // 타이머 실행
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerStates(prev => {
        const newStates = { ...prev };
        
        Object.keys(newStates).forEach(questionCode => {
          const state = newStates[questionCode];
          if (state.isActive && state.timeLeft > 0) {
            newStates[questionCode] = {
              ...state,
              timeLeft: state.timeLeft - 1
            };
          } else if (state.isActive && state.timeLeft <= 0) {
            newStates[questionCode] = {
              ...state,
              isActive: false,
              isCompleted: true,
              timeLeft: 0
            };
          }
        });
        
        return newStates;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 시간 포맷팅 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-orange-800 font-semibold text-sm">시간 제한 이미지 순서 테스트</span>
          </div>
        </div>
        
        {questions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code] || { 
            timeLeft: question.qu_time_limit_sec || 30, 
            isActive: false, 
            isCompleted: false, 
            hasStarted: false 
          };
          
          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
              
              {/* 문항 번호와 내용 */}
              <div className="flex items-start mb-8">
                <div className="relative group/number">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3">
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

                  {/* 지시문 - 시간 제한 테스트는 지시문이 중요 */}
                  {question.qu_instruction && (
                    <div className="mt-6 px-5 py-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-orange-800 font-bold text-sm">시간 제한 지시문</span>
                      </div>
                      <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                    </div>
                  )}

                  {/* 핵심 질문 */}
                  <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                    <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                  </div>
                </div>
              </div>

              {/* 타이머 컨트롤 */}
              <div className="mb-8 ml-20">
                <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200/50 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        timerState.isActive ? 'bg-red-500 animate-pulse' : 
                        timerState.isCompleted ? 'bg-gray-500' : 'bg-orange-500'
                      }`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${
                          timerState.timeLeft <= 5 ? 'text-red-600' : 'text-orange-700'
                        }`}>
                          {formatTime(timerState.timeLeft)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {!timerState.hasStarted ? '시작 버튼을 눌러주세요' :
                           timerState.isActive ? '이미지 순서를 기억하세요' :
                           timerState.isCompleted ? '시간 종료 - 문제를 풀어주세요' : '대기 중'}
                        </div>
                      </div>
                    </div>
                    
                    {!timerState.hasStarted && (
                      <button
                        onClick={() => startTimer(question.qu_code)}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg"
                      >
                        시작하기
                      </button>
                    )}
                  </div>

                  {/* 진행 바 */}
                  {timerState.hasStarted && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            timerState.timeLeft <= 5 ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ 
                            width: `${((question.qu_time_limit_sec || 30) - timerState.timeLeft) / (question.qu_time_limit_sec || 30) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 문제 이미지들 - 타이머 완료 후 숨김 */}
              {question.qu_images && question.qu_images.length > 0 && (
                <div className="mb-8 ml-20">
                  <div className={`bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border-2 border-orange-200/50 shadow-lg transition-all duration-500 ${
                    timerState.isCompleted ? 'opacity-30 pointer-events-none' : ''
                  }`}>
                    {timerState.isCompleted ? (
                      <div className="text-center py-20">
                        <div className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-full font-semibold">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.757 7.757" />
                          </svg>
                          이미지가 숨겨졌습니다
                        </div>
                        <p className="text-gray-600 mt-3">기억한 순서를 바탕으로 문제를 풀어주세요</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-semibold">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            이미지 순서를 기억하세요
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {question.qu_images.map((img, i) => (
                            <div key={i} className="relative group">
                              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition"></div>
                              <div className="relative bg-white p-2 rounded-xl shadow-lg">
                                <div className="text-center mb-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold rounded-full">
                                    {i + 1}
                                  </span>
                                </div>
                                <img 
                                  src={img} 
                                  alt={`순서 ${i + 1}`} 
                                  className="w-full h-32 object-cover rounded-lg transform transition-transform group-hover:scale-105"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 선택지 - 타이머 진행 중 숨김 */}
              <div className={`transition-all duration-500 ${
                !timerState.isCompleted ? 'opacity-30 pointer-events-none' : ''
              }`}>
                {!timerState.isCompleted ? (
                  <div className="ml-20 text-center py-12">
                    <div className="inline-flex items-center px-6 py-3 bg-gray-400 text-white rounded-full font-semibold">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      타이머 완료 후 선택지가 나타납니다
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-20">
                    {question.choices.map((choice) => (
                      <div key={choice.an_val} className="relative group/choice">
                        <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${
                          selectedAnswers[question.qu_code] === choice.an_val 
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 opacity-75' 
                            : 'bg-gradient-to-r from-orange-400 to-red-500'
                        }`}></div>
                        <button 
                          onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                          className={`relative w-full p-4 text-left rounded-xl font-medium transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                            selectedAnswers[question.qu_code] === choice.an_val 
                              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl scale-[1.02] -translate-y-0.5' 
                              : 'bg-white/90 border-2 border-orange-200/60 text-gray-700 hover:bg-white hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mr-4 ${
                              selectedAnswers[question.qu_code] === choice.an_val 
                                ? 'bg-white text-orange-600' 
                                : 'bg-gradient-to-br from-orange-500 to-red-600 text-white'
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 