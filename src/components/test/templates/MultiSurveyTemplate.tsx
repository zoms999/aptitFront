import React from 'react';
import { TemplateProps } from './types';

export default function MultiSurveyTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  // ⭐️ 1. 자동 선택 버튼 클릭 시 실행될 핸들러 함수 (기능은 동일)
  const handleAutoSelect = () => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    console.log('DEV: 자동 선택 기능 실행');
    questions.forEach((question) => {
      if (question.choices && question.choices.length > 0) {
        const randomIndex = Math.floor(Math.random() * question.choices.length);
        const randomChoice = question.choices[randomIndex];
        onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
      }
    });
  };

  return (
    <div className="relative group">
      {/* ⭐️ 2. 자동 선택 버튼 (개발용) - 디자인은 그대로 유지 */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleAutoSelect}
          className="fixed bottom-5 right-5 z-50 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
          title="모든 문항에 대해 랜덤 답변을 선택합니다."
        >
          🚀 자동 선택 (Dev)
        </button>
      )}

      {/* 배경 블러 효과는 유지하여 깊이감 표현 */}
      <div className="absolute -inset-1 bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      
      {/* 메인 컨테이너 */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        
        {/* 템플릿 헤더 (좀 더 심플하게) */}
        {/* <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-slate-800">복수 문항 설문</h2>
          <p className="text-sm text-slate-500 mt-1">해당하는 답변을 선택해주세요.</p>
        </div> */}
        
        {/* 질문 목록 */}
        {questions.map((question, questionIndex) => (
          // ✅ 문제와 문제 사이 간격을 줄임 (mt-10 pt-10 -> mt-8 pt-8)
          <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-200/80 pt-8 mt-8' : ''}`}>
            
            {/* ✅ 문항 번호와 내용을 더 간결하고 모던하게 변경 */}
            <div className="flex items-start gap-3 md:gap-4 mb-6">
              <span className="text-2xl font-bold text-indigo-600 leading-tight flex-shrink-0 mt-1">
                {question.qu_order}.
              </span>
              <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                {question.qu_text}
              </p>
            </div>

            {/* ✅ 선택지: 번호 제거, 모던한 버튼 스타일 적용 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {question.choices.map((choice) => (
                <button 
                  key={choice.an_val}
                  onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                  className={`w-full p-4 text-center rounded-xl font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    selectedAnswers[question.qu_code] === choice.an_val 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 transform scale-105' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:border-transparent'
                  }`}
                >
                  <span className="text-base">{choice.an_text}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}