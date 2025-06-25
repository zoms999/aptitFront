import React, { useEffect } from 'react';

interface Question {
  qu_code: string;
  qu_text: string;
  qu_order: number;
}

interface PersonalityTestProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  onSelectChoice: (questionCode: string, choiceValue: number, choiceWeight: number) => void;
}

export default function PersonalityTest({ questions, selectedAnswers, onSelectChoice }: PersonalityTestProps) {
  const options = [
    { value: 1, text: '매우 그렇다', color: 'from-emerald-500 to-green-600', icon: '😊', emoji: '💯' },
    { value: 2, text: '그렇다', color: 'from-blue-500 to-blue-600', icon: '🙂', emoji: '👍' },
    { value: 3, text: '약간 그렇다', color: 'from-indigo-500 to-indigo-600', icon: '😐', emoji: '👌' },
    { value: 4, text: '별로 그렇지 않다', color: 'from-amber-500 to-orange-600', icon: '😕', emoji: '🤔' },
    { value: 5, text: '그렇지 않다', color: 'from-red-500 to-red-600', icon: '😞', emoji: '👎' },
    { value: 6, text: '전혀 그렇지 않다', color: 'from-gray-500 to-gray-600', icon: '😤', emoji: '❌' }
  ];

  // 개발 환경에서만 자동 답변 선택 기능
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const autoSelectAnswers = () => {
        questions.forEach((question) => {
          // 이미 답변이 선택되지 않은 문항에 대해서만 자동 선택
          if (!selectedAnswers[question.qu_code]) {
            // 성향 진단의 경우 중간 값 위주로 선택 (2, 3, 4 중에서 랜덤)
            const preferredValues = [2, 3, 4];
            const randomValue = preferredValues[Math.floor(Math.random() * preferredValues.length)];
            console.log(`[자동 답변] 문항 ${question.qu_code}: 선택지 ${randomValue} 자동 선택`);
            onSelectChoice(question.qu_code, randomValue, 0);
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
        // 성향 진단의 경우 중간 값 위주로 선택 (2, 3, 4 중에서 랜덤)
        const preferredValues = [2, 3, 4];
        const randomValue = preferredValues[Math.floor(Math.random() * preferredValues.length)];
        console.log(`[수동 자동 답변] 문항 ${question.qu_code}: 선택지 ${randomValue} 선택`);
        onSelectChoice(question.qu_code, randomValue, 0);
      });
    }
  };

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
                개발 모드: 성향 진단 자동 답변이 1초 후 적용됩니다.
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
        {questions.map((question, questionIndex) => (
          <div key={question.qu_code} className={`${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
            <div className="flex items-start mb-8">
              <div className="relative group/number">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition duration-300"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3">
                  <span className="text-white font-bold text-lg">{question.qu_order}</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <p className="text-xl text-gray-900 leading-relaxed font-medium">{question.qu_text}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 ml-20">
              {options.map((option) => (
                <div key={option.value} className="relative group/option">
                  <div className={`absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover/option:opacity-60 transition duration-300 ${
                    selectedAnswers[question.qu_code] === option.value
                      ? `bg-gradient-to-r ${option.color} opacity-75`
                      : `bg-gradient-to-r ${option.color}`
                  }`}></div>
                  <button
                    onClick={() => onSelectChoice(question.qu_code, option.value, 0)}
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
        ))}
      </div>
    </div>
  );
} 