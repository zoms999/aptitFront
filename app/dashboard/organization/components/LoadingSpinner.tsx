"use client";

import { Icons } from './icons';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg">
          <Icons.Loader className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터 로딩 중</h2>
        <p className="text-gray-600">기관 대시보드를 준비하고 있습니다...</p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}