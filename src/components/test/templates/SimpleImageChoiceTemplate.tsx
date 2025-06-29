import React from 'react';
import { TemplateProps } from './types';

export default function SimpleImageChoiceTemplate({ testData, selectedAnswers, onSelectChoice }: TemplateProps) {
  const questions = testData.questions;

  // 이미지 개수에 따른 레이아웃 설정 함수 (변경 없음)
  const getImageLayoutConfig = (imageCount: number) => {
    if (imageCount === 1) {
      return { gridCols: 'grid-cols-1', imageHeight: 'h-80 md:h-96', maxWidth: 'max-w-md mx-auto' };
    } if (imageCount === 2) {
      return { gridCols: 'grid-cols-1 md:grid-cols-2', imageHeight: 'h-64 md:h-80', maxWidth: 'max-w-4xl mx-auto' };
    } if (imageCount <= 4) {
      return { gridCols: 'grid-cols-2', imageHeight: 'h-48 md:h-56', maxWidth: 'max-w-4xl mx-auto' };
    } if (imageCount <= 6) {
      return { gridCols: 'grid-cols-2 md:grid-cols-3', imageHeight: 'h-44 md:h-48', maxWidth: 'max-w-6xl mx-auto' };
    } 
      return { gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4', imageHeight: 'h-36 md:h-40', maxWidth: 'max-w-7xl mx-auto' };
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-slate-800">이미지 선택</h2>
          <p className="text-sm text-slate-500 mt-1">질문을 읽고 가장 적절한 답변을 선택해주세요.</p>
        </div>
        
        {questions.map((question, questionIndex) => {
          const imageCount = question.qu_images?.length || 0;
          const layoutConfig = getImageLayoutConfig(imageCount);
          
          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-200/80 pt-8 mt-8' : ''}`}>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-3 md:gap-4">
                  <span className="text-2xl font-bold text-green-600 flex-shrink-0">
                    {question.qu_order}.
                  </span>
                  <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                    {question.qu_title}
                  </p>
                </div>
                
                {question.qu_instruction && (
                  <div className="mt-4 ml-8 md:ml-9 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                  </div>
                )}
              </div>

              {question.qu_images && imageCount > 0 && (
                <div className="mb-8">
                  <div className={`${layoutConfig.maxWidth} mx-auto`}>
                    <div className={`grid ${layoutConfig.gridCols} gap-4`}>
                      {question.qu_images.map((img, i) => (
                        <div key={i} className="relative group/image w-full p-2 bg-white rounded-xl shadow-md transform transition-transform hover:scale-105">
                          <div className={`w-full ${layoutConfig.imageHeight} flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden`}>
                            <img 
                              src={img} 
                              alt={`문제 이미지 ${i + 1}`} 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {question.qu_passage && (
                <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">제시문</h4>
                  <div className="text-slate-700 text-base leading-relaxed space-y-2">
                    {question.qu_passage.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* ✅ [수정됨] flex-wrap 대신 grid를 사용하여 레이아웃을 정돈합니다. */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {question.choices.map((choice) => (
                  <button 
                    key={choice.an_val}
                    onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                    className={`w-full px-4 py-4 text-center rounded-xl font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                      selectedAnswers[question.qu_code] === choice.an_val 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/40 transform scale-105' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {/* ✅ [수정됨] whitespace-nowrap을 제거하여 텍스트가 길 경우 자연스럽게 줄바꿈 되도록 합니다. */}
                    <span className="text-lg">{choice.an_text}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}