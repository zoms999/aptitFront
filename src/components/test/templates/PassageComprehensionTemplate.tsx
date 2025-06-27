import React from 'react';
import { TemplateProps } from './types';

export default function PassageComprehensionTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-blue-800 font-semibold text-sm">지문 이해 문제</span>
          </div>
        </div>
        
        {questions.map((question, questionIndex) => (
          <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
            
            {/* 문항 번호와 콘텐츠 영역 */}
            <div className="flex items-start mb-8">
              <div className="relative group/number">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3">
                  <span className="text-white font-bold text-lg">{question.qu_order}</span>
                </div>
              </div>
              
              <div className="flex-1 pt-2">
                {/* 1. 문제 제목 (qu_title) */}
                {question.qu_title && (
                  <div className="mb-6">
                    <p className="text-xl text-gray-800 font-semibold leading-relaxed">{question.qu_title}</p>
                  </div>
                )}

                {/* 2. 핵심 지문 (qu_passage) */}
                {question.qu_passage && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200/50 shadow-lg">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <span className="text-blue-800 font-bold text-lg">읽기 지문</span>
                    </div>
                    <div className="bg-white/70 rounded-xl p-6 border border-blue-100">
                      <div className="text-slate-800 text-lg leading-8 tracking-wide font-medium whitespace-pre-wrap">
                        {question.qu_passage}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. 지시문 (qu_instruction) - 선택지로 이어지는 문장 */}
                {question.qu_instruction && (
                  <div className="mt-8 p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-400">
                    <p className="text-slate-700 text-lg leading-relaxed font-semibold">{question.qu_instruction}</p>
                  </div>
                )}

             
              </div>
            </div>

            {/* 선택지 - 가로 배치 */}
            <div className={`grid gap-4 ml-20 ${
              question.choices.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
              question.choices.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
              question.choices.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // 5개 이상
            }`}>
              {question.choices.map((choice) => (
                <div key={choice.an_val} className="relative group/choice">
                  <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${
                    selectedAnswers[question.qu_code] === choice.an_val 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 opacity-75' 
                      : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                  }`}></div>
                  <button 
                    onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                    className={`relative w-full p-4 text-center rounded-xl font-medium transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                      selectedAnswers[question.qu_code] === choice.an_val 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-xl scale-[1.02] -translate-y-0.5' 
                        : 'bg-white/90 border-2 border-blue-200/60 text-gray-700 hover:bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        selectedAnswers[question.qu_code] === choice.an_val 
                          ? 'bg-white text-blue-600' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white'
                      }`}>
                        {choice.an_val}
                      </div>
                      <span className="text-base leading-relaxed text-center">{choice.an_text}</span>
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