interface TestCompletionModalProps {
  onNextStep: () => void;
  currentStep?: string;
  cr_seq?: string | number; // 검사 결과 시퀀스 번호
}

export default function TestCompletionModal({ onNextStep, currentStep = 'tnd', cr_seq }: TestCompletionModalProps) {
  const handleButtonClick = () => {
    // 마지막 단계(img)이고 cr_seq가 있으면 결과 페이지로 이동
    if (currentStep === 'img' && cr_seq) {
      window.location.href = `/test-result/${cr_seq}`;
    } else {
      // 그 외의 경우는 기존 로직 사용
      onNextStep();
    }
  };

  const getStepInfo = (step: string) => {
    switch (step) {
      case 'tnd':
        return {
          title: '성향 진단이 완료되었습니다!',
          subtitle: '이제 사고력 진단을 시작하여 종합적인 적성 분석을 완성해보세요.',
          nextText: '사고력 진단 시작',
          bgGradient: 'from-blue-500 to-blue-600',
          iconBg: 'from-blue-500 to-indigo-600'
        };
      case 'thk':
        return {
          title: '사고력 진단이 완료되었습니다!',
          subtitle: '마지막으로 선호도 진단을 통해 완전한 적성 분석을 완성해보세요.',
          nextText: '선호도 진단 시작',
          bgGradient: 'from-purple-500 to-purple-600',
          iconBg: 'from-purple-500 to-pink-600'
        };
      case 'img':
        return {
          title: '모든 진단이 완료되었습니다!',
          subtitle: '종합적인 적성 분석 결과를 확인해보세요.',
          nextText: '결과 확인하기',
          bgGradient: 'from-green-500 to-emerald-600',
          iconBg: 'from-green-500 to-emerald-600'
        };
      default:
        return {
          title: '진단이 완료되었습니다!',
          subtitle: '다음 단계를 진행해보세요.',
          nextText: '다음 단계',
          bgGradient: 'from-blue-500 to-indigo-600',
          iconBg: 'from-blue-500 to-indigo-600'
        };
    }
  };

  const stepInfo = getStepInfo(currentStep);
  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center p-16 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-300">
        <div className="mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br ${stepInfo.iconBg} rounded-full shadow-xl mb-6 animate-pulse`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h2 className="text-4xl font-bold mb-6 text-gray-900">{stepInfo.title}</h2>
        <p className="text-xl mb-10 text-gray-600 max-w-md mx-auto leading-relaxed">
          {stepInfo.subtitle}
        </p>
        <button
          onClick={handleButtonClick}
          className={`px-8 py-4 bg-gradient-to-r ${stepInfo.bgGradient} text-white font-bold rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center shadow-xl`}
        >
          <span className="text-lg mr-3">{stepInfo.nextText}</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
} 