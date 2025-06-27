import React from 'react';
import { TemplateProps } from './types';

export default function TimedCreativityTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full">
            <svg className="w-5 h-5 text-pink-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-pink-800 font-semibold text-sm">시간 제한 창의성 테스트</span>
          </div>
        </div>
        
        {questions.map((question, questionIndex) => (
          <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
            
            {/* 문항 번호와 내용 */}
            <div className="flex items-start mb-8">
              <div className="relative group/number">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3">
                  <span className="text-white font-bold text-lg">{question.qu_order}</span>
                </div>
              </div>
              
              <div className="flex-1 pt-2">
                {/* 창의성 지시문 */}
                {question.qu_instruction && (
                  <div className="mt-6 px-5 py-4 bg-pink-50 rounded-lg border-l-4 border-pink-400">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-pink-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-pink-800 font-bold text-sm">창의성 지시문</span>
                    </div>
                    <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                  </div>
                )}

                {/* 핵심 질문 */}
                <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-pink-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-pink-800 font-bold text-lg">창의적 사고</span>
                  </div>
                  <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                </div>

                {/* 창의성 테스트 안내 */}
                <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200/50 shadow-lg">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="text-rose-700 font-bold text-base">창의적 사고 문제</div>
                      <div className="text-rose-600 text-sm mt-1">자유롭게 상상하고 답하세요</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 선택지 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-20">
              {question.choices.map((choice) => (
                <div key={choice.an_val} className="relative group/choice">
                  <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${
                    selectedAnswers[question.qu_code] === choice.an_val 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 opacity-75' 
                      : 'bg-gradient-to-r from-pink-400 to-rose-500'
                  }`}></div>
                  <button 
                    onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                    className={`relative w-full p-4 text-left rounded-xl font-medium transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                      selectedAnswers[question.qu_code] === choice.an_val 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xl scale-[1.02] -translate-y-0.5' 
                        : 'bg-white/90 border-2 border-pink-200/60 text-gray-700 hover:bg-white hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mr-4 ${
                        selectedAnswers[question.qu_code] === choice.an_val 
                          ? 'bg-white text-pink-600' 
                          : 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                      }`}>
                        {choice.an_val}
                      </div>
                      <span className="text-base leading-relaxed">{choice.an_text}</span>
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