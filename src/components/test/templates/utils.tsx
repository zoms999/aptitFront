import React from 'react';
import { Question, TimerState } from './types';

// 원형 진행률 SVG 컴포넌트
export const CircularProgress = ({ progress, size = 100 }: { progress: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke="rgb(254 226 226)" 
          strokeWidth="8" 
          fill="transparent" 
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(239 68 68)"
          strokeWidth="8"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
};

// 시간 포맷팅 함수
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 타이머 진행률 계산
export const getTimerProgress = (timerState: TimerState): number => {
  if (!timerState || timerState.totalTime === 0) return 0;
  return ((timerState.totalTime - timerState.timeLeft) / timerState.totalTime) * 100;
};

// 현재 단계 파악 함수
export const getCurrentStep = (questions: Question[]): string => {
  if (!questions || questions.length === 0) return 'unknown';
  const firstCode = questions[0].qu_code;
  if (firstCode.startsWith('tnd')) return 'tnd';
  if (firstCode.startsWith('thk')) return 'thk'; 
  if (firstCode.startsWith('img')) return 'img';
  return 'unknown';
};

// localStorage 관련 함수들
export const getCompletedTimersFromStorage = (step: string): Record<string, boolean> => {
  try {
    const key = `completedTimers_${step}`;
    const stored = localStorage.getItem(key);
    const result = stored ? JSON.parse(stored) : {};
    console.log(`[localStorage] ${step} 단계 완료 타이머 로드:`, result);
    return result;
  } catch (error) {
    console.error(`[localStorage] ${step} 단계 완료된 타이머 로드 실패:`, error);
    return {};
  }
};

export const saveCompletedTimerToStorage = (questionCode: string, step: string) => {
  try {
    const key = `completedTimers_${step}`;
    const completed = getCompletedTimersFromStorage(step);
    completed[questionCode] = true;
    localStorage.setItem(key, JSON.stringify(completed));
    console.log(`[localStorage] ${step} 단계에 ${questionCode} 타이머 완료 상태 저장됨`);
  } catch (error) {
    console.error(`[localStorage] ${step} 단계 완료된 타이머 저장 실패:`, error);
  }
};

// 개발 모드 개선 버튼들
export const DevControls = ({ 
  onManualAutoSelect, 
  onForceCompleteTimer, 
  onClearCompletedTimers,
  hasActiveTimers 
}: {
  onManualAutoSelect: () => void;
  onForceCompleteTimer: () => void;
  onClearCompletedTimers: () => void;
  hasActiveTimers: boolean;
}) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-yellow-800 text-sm font-medium">개발 모드: 사고력 진단 자동 답변이 1.5초 후 적용됩니다.</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onManualAutoSelect} 
            className="px-3 py-1 bg-yellow-600 text-white text-xs font-medium rounded hover:bg-yellow-700"
          >
            지금 자동 선택
          </button>
          {hasActiveTimers && (
            <button 
              onClick={onForceCompleteTimer} 
              className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
            >
              모든 타이머 완료
            </button>
          )}
          <button 
            onClick={onClearCompletedTimers} 
            className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700"
          >
            타이머 초기화
          </button>
        </div>
      </div>
    </div>
  );
}; 