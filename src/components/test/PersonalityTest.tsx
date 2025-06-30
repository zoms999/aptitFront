import React, { useEffect } from 'react';

// TemplateProps와 같은 타입을 사용한다고 가정합니다. 필요시 경로를 맞춰주세요.
import { TemplateProps } from './types'; 

// PersonalityTestProps의 questions 타입을 TemplateProps에서 가져오도록 수정
interface PersonalityTestProps extends Omit<TemplateProps, 'testData'> {
  questions: TemplateProps['testData']['questions'];
}

export default function PersonalityTest({ questions, selectedAnswers, onSelectChoice }: PersonalityTestProps) {
  // 기본 옵션 (API에서 choices가 없을 경우 fallback)
  const defaultOptions = [
    { value: 1, text: '매우 그렇다', weight: 0 },
    { value: 2, text: '그렇다', weight: 0 },
    { value: 3, text: '약간 그렇다', weight: 0 },
    { value: 4, text: '별로 그렇지 않다', weight: 0 },
    { value: 5, text: '그렇지 않다', weight: 0 },
    { value: 6, text: '전혀 그렇지 않다', weight: 0 }
  ];

  const getOptionsForQuestion = (question: PersonalityTestProps['questions'][0]) => {
    if (question.choices && question.choices.length > 0) {
      return question.choices.map((choice) => ({
        value: choice.an_val,
        text: choice.an_text,
        weight: choice.an_wei,
      }));
    }
    return defaultOptions;
  };
  
  const getQuestionText = (question: PersonalityTestProps['questions'][0]) => {
    if (question.qu_title && question.qu_title.trim() !== '') {
      return question.qu_title;
    }
    return question.qu_text || question.qu_explain || '질문 텍스트가 없습니다.';
  };

  // 개발 환경 자동 답변 로직 (변경 없음)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const autoSelectAnswers = () => {
        questions.forEach((question) => {
          if (!selectedAnswers[question.qu_code]) {
            const options = getOptionsForQuestion(question);
            const preferredValues = options.length >= 4 
              ? [2, 3, 4].filter(val => val <= options.length)
              : [Math.ceil(options.length / 2)]; 
            const randomValue = preferredValues[Math.floor(Math.random() * preferredValues.length)];
            const selectedOption = options.find(opt => opt.value === randomValue);
            const weight = selectedOption?.weight || 0;
            onSelectChoice(question.qu_code, randomValue, weight);
          }
        });
      };
      const timer = setTimeout(autoSelectAnswers, 1000);
      return () => clearTimeout(timer);
    }
  }, [questions, selectedAnswers, onSelectChoice]);
  
  // 수동 자동 답변 함수 (변경 없음)
  const handleManualAutoSelect = () => {
     if (process.env.NODE_ENV === 'development') {
      questions.forEach((question) => {
        const options = getOptionsForQuestion(question);
        const preferredValues = options.length >= 4 
          ? [2, 3, 4].filter(val => val <= options.length)
          : [Math.ceil(options.length / 2)];
        const randomValue = preferredValues[Math.floor(Math.random() * preferredValues.length)];
        const selectedOption = options.find(opt => opt.value === randomValue);
        const weight = selectedOption?.weight || 0;
        onSelectChoice(question.qu_code, randomValue, weight);
      });
    }
  };


  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">성향 진단 문항을 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-indigo-100 border border-indigo-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-indigo-800 text-sm font-medium">
                개발 모드: 성향 진단 자동 답변이 적용됩니다.
              </span>
            </div>
            <button onClick={handleManualAutoSelect} className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors">
              지금 자동 선택
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-10 hover:shadow-3xl transition-all duration-500">
        {questions.map((question, questionIndex) => {
          const questionText = getQuestionText(question);
          const options = getOptionsForQuestion(question);
          
          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-200/80 pt-8 mt-8' : ''}`}>
              
              {/* ✅ [수정] MultiSurveyTemplate 스타일의 문항 헤더 */}
              <div className="flex items-start gap-3 md:gap-4 mb-6">
                <span className="text-2xl font-bold text-indigo-600 leading-tight flex-shrink-0 mt-1">
                  {question.qu_order}.
                </span>
                <div className="flex-1">
                  {question.qu_instruction && (
                    <p className="text-sm text-gray-500 mb-1">{question.qu_instruction}</p>
                  )}
                  {question.qu_passage && (
                     <div className="mb-3 p-3 text-sm bg-gray-50 rounded-md border border-gray-200 text-gray-600">
                       {question.qu_passage}
                     </div>
                  )}
                  <p className="text-xl text-slate-800 leading-relaxed font-semibold">
                    {questionText}
                  </p>
                </div>
              </div>

              {/* ✅ [수정] MultiSurveyTemplate 스타일의 선택지 그리드 */}
              <div className="pl-8 md:pl-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {options.map((option) => (
                    <button 
                      key={option.value}
                      onClick={() => onSelectChoice(question.qu_code, option.value, option.weight || 0)} 
                      className={`w-full p-4 text-center rounded-xl font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        selectedAnswers[question.qu_code] === option.value 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 transform scale-105' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:border-transparent'
                      }`}
                    >
                      <span className="text-base">{option.text}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}