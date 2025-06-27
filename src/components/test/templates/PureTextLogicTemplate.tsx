import React from 'react';
import { TemplateProps } from './types';

export default function PureTextLogicTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full">
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-amber-800 font-semibold text-sm">논리적 사고 문제</span>
          </div>
        </div>
        
        {questions.map((question, questionIndex) => (
          <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
            
            {/* 문항 번호와 내용 */}
            <div className="flex items-start mb-8">
              <div className="relative group/number">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3">
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

                {/* 논리 지문 */}
                {question.qu_passage && question.qu_passage.trim() !== '' && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200/50 shadow-lg">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className="text-amber-800 font-bold text-lg">논리 전개</span>
                    </div>
                    <div className="bg-white/70 rounded-xl p-6 border border-amber-100">
                      <div 
                        className="text-slate-800 text-lg leading-8 tracking-wide font-medium"
                        style={{ lineHeight: '2rem' }}
                        dangerouslySetInnerHTML={{ __html: question.qu_passage }}
                      />
                    </div>
                  </div>
                )}

                {/* 지시문 */}
                {question.qu_instruction && (
                  <div className="mt-6 px-5 py-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-yellow-800 font-bold text-sm">논리 지시문</span>
                    </div>
                    <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                  </div>
                )}

                {/* 핵심 질문 */}
                <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-amber-800 font-bold text-lg">논리 문제</span>
                  </div>
                  <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                </div>
              </div>
            </div>

            {/* 선택지 */}
            <div className="grid grid-cols-1 gap-4 ml-20">
              {question.choices.map((choice) => (
                <div key={choice.an_val} className="relative group/choice">
                  <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${
                    selectedAnswers[question.qu_code] === choice.an_val 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 opacity-75' 
                      : 'bg-gradient-to-r from-amber-400 to-yellow-500'
                  }`}></div>
                  <button 
                    onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                    className={`relative w-full p-4 text-left rounded-xl font-medium transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                      selectedAnswers[question.qu_code] === choice.an_val 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xl scale-[1.02] -translate-y-0.5' 
                        : 'bg-white/90 border-2 border-amber-200/60 text-gray-700 hover:bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mr-4 mt-1 ${
                        selectedAnswers[question.qu_code] === choice.an_val 
                          ? 'bg-white text-amber-600' 
                          : 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white'
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