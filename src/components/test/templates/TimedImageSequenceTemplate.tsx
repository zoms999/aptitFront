import React, { useState, useEffect } from 'react';
import { TemplateProps } from './types';

// 1. 컴포넌트 이름 변경: TimedImageSequenceTemplate -> TimedProblemTemplate
export default function TimedProblemTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;
  
  const [timerStates, setTimerStates] = useState<{
    [key: string]: {
      timeLeft: number;
      isActive: boolean;
      isCompleted: boolean;
    }
  }>({});

  useEffect(() => {
    const initialStates: { [key: string]: any } = {};
    questions.forEach(question => {
      const timeLimit = question.qu_time_limit_sec || 30;
      initialStates[question.qu_code] = {
        timeLeft: timeLimit,
        isActive: true,
        isCompleted: false,
      };
    });
    setTimerStates(initialStates);
  }, [questions]);

  useEffect(() => {
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
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative group w-full max-w-7xl mx-auto">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {/* 2. UI 텍스트 일반화 */}
            <span className="text-orange-800 font-semibold text-sm">{testData.test_name || '시간 제한 문제'}</span>
          </div>
        </div>
        
        {questions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code] || { 
            timeLeft: question.qu_time_limit_sec || 30, 
            isActive: false, 
            isCompleted: false, 
          };
          
          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
              
              {/* 문항 번호와 내용 (이전과 동일) */}
              <div className="flex items-start mb-8">
                <div className="relative group/number"><div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div><div className="relative w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3"><span className="text-white font-bold text-lg">{question.qu_order}</span></div></div>
                <div className="flex-1 pt-2">
                  {question.qu_title && <div className="mb-4"><p className="text-gray-600 text-base leading-relaxed">{question.qu_title}</p></div>}
                  {question.qu_instruction && (<div className="mt-6 px-5 py-4 bg-orange-50 rounded-lg border-l-4 border-orange-400"><p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p></div>)}
                  <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200"><p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p></div>
                </div>
              </div>

              {/* 타이머 컨트롤 UI */}
              <div className="mb-8 ml-20">
                <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200/50 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${timerState.isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${timerState.timeLeft <= 5 ? 'text-red-600' : 'text-orange-700'}`}>
                        {formatTime(timerState.timeLeft)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {/* 2. UI 텍스트 일반화 */}
                        {timerState.isActive ? '제한 시간 내에 문제를 푸세요' : '시간 종료 - 답을 선택하세요'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full transition-all duration-1000 ease-linear ${timerState.timeLeft <= 5 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${(timerState.timeLeft / (question.qu_time_limit_sec || 30)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 이미지가 있을 때만 이미지 섹션을 렌더링 */}
              {timerState.isActive && question.qu_images && question.qu_images.length > 0 && (
                <div className="mb-8 ml-20">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border-2 border-orange-200/50 shadow-lg">
                    {/* 이미지 순서 기억하라는 텍스트 제거 -> qu_instruction에서 지시 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {question.qu_images.map((img, i) => (
                        <div key={i} className="relative group"><div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition"></div><div className="relative bg-white p-2 rounded-xl shadow-lg"><div className="text-center mb-2"><span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold rounded-full">{i + 1}</span></div><img src={img} alt={`문제 이미지 ${i + 1}`} className="w-full h-32 object-cover rounded-lg transform transition-transform group-hover:scale-105" /></div></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 답변 단계일 때 선택지 표시 */}
              {timerState.isCompleted && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-20 animate-fade-in">
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