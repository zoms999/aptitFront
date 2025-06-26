import React, { useEffect } from 'react';

interface Choice {
  an_val: number;
  an_text: string;
  an_desc: string | null;
  an_sub: string | null;
  an_wei: number;
  choice_image_path?: string;
}

interface Question {
  qu_code: string;
  qu_filename: string;
  qu_order: number;
  qu_title?: string;
  qu_passage?: string;
  qu_instruction?: string;
  qu_text: string;
  qu_explain?: string;
  qu_category: string;
  qu_action: string;
  qu_time_limit_sec?: number | null;
  qu_images?: string[];
  choices: Choice[];
}

interface PersonalityTestProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  onSelectChoice: (questionCode: string, choiceValue: number, choiceWeight: number) => void;
}

export default function PersonalityTest({ questions, selectedAnswers, onSelectChoice }: PersonalityTestProps) {
  // 기본 옵션 (API에서 choices가 없을 경우 fallback)
  const defaultOptions = [
    { value: 1, text: '매우 그렇다', color: 'from-emerald-500 to-green-600', icon: '😊', emoji: '💯', weight: 0 },
    { value: 2, text: '그렇다', color: 'from-blue-500 to-blue-600', icon: '🙂', emoji: '👍', weight: 0 },
    { value: 3, text: '약간 그렇다', color: 'from-indigo-500 to-indigo-600', icon: '😐', emoji: '👌', weight: 0 },
    { value: 4, text: '별로 그렇지 않다', color: 'from-amber-500 to-orange-600', icon: '😕', emoji: '🤔', weight: 0 },
    { value: 5, text: '그렇지 않다', color: 'from-red-500 to-red-600', icon: '😞', emoji: '👎', weight: 0 },
    { value: 6, text: '전혀 그렇지 않다', color: 'from-gray-500 to-gray-600', icon: '😤', emoji: '❌', weight: 0 }
  ];

  // 선택지를 동적으로 생성하는 함수
  const getOptionsForQuestion = (question: Question) => {
    if (question.choices && question.choices.length > 0) {
      return question.choices.map((choice, index) => ({
        value: choice.an_val,
        text: choice.an_text,
        weight: choice.an_wei,
        color: defaultOptions[index % defaultOptions.length]?.color || 'from-gray-500 to-gray-600',
        icon: defaultOptions[index % defaultOptions.length]?.icon || '😐',
        emoji: defaultOptions[index % defaultOptions.length]?.emoji || '⭐'
      }));
    }
    return defaultOptions;
  };

  // 질문 텍스트를 생성하는 함수
  const getQuestionText = (question: Question) => {
    // qu_title이 있으면 우선 사용, 없으면 qu_text 사용
    if (question.qu_title && question.qu_title.trim() !== '') {
      return question.qu_title;
    }
    return question.qu_text || question.qu_explain || '질문 텍스트가 없습니다.';
  };

  // 개발 환경에서만 자동 답변 선택 기능
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const autoSelectAnswers = () => {
        questions.forEach((question) => {
          // 이미 답변이 선택되지 않은 문항에 대해서만 자동 선택
          if (!selectedAnswers[question.qu_code]) {
            // 해당 문항의 선택지 옵션 가져오기
            const options = getOptionsForQuestion(question);
            
            // 성향 진단의 경우 중간 값 위주로 선택 (2, 3, 4 중에서 랜덤)
            const preferredValues = options.length >= 4 
              ? [2, 3, 4].filter(val => val <= options.length)
              : [Math.ceil(options.length / 2)]; // 선택지가 적을 경우 중간값
            const randomValue = preferredValues[Math.floor(Math.random() * preferredValues.length)];
            
            // weight 값 찾기
            const selectedOption = options.find(opt => opt.value === randomValue);
            const weight = selectedOption?.weight || 0;
            
            console.log(`[자동 답변] 문항 ${question.qu_code}: 선택지 ${randomValue} 자동 선택 (weight: ${weight})`);
            onSelectChoice(question.qu_code, randomValue, weight);
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
        // 해당 문항의 선택지 옵션 가져오기
        const options = getOptionsForQuestion(question);
        
        // 성향 진단의 경우 중간 값 위주로 선택 (2, 3, 4 중에서 랜덤)
        const preferredValues = options.length >= 4 
          ? [2, 3, 4].filter(val => val <= options.length)
          : [Math.ceil(options.length / 2)]; // 선택지가 적을 경우 중간값
        const randomValue = preferredValues[Math.floor(Math.random() * preferredValues.length)];
        
        // weight 값 찾기
        const selectedOption = options.find(opt => opt.value === randomValue);
        const weight = selectedOption?.weight || 0;
        
        console.log(`[수동 자동 답변] 문항 ${question.qu_code}: 선택지 ${randomValue} 선택 (weight: ${weight})`);
        onSelectChoice(question.qu_code, randomValue, weight);
      });
    }
  };

  // 디버깅용 로그
  console.log('[PersonalityTest] 받은 questions:', questions.length, '개');
  questions.forEach((q, idx) => {
    if (idx < 3) { // 처음 3개만 로그
      console.log(`[PersonalityTest] 문항 ${idx + 1}:`, {
        qu_code: q.qu_code,
        qu_title: q.qu_title,
        qu_text: q.qu_text,
        choices_count: q.choices?.length || 0
      });
    }
  });

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">문항을 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* 개발 환경에서만 표시되는 자동 답변 안내 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 text-sm font-medium">
                개발 모드: 성향 진단 자동 답변이 1초 후 적용됩니다. (총 {questions.length}개 문항)
              </span>
            </div>
            <button
              onClick={handleManualAutoSelect}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
            >
              지금 자동 선택
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        {questions.map((question, questionIndex) => {
          const questionText = getQuestionText(question);
          const options = getOptionsForQuestion(question);
          
          return (
            <div key={question.qu_code} className={`${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
              <div className="flex items-start mb-8">
                <div className="relative group/number">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition duration-300"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3">
                    <span className="text-white font-bold text-lg">{question.qu_order}</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  {/* qu_instruction이 있으면 표시 */}
                  {question.qu_instruction && question.qu_instruction.trim() !== '' && (
                    <p className="text-sm text-gray-600 mb-2 italic">{question.qu_instruction}</p>
                  )}
                  
                  {/* qu_passage가 있으면 표시 */}
                  {question.qu_passage && question.qu_passage.trim() !== '' && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-gray-800 leading-relaxed">{question.qu_passage}</p>
                    </div>
                  )}
                  
                  {/* 주요 질문 텍스트 */}
                  <p className="text-xl text-gray-900 leading-relaxed font-medium">{questionText}</p>
                </div>
              </div>
              
              <div className={`grid gap-4 ml-20 ${
                options.length <= 3 
                  ? 'grid-cols-1 md:grid-cols-3' 
                  : options.length <= 4 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
              }`}>
                {options.map((option) => (
                  <div key={option.value} className="relative group/option">
                    <div className={`absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover/option:opacity-60 transition duration-300 ${
                      selectedAnswers[question.qu_code] === option.value
                        ? `bg-gradient-to-r ${option.color} opacity-75`
                        : `bg-gradient-to-r ${option.color}`
                    }`}></div>
                    <button
                      onClick={() => onSelectChoice(question.qu_code, option.value, option.weight || 0)}
                      className={`relative w-full py-5 px-4 text-center rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
                        selectedAnswers[question.qu_code] === option.value
                          ? `bg-gradient-to-r ${option.color} text-white shadow-xl scale-105 -translate-y-1`
                          : 'bg-white/90 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:bg-white hover:shadow-lg hover:border-gray-300/60'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-2xl mb-1">
                          {selectedAnswers[question.qu_code] === option.value ? option.emoji : option.icon}
                        </div>
                        <div className="text-sm font-medium leading-tight">{option.text}</div>
                        <div className={`w-8 h-1 rounded-full transition-all duration-300 ${
                          selectedAnswers[question.qu_code] === option.value
                            ? 'bg-white/50'
                            : 'bg-gray-300/50'
                        }`}></div>
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