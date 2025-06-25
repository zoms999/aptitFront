import React, { useEffect } from 'react';

// 인터페이스는 변경 없이 그대로 사용합니다.
interface Choice {
  an_val: number;
  an_text: string;
  an_desc: string | null;
  an_wei: number;
  choice_image_path?: string;
}

interface Question {
  qu_code: string;
  qu_text: string;
  qu_explain?: string;
  qu_order: number;
  qu_image?: string;
  qu_images?: string[];
  choices: Choice[];
}

interface ThinkingTestProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  onSelectChoice: (questionCode: string, choiceValue: number, choiceWeight: number) => void;
}

export default function ThinkingTest({ questions, selectedAnswers, onSelectChoice }: ThinkingTestProps) {
  // 개발 환경에서만 자동 답변 선택 기능
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const autoSelectAnswers = () => {
        questions.forEach((question) => {
          // 이미 답변이 선택되지 않은 문항에 대해서만 자동 선택
          if (!selectedAnswers[question.qu_code]) {
            // 사고력 진단의 경우 랜덤하게 선택 (1~5 중에서)
            const availableChoices = question.choices.filter(choice => choice.an_val >= 1 && choice.an_val <= 5);
            if (availableChoices.length > 0) {
              const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
              console.log(`[자동 답변] 문항 ${question.qu_code}: 선택지 ${randomChoice.an_val} 자동 선택`);
              onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
            }
          }
        });
      };

      // 컴포넌트 마운트 후 1초 뒤에 자동 선택 실행
      const timer = setTimeout(autoSelectAnswers, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [questions, selectedAnswers, onSelectChoice]);

  // 수동 자동 답변 선택 함수
  const handleManualAutoSelect = () => {
    if (process.env.NODE_ENV === 'development') {
      questions.forEach((question) => {
        // 사고력 진단의 경우 랜덤하게 선택 (1~5 중에서)
        const availableChoices = question.choices.filter(choice => choice.an_val >= 1 && choice.an_val <= 5);
        if (availableChoices.length > 0) {
          const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
          console.log(`[수동 자동 답변] 문항 ${question.qu_code}: 선택지 ${randomChoice.an_val} 선택`);
          onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
        }
      });
    }
  };

  return (
    <div className="relative group">
      {/* 개발 환경에서만 표시되는 자동 답변 안내 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-yellow-800 text-sm font-medium">
                개발 모드: 사고력 진단 자동 답변이 1초 후 적용됩니다.
              </span>
            </div>
            <button
              onClick={handleManualAutoSelect}
              className="px-3 py-1 bg-yellow-600 text-white text-xs font-medium rounded hover:bg-yellow-700 transition-colors"
            >
              지금 자동 선택
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        {questions.map((question, questionIndex) => (
          <div key={question.qu_code} className={`${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
            <div className="flex items-start mb-8">
              <div className="relative group/number">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition duration-300"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3">
                  <span className="text-white font-bold text-lg">{question.qu_order}</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                {/* --- 수정된 부분 --- */}
                {/* 
                  - 색상: text-gray-900 -> text-black (더 진한 검은색으로 변경)
                  - 굵기: font-medium -> font-semibold (더 굵게 변경)
                */}
                <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                {/* --- 수정 끝 --- */}
                
                {/* 제시문(qu_explain) 표시 */}
                {question.qu_explain && (
                  <div className="mt-4 p-4 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-blue-700 font-medium text-sm">제시문</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{question.qu_explain}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 문제 이미지 */}
            {question.qu_image && (
              <div className="mb-8 ml-20">
                <div className="bg-gray-50/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-lg">
                  <img 
                    src={question.qu_image} 
                    alt="문제 이미지" 
                    className="max-w-full h-auto mx-auto rounded-xl shadow-md"
                  />
                </div>
              </div>
            )}
            
            {question.qu_images && question.qu_images.length > 1 && (
              <div className="mb-8 ml-20">
                <div className="bg-gray-50/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {question.qu_images.map((image, imgIndex) => (
                      <img 
                        key={imgIndex}
                        src={image} 
                        alt={`문제 이미지 ${imgIndex + 1}`} 
                        className="max-w-full h-auto rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* 선택지 영역 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 ml-20">
              {question.choices.map((choice) => (
                <div key={`${question.qu_code}-${choice.an_val}`} className="relative group/choice">
                  <div className={`absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover/choice:opacity-60 transition duration-300 ${
                    selectedAnswers[question.qu_code] === choice.an_val
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 opacity-75'
                      : 'bg-gradient-to-r from-indigo-400 to-purple-500'
                  }`}></div>
                  <button
                    onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                    className={`relative w-full py-5 px-4 text-center rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
                      selectedAnswers[question.qu_code] === choice.an_val
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl scale-105 -translate-y-1'
                        : 'bg-white/90 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:bg-white hover:shadow-lg hover:border-gray-300/60'
                    }`}
                  >
                    {choice.choice_image_path ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm mb-2">
                          {choice.an_val}
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-md">
                          <img 
                            src={choice.choice_image_path} 
                            alt={`선택지 ${choice.an_val}`} 
                            className="max-w-full h-auto"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          selectedAnswers[question.qu_code] === choice.an_val
                            ? 'bg-white text-indigo-600'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        }`}>
                          {choice.an_val}
                        </div>
                        <div className="text-sm font-medium leading-tight text-center">
                          {choice.an_text}
                        </div>
                        {choice.an_desc && (
                          <div className={`text-xs leading-tight text-center ${
                            selectedAnswers[question.qu_code] === choice.an_val
                              ? 'text-white/80'
                              : 'text-gray-500'
                          }`}>
                            {choice.an_desc}
                          </div>
                        )}
                        <div className={`w-8 h-1 rounded-full transition-all duration-300 ${
                          selectedAnswers[question.qu_code] === choice.an_val
                            ? 'bg-white/50'
                            : 'bg-gray-300/50'
                        }`}></div>
                      </div>
                    )}
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