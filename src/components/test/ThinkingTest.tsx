import React, { useEffect, useState } from 'react';

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
  qu_images?: string[];
  qu_time_limit_sec?: number | null; // 시간 제한 (초), null이면 제한 없음
  choices: Choice[];
}

interface ThinkingTestProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  onSelectChoice: (questionCode: string, choiceValue: number, choiceWeight: number) => void;
}

export default function ThinkingTest({ questions, selectedAnswers, onSelectChoice }: ThinkingTestProps) {
  // 디버깅: 받은 questions 데이터 확인
  useEffect(() => {
    console.log('[ThinkingTest] 받은 questions 데이터:', questions);
    questions.forEach((q, index) => {
      console.log(`[ThinkingTest] 문항 ${index + 1} (${q.qu_code}): 시간제한 = ${q.qu_time_limit_sec}초`);
    });
  }, [questions]);

  // 각 문항별 타이머 상태 관리
  const [timerStates, setTimerStates] = useState<Record<string, {
    timeLeft: number;
    isActive: boolean;
    isCompleted: boolean;
  }>>({});

  // 초기 타이머 상태 설정
  useEffect(() => {
    const initialTimerStates: Record<string, {
      timeLeft: number;
      isActive: boolean;
      isCompleted: boolean;
    }> = {};

    questions.forEach((question) => {
      if (question.qu_time_limit_sec && question.qu_time_limit_sec > 0) {
        initialTimerStates[question.qu_code] = {
          timeLeft: question.qu_time_limit_sec,
          isActive: true,
          isCompleted: false,
        };
      }
    });

    setTimerStates(initialTimerStates);
  }, [questions]);

  // 타이머 업데이트
  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {};

    Object.keys(timerStates).forEach((questionCode) => {
      const timerState = timerStates[questionCode];
      
      if (timerState.isActive && timerState.timeLeft > 0) {
        intervals[questionCode] = setInterval(() => {
          setTimerStates(prev => {
            const newState = { ...prev };
            if (newState[questionCode] && newState[questionCode].timeLeft > 0) {
              newState[questionCode] = {
                ...newState[questionCode],
                timeLeft: newState[questionCode].timeLeft - 1,
              };
              
              // 타이머 완료 시
              if (newState[questionCode].timeLeft === 0) {
                newState[questionCode] = {
                  ...newState[questionCode],
                  isActive: false,
                  isCompleted: true,
                };
              }
            }
            return newState;
          });
        }, 1000);
      }
    });

    // 정리
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [timerStates]);

  // 개발 환경에서만 자동 답변 선택 기능
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const autoSelectAnswers = () => {
        questions.forEach((question) => {
          // 이미 답변이 선택되지 않은 문항에 대해서만 자동 선택
          if (!selectedAnswers[question.qu_code]) {
            // 시간 제한이 있는 문항은 타이머가 완료된 후에만 자동 선택
            const timerState = timerStates[question.qu_code];
            if (question.qu_time_limit_sec && timerState && !timerState.isCompleted) {
              return; // 타이머가 아직 진행 중이면 자동 선택하지 않음
            }
            
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
  }, [questions, selectedAnswers, onSelectChoice, timerStates]);

  // 수동 자동 답변 선택 함수
  const handleManualAutoSelect = () => {
    if (process.env.NODE_ENV === 'development') {
      questions.forEach((question) => {
        // 시간 제한이 있는 문항은 타이머가 완료된 후에만 자동 선택
        const timerState = timerStates[question.qu_code];
        if (question.qu_time_limit_sec && timerState && !timerState.isCompleted) {
          return;
        }
        
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

  // 시간 포맷팅 함수 (분:초)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        {questions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code];
          const hasTimeLimit = question.qu_time_limit_sec && question.qu_time_limit_sec > 0;
          const showChoices = !hasTimeLimit || (timerState && timerState.isCompleted);
          const showExplanation = !hasTimeLimit || (timerState && !timerState.isCompleted);

          // =================== 이미지 레이아웃 로직 추가 ===================
          const imageCount = question.qu_images?.length || 0;
          let imageGridClass = '';

          if (imageCount > 1) {
            switch (imageCount) {
              case 2:
                imageGridClass = 'grid-cols-1 md:grid-cols-2';
                break;
              case 3:
                imageGridClass = 'grid-cols-1 md:grid-cols-3';
                break;
              case 4:
                // 4개일 때는 2x2 그리드가 가장 이상적입니다.
                imageGridClass = 'grid-cols-2'; 
                break;
              default:
                // 5개 이상일 때는 3열 그리드로 처리하여 너무 작아지는 것을 방지합니다.
                imageGridClass = 'grid-cols-2 md:grid-cols-3';
                break;
            }
          }
          // =================== 이미지 레이아웃 로직 끝 ===================

          return (
            <div key={question.qu_code} className={`${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
              <div className="flex items-start mb-8">
                <div className="relative group/number">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition duration-300"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3">
                    <span className="text-white font-bold text-lg">{question.qu_order}</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                  
                  {/* 제시문(qu_explain) 표시 - 시간 제한이 없거나 타이머가 진행 중일 때만 표시 */}
                  {question.qu_explain && showExplanation && (
                    <div className="mt-4 p-4 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-sm">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-blue-700 font-medium text-sm">제시문</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{question.qu_explain}</p>
                    </div>
                  )}

                  {/* 시간 제한 타이머 표시 */}
                  {hasTimeLimit && timerState && timerState.isActive && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-red-50 to-orange-50 backdrop-blur-sm rounded-2xl border border-red-200/50 shadow-lg">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-red-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="absolute -inset-1 bg-red-500 rounded-full animate-ping opacity-20"></div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-red-600 font-mono">
                              {formatTime(timerState.timeLeft)}
                            </div>
                            <div className="text-sm text-red-500 font-medium mt-1">
                              보기는 타이머 종료 후 나타납니다
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 타이머 완료 알림 */}
                  {hasTimeLimit && timerState && timerState.isCompleted && (
                    <div className="mt-4 p-4 bg-green-50/80 backdrop-blur-sm rounded-xl border border-green-200/50 shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-green-700 font-medium text-sm">시간이 완료되었습니다. 이제 답안을 선택하세요.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
                            {/* 문제 이미지 - 동적 레이아웃 적용 */}
              {imageCount > 0 && (
                <div className="mb-8 ml-20">
                  <div className="bg-gray-50/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-lg">
                    {imageCount === 1 ? (
                      <img 
                        src={question.qu_images![0]} 
                        alt="문제 이미지" 
                        // 1개일 때: 중앙 정렬, 적절한 최대 너비
                        className="max-w-xl h-auto mx-auto rounded-xl shadow-md"
                      />
                    ) : (
                      // 2개 이상일 때: 동적으로 계산된 그리드 클래스 적용
                      <div className={`grid ${imageGridClass} gap-6`}>
                        {question.qu_images!.map((image, imgIndex) => (
                          <img 
                            key={imgIndex}
                            src={image} 
                            alt={`문제 이미지 ${imgIndex + 1}`} 
                            // 각 이미지는 그리드 셀을 꽉 채우도록 설정
                            className="w-full h-auto object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 선택지 영역 - 시간 제한이 없거나 타이머가 완료된 경우에만 표시 */}
              {showChoices && (
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
              )}

              {/* 시간 제한 중 보기 숨김 안내 */}
              {!showChoices && (
                <div className="ml-20 p-8 bg-gray-50/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    </div>
                    <div className="text-gray-600 font-medium">
                      보기는 타이머 종료 후 나타납니다
                    </div>
                    <div className="text-gray-500 text-sm">
                      제시된 문제를 충분히 검토하세요
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}