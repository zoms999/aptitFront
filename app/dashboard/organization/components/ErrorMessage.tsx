"use client";

import { Icons } from './icons';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
      </div>
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full mb-4 shadow-lg">
          <Icons.ServerCrash className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-red-600 mb-2">오류 발생</h1>
        <p className="text-gray-700 text-lg">{message}</p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onRetry}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center transform hover:scale-105"
          >
            <Icons.RefreshCw className="w-5 h-5 mr-2" />
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
}