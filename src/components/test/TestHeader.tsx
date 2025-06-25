interface TestHeaderProps {
  testData: {
    test_step?: number;
    completed_pages?: number;
    total_questions?: number;
  } | null;
}

export default function TestHeader({ testData }: TestHeaderProps) {
  return (
    <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200/20 sticky top-0 z-50 shadow-lg shadow-gray-900/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* 왼쪽: 검사 정보 */}
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="w-6 h-6 mr-3 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-lg">종합검사</span>
              </div>
            </div>
            
            {/* 단계별 진행 상태 */}
            <div className="flex items-center gap-3">
              {[
                { step: 1, name: '성향진단', color: 'blue' },
                { step: 2, name: '사고력진단', color: 'indigo' },
                { step: 3, name: '선호도진단', color: 'purple' }
              ].map(({ step, name, color }) => (
                <div key={step} className={`relative group transition-all duration-300 ${
                  testData?.test_step === step ? 'scale-110' : 'hover:scale-105'
                }`}>
                  <div className={`absolute -inset-0.5 rounded-2xl blur transition duration-300 ${
                    testData?.test_step === step 
                      ? `bg-gradient-to-r from-${color}-400 to-${color}-600 opacity-75` 
                      : 'bg-gradient-to-r from-gray-200 to-gray-300 opacity-50 group-hover:opacity-75'
                  }`}></div>
                  <div className={`relative px-5 py-2.5 rounded-2xl font-semibold transition-all duration-300 ${
                    testData?.test_step === step 
                      ? `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white shadow-lg` 
                      : 'bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-700 hover:bg-gray-50/90'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mr-2.5 ${
                        testData?.test_step === step ? 'bg-white' : `bg-${color}-500`
                      }`}></div>
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 오른쪽: 진행률 */}
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-200/50 shadow-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium mb-1">진행률</div>
                    <div className="text-xl font-bold text-gray-900">
                      {testData?.completed_pages || 0}<span className="text-gray-400 text-lg">/{testData?.total_questions || 30}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 진행률 바 */}
            <div className="hidden lg:flex flex-col items-end">
              <div className="text-sm text-gray-500 font-medium mb-2">
                {Math.round(((testData?.completed_pages || 0) / (testData?.total_questions || 30)) * 100)}%
              </div>
              <div className="w-40 h-4 bg-gray-200/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{
                    width: `${Math.round(((testData?.completed_pages || 0) / (testData?.total_questions || 30)) * 100)}%`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 