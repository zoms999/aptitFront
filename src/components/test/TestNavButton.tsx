interface TestNavButtonProps {
  onClick: () => void;
  isSubmitting: boolean;
}

export default function TestNavButton({ onClick, isSubmitting }: TestNavButtonProps) {
  return (
    <div className="flex justify-center mt-16">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-lg opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
        <button
          onClick={onClick}
          disabled={isSubmitting}
          className="relative px-12 py-5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-bold rounded-3xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed flex items-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 disabled:hover:scale-100 disabled:hover:translate-y-0 text-xl min-w-[200px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="relative">
                <div className="w-7 h-7 border-3 border-white/30 rounded-full mr-4"></div>
                <div className="absolute top-0 left-0 w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin mr-4"></div>
              </div>
              <span className="font-semibold">저장 중...</span>
              <div className="ml-4 flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </>
          ) : (
            <>
              <span className="font-semibold mr-4">다음 단계로</span>
              <div className="relative">
                <svg className="w-7 h-7 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute -inset-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition duration-300"></div>
              </div>
            </>
          )}
          
          {/* 버튼 내부 글로우 효과 */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
        </button>
      </div>
    </div>
  );
} 