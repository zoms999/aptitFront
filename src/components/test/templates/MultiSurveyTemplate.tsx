import React from 'react';
import { TemplateProps } from './types';

export default function MultiSurveyTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  // ⭐️ 1. 자동 선택 버튼 클릭 시 실행될 핸들러 함수
  const handleAutoSelect = () => {
    // 안전장치: 개발 환경이 아니면 아무것도 실행하지 않음
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    console.log('DEV: 자동 선택 기능 실행');

    questions.forEach((question) => {
      // 각 문항에 선택지가 있는지 확인
      if (question.choices && question.choices.length > 0) {
        // 선택지 중 하나를 무작위로 선택
        const randomIndex = Math.floor(Math.random() * question.choices.length);
        const randomChoice = question.choices[randomIndex];
        
        // onSelectChoice 함수를 호출하여 상태 업데이트
        onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
      }
    });
  };


  return (
    <div className="relative group">
      
      {/* ⭐️ 2. 자동 선택 버튼 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleAutoSelect}
          className="fixed bottom-5 right-5 z-50 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
          title="모든 문항에 대해 랜덤 답변을 선택합니다."
        >
          🚀 자동 선택 (Dev)
        </button>
      )}

      <div className="absolute -inset-1 bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-100 to-gray-100 rounded-full">
            <svg className="w-5 h-5 text-slate-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-slate-800 font-semibold text-sm">복수 문항 설문</span>
          </div>
        </div>
        
        {questions.map((question, questionIndex) => (
          <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
            
            {/* 문항 번호와 내용 */}
            <div className="flex items-start mb-8">
              <div className="relative group/number">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-gray-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-slate-500 to-gray-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3">
                  <span className="text-white font-bold text-lg">{question.qu_order}</span>
                </div>
              </div>
              
              <div className="flex-1 pt-2">
                {/* 핵심 질문 */}
                <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                  <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                </div>
              </div>
            </div>

            {/* 선택지 - 설문 형태로 단순하게 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 ml-20">
              {question.choices.map((choice) => (
                <div key={choice.an_val} className="relative group/choice">
                  <button 
                    onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                    className={`relative w-full p-3 text-center rounded-lg font-medium transition-all hover:scale-105 ${
                      selectedAnswers[question.qu_code] === choice.an_val 
                        ? 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg scale-105' 
                        : 'bg-white border-2 border-slate-200 text-gray-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        selectedAnswers[question.qu_code] === choice.an_val 
                          ? 'bg-white text-slate-600' 
                          : 'bg-slate-500 text-white'
                      }`}>
                        {choice.an_val}
                      </div>
                      <span className="text-sm">{choice.an_text}</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}