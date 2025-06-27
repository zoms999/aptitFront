import React from 'react';
import { TemplateProps } from './types';

export default function SimpleImageChoiceTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  // 이미지 개수에 따른 레이아웃 설정 함수
  const getImageLayoutConfig = (imageCount: number) => {
    if (imageCount === 1) {
      return {
        gridCols: 'grid-cols-1',
        imageHeight: 'h-80 md:h-96 lg:h-[400px]',
        maxWidth: 'max-w-lg mx-auto'
      };
    } else if (imageCount === 2) {
      return {
        gridCols: 'grid-cols-1 md:grid-cols-2',
        imageHeight: 'h-64 md:h-72 lg:h-80',
        maxWidth: 'max-w-4xl mx-auto'
      };
    } else if (imageCount === 3) {
      return {
        gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        imageHeight: 'h-48 md:h-56 lg:h-64',
        maxWidth: 'max-w-6xl mx-auto'
      };
    } else if (imageCount === 4) {
      return {
        gridCols: 'grid-cols-2 lg:grid-cols-4',
        imageHeight: 'h-40 md:h-48 lg:h-56',
        maxWidth: 'max-w-7xl mx-auto'
      };
    } else if (imageCount <= 6) {
      return {
        gridCols: 'grid-cols-2 md:grid-cols-3',
        imageHeight: 'h-36 md:h-44 lg:h-48',
        maxWidth: 'max-w-6xl mx-auto'
      };
    } else {
      return {
        gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        imageHeight: 'h-32 md:h-36 lg:h-40',
        maxWidth: 'max-w-7xl mx-auto'
      };
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        
        {/* 템플릿 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-green-800 font-semibold text-sm">간단한 이미지 선택 문제</span>
          </div>
        </div>
        
        {questions.map((question, questionIndex) => {
          const imageCount = question.qu_images?.length || 0;
          const layoutConfig = getImageLayoutConfig(imageCount);
          
          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
              
              {/* 문항 번호와 내용 */}
              <div className="flex items-start mb-8">
                <div className="relative group/number">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3">
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

                  {/* 지시문 */}
                  {question.qu_instruction && (
                    <div className="mt-6 px-5 py-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-800 font-bold text-sm">지시문</span>
                      </div>
                      <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                    </div>
                  )}

                  {/* 핵심 질문 */}
                  <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                  </div>
                </div>
              </div>

              {/* 문제 이미지들 - 개수에 따른 동적 레이아웃 */}
              {question.qu_images && question.qu_images.length > 0 && (
                <div className="mb-8 ml-20">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200/50 shadow-lg">
                    {/* 이미지 개수 표시 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        이미지 {imageCount}개
                      </div>
                    </div>
                    
                    <div className={`${layoutConfig.maxWidth}`}>
                      <div className={`grid ${layoutConfig.gridCols} gap-4 ${imageCount === 1 ? 'justify-items-center' : ''}`}>
                        {question.qu_images.map((img, i) => (
                          <div key={i} className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition"></div>
                            <div className="relative bg-white rounded-xl shadow-md transform transition-transform group-hover:scale-105 p-2">
                              <div className={`w-full ${layoutConfig.imageHeight} flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden`}>
                                <img 
                                  src={img} 
                                  alt={`문제 이미지 ${i + 1}`} 
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              {/* 이미지 번호 오버레이 */}
                              <div className="absolute top-3 left-3 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 선택지 - 개수에 따른 동적 레이아웃 */}
              <div className={`grid ${
                question.choices.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                question.choices.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
                question.choices.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                question.choices.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
                'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              } gap-4 ml-20`}>
                {question.choices.map((choice) => (
                  <div key={choice.an_val} className="relative group/choice">
                    <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${
                      selectedAnswers[question.qu_code] === choice.an_val 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 opacity-75' 
                        : 'bg-gradient-to-r from-green-400 to-emerald-500'
                    }`}></div>
                    <button 
                      onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} 
                      className={`relative w-full p-4 text-center rounded-xl font-medium transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${
                        selectedAnswers[question.qu_code] === choice.an_val 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl scale-[1.02] -translate-y-0.5' 
                          : 'bg-white/90 border-2 border-green-200/60 text-gray-700 hover:bg-white hover:border-green-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          selectedAnswers[question.qu_code] === choice.an_val 
                            ? 'bg-white text-green-600' 
                            : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
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
          );
        })}
      </div>
    </div>
  );
} 