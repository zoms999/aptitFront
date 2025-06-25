interface Choice {
  an_val: number;
  an_text: string;
  an_wei: number;
  choice_image_path?: string;
}

interface Question {
  qu_code: string;
  qu_order: number;
  qu_image?: string;
  qu_images?: string[];
  choices: Choice[];
}

interface PreferenceTestProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  onSelectChoice: (questionCode: string, choiceValue: number, choiceWeight: number) => void;
  currentImageNumber: number;
}

export default function PreferenceTest({ 
  questions, 
  selectedAnswers, 
  onSelectChoice, 
  currentImageNumber 
}: PreferenceTestProps) {
  return (
    <>
      {/* 이미지 번호 표시 */}
      <div className="mb-8">
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg font-bold">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          이미지 {currentImageNumber}
        </div>
      </div>

      <div className="relative group mb-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
          {questions.map((question) => (
            <div key={question.qu_code}>
              {/* 헤더 섹션 */}
              <div className="flex items-center mb-10">
                <div className="relative group/number">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition duration-300"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3">
                    <span className="text-white font-bold text-xl">{question.qu_order}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">감성 반응 테스트</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    이미지를 보고 처음 떠오르는 느낌을 
                    <span className="relative inline-block mx-2">
                      <span className="relative z-10 text-rose-600 font-bold px-3 py-1 bg-rose-50 rounded-xl border border-rose-200 shadow-sm">빠르게</span>
                      <div className="absolute -inset-1 bg-rose-200 rounded-xl blur opacity-30 animate-pulse"></div>
                    </span>
                    선택해보세요.
                  </p>
                </div>
              </div>

              {/* 메인 이미지 섹션 */}
              <div className="relative group/main-image mb-10">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 rounded-3xl blur-lg opacity-20 group-hover/main-image:opacity-40 transition duration-500"></div>
                <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-lg border border-white/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <div className="w-full max-w-4xl mx-auto">
                    {question.qu_image ? (
                      <div className="relative overflow-hidden rounded-2xl shadow-2xl group/image">
                        <img 
                          src={question.qu_image} 
                          alt="검사 이미지" 
                          className="w-full h-auto transition-all duration-500 group-hover/image:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition duration-300"></div>
                      </div>
                    ) : question.qu_images && question.qu_images.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {question.qu_images.map((image, imgIndex) => (
                          <div key={imgIndex} className="relative overflow-hidden rounded-2xl shadow-2xl group/image">
                            <img 
                              src={image} 
                              alt={`검사 이미지 ${imgIndex + 1}`} 
                              className="w-full h-auto transition-all duration-500 group-hover/image:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition duration-300"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative bg-gradient-to-br from-gray-100 via-purple-50 to-pink-50 rounded-2xl p-16 text-center border border-gray-200/50">
                        <div className="relative">
                          <svg className="w-24 h-24 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 text-xl font-medium">검사 이미지</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 선택지 영역 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {question.choices.map((choice) => (
                  <div key={`${question.qu_code}-${choice.an_val}`} className="relative group/choice">
                    <div className={`absolute -inset-1 rounded-3xl blur opacity-0 group-hover/choice:opacity-60 transition duration-300 ${
                      selectedAnswers[question.qu_code] === choice.an_val
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 opacity-75'
                        : 'bg-gradient-to-r from-purple-400 to-pink-500'
                    }`}></div>
                    <button
                      onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)}
                      className={`relative w-full py-8 px-6 text-center rounded-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${
                        selectedAnswers[question.qu_code] === choice.an_val
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-2xl scale-105 -translate-y-2'
                          : 'bg-white/90 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:bg-white hover:shadow-xl hover:border-gray-300/60'
                      }`}
                    >
                      {choice.choice_image_path ? (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg group-hover/choice:shadow-xl transition-all duration-300">
                              <img 
                                src={choice.choice_image_path} 
                                alt={`선택지 ${choice.an_val}`} 
                                className="w-full h-full object-cover transition-all duration-300 group-hover/choice:scale-110"
                              />
                            </div>
                            {selectedAnswers[question.qu_code] === choice.an_val && (
                              <div className="absolute -inset-2 bg-white rounded-2xl animate-ping opacity-30"></div>
                            )}
                          </div>
                          {choice.an_text && (
                            <span className="text-lg font-semibold leading-relaxed">{choice.an_text}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-3">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                            selectedAnswers[question.qu_code] === choice.an_val
                              ? 'bg-white/20 text-white'
                              : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg'
                          }`}>
                            {choice.an_val}
                          </div>
                          <span className="text-lg font-semibold leading-relaxed">{choice.an_text}</span>
                        </div>
                      )}
                      
                      {/* 선택 표시 */}
                      {selectedAnswers[question.qu_code] === choice.an_val && (
                        <div className="absolute top-3 right-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
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
    </>
  );
} 