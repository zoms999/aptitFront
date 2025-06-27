import React, { useEffect, useState, useMemo } from 'react';

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
  qu_title?: string;          // 문제 도입부/제목
  qu_passage?: string;        // 핵심 지문 (HTML 형식)
  qu_instruction?: string;    // 지시문 (사용자 행동 유도)
  qu_text: string;           // 핵심 질문
  qu_explain?: string;       // 설명
  qu_order: number;
  qu_images?: string[];
  qu_time_limit_sec?: number | null;
  choices: Choice[];
}

interface ThinkingTestProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  onSelectChoice: (questionCode: string, choiceValue: number, choiceWeight: number) => void;
}

// 원형 진행률 SVG 컴포넌트
const CircularProgress = ({ progress, size = 100 }: { progress: number; size?: number }) => {
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

export default function ThinkingTest({ questions, selectedAnswers, onSelectChoice }: ThinkingTestProps) {
  // useMemo는 좋은 패턴이므로 그대로 유지합니다.
  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    
          console.log('[5단계 초기화] questions prop 변경 감지 - 타이머 검증 시작:', questions.map(q => ({
        qu_code: q.qu_code,
        qu_time_limit_sec: q.qu_time_limit_sec,
        type: typeof q.qu_time_limit_sec,
        hasValidTimer: q.qu_time_limit_sec !== null && q.qu_time_limit_sec !== undefined && Number(q.qu_time_limit_sec) > 0
      })));

      // qu_passage 디버깅 로그 추가
      console.log('[qu_passage 수신 확인]:', questions.map(q => ({
        qu_code: q.qu_code,
        qu_title: q.qu_title && q.qu_title.trim() !== '' ? `있음(${q.qu_title.length}자)` : '없음/빈값',
        qu_passage: q.qu_passage && q.qu_passage.trim() !== '' ? `있음(${q.qu_passage.length}자)` : '없음/빈값',
        qu_instruction: q.qu_instruction && q.qu_instruction.trim() !== '' ? `있음(${q.qu_instruction.length}자)` : '없음/빈값',
        qu_text: q.qu_text ? `있음(${q.qu_text.length}자)` : '없음',
        raw_passage: q.qu_passage === null ? 'NULL' : q.qu_passage === undefined ? 'UNDEFINED' : `"${q.qu_passage}"`
      })));
      
      // thk06090에 대한 특별 디버깅
      const thk06090Question = questions.find(q => q.qu_code === 'thk06090');
      if (thk06090Question) {
        console.log(`🔍 [ThinkingTest.tsx thk06090] 프론트엔드 수신 상태:`, {
          qu_code: thk06090Question.qu_code,
          qu_passage_raw: thk06090Question.qu_passage,
          qu_passage_type: typeof thk06090Question.qu_passage,
          qu_passage_length: thk06090Question.qu_passage ? thk06090Question.qu_passage.length : 0,
          qu_passage_is_null: thk06090Question.qu_passage === null,
          qu_passage_is_undefined: thk06090Question.qu_passage === undefined,
          qu_passage_is_empty_string: thk06090Question.qu_passage === '',
          qu_passage_trim_length: thk06090Question.qu_passage ? thk06090Question.qu_passage.trim().length : 0,
          will_render_passage: thk06090Question.qu_passage && thk06090Question.qu_passage.trim() !== '',
          qu_passage_preview: thk06090Question.qu_passage ? thk06090Question.qu_passage.substring(0, 200) + '...' : 'null/undefined'
        });
      }
    
    // [5단계] 문항별 타이머 상태 요약
    const timersCount = questions.filter(q => q.qu_time_limit_sec !== null && q.qu_time_limit_sec !== undefined && Number(q.qu_time_limit_sec) > 0).length;
    console.log(`[5단계 요약] 전체 ${questions.length}개 문항 중 타이머 ${timersCount}개, 타이머 없음 ${questions.length - timersCount}개`);
    
    return questions;
  }, [questions]);

  // 타이머 상태 관리
  const [timerStates, setTimerStates] = useState<Record<string, {
    timeLeft: number;
    isActive: boolean;
    isCompleted: boolean;
    totalTime: number;
  }>>({});
  
  // [수정] isInitialized의 역할을 '최초 렌더링 준비 완료'로 명확히 합니다.
  const [isReady, setIsReady] = useState(false);

  // 현재 단계 파악 함수
  const getCurrentStep = (questions: Question[]): string => {
    if (!questions || questions.length === 0) return 'unknown';
    const firstCode = questions[0].qu_code;
    if (firstCode.startsWith('tnd')) return 'tnd';
    if (firstCode.startsWith('thk')) return 'thk'; 
    if (firstCode.startsWith('img')) return 'img';
    return 'unknown';
  };

  // localStorage에서 특정 단계의 완료된 타이머 상태를 로드하는 함수
  const getCompletedTimersFromStorage = (step: string): Record<string, boolean> => {
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

  // localStorage에 특정 단계의 완료된 타이머 상태를 저장하는 함수
  const saveCompletedTimerToStorage = (questionCode: string, step: string) => {
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

  // [2단계] 다음 단계 이동 시 타이머 상태 완전 재설정 (localStorage 문제 해결)
  // questions prop이 변경될 때마다 실행되지만, isReady를 false로 되돌리지 않아 깜빡임을 방지합니다.
  useEffect(() => {
    // 안정화된 문항 데이터가 없으면 아무것도 하지 않고, 준비되지 않은 상태로 둡니다.
    if (!stableQuestions || stableQuestions.length === 0) {
      console.log('[2단계] 문항 데이터가 없어 타이머 상태를 초기화합니다');
      setIsReady(false);
      setTimerStates({}); // 타이머 상태 완전 초기화
      return;
    }

    console.log('[2단계] 다음 단계 이동 - 새 문항에 대한 타이머 재설정 시작:', stableQuestions.map(q => q.qu_code));

    // 현재 단계 파악
    const currentStep = getCurrentStep(stableQuestions);
    console.log('[2단계] 현재 단계:', currentStep);

    // [핵심 수정] 새 문항이 로드될 때마다 localStorage 완료 상태를 무조건 초기화
    // 이렇게 하면 문제가 나오자마자 "타이머 완료!" 상태로 나타나는 문제가 해결됩니다.
    const key = `completedTimers_${currentStep}`;
    const existingCompleted = getCompletedTimersFromStorage(currentStep);
    
    // 현재 문항들에 해당하는 완료 상태만 제거
    let shouldClearStorage = false;
    const newCompleted = { ...existingCompleted };
    
    stableQuestions.forEach(question => {
      if (existingCompleted[question.qu_code]) {
        console.log(`🧹 [localStorage 정리] ${question.qu_code} 완료 상태 제거 (새 문항 로드)`);
        delete newCompleted[question.qu_code];
        shouldClearStorage = true;
      }
    });
    
    if (shouldClearStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(newCompleted));
        console.log(`🧹 [localStorage 정리] ${currentStep} 단계 현재 문항들의 완료 상태 초기화 완료`);
      } catch (error) {
        console.error(`[localStorage 정리] ${currentStep} 단계 저장 실패:`, error);
      }
    }

    // 정리된 완료 상태 다시 로드
    const completedTimers = getCompletedTimersFromStorage(currentStep);
    console.log(`[localStorage] ${currentStep} 단계 정리 후 완료 타이머:`, completedTimers);
    
    // 모든 localStorage 키 디버깅 (개발 모드에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [localStorage 전체 상태]');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('completedTimers_')) {
          const value = localStorage.getItem(key);
          console.log(`  ${key}: ${value}`);
        }
      }
    }

    // [핵심] 이전 타이머 상태를 완전히 초기화하고 새로 계산
    const newTimerStates: Record<string, {
      timeLeft: number;
      isActive: boolean;
      isCompleted: boolean;
      totalTime: number;
    }> = {};

    let timerCount = 0;
    let noTimerCount = 0;
    let alreadyCompletedCount = 0;

          stableQuestions.forEach((question) => {
        // [엄격한 검증] DB에서 실제 타이머 값이 있는지 확인
        const dbTimerValue = question.qu_time_limit_sec;
        const hasValidTimer = dbTimerValue !== null && 
                             dbTimerValue !== undefined && 
                             Number(dbTimerValue) > 0;
        
        // localStorage에서 이미 완료된 타이머인지 확인
        const isAlreadyCompleted = completedTimers[question.qu_code] === true;
        
        // thk02080 문제에 대한 특별 디버깅
        if (question.qu_code === 'thk02080') {
          console.log(`🔍 [thk02080 특별 디버깅] localStorage 상태:`, completedTimers);
          console.log(`🔍 [thk02080 특별 디버깅] 현재 문제 상태:`, {
            qu_code: question.qu_code,
            qu_time_limit_sec: dbTimerValue,
            type: typeof dbTimerValue,
            hasValidTimer,
            isAlreadyCompleted,
            completedTimers_key: `completedTimers_${currentStep}`,
            localStorage_value: localStorage.getItem(`completedTimers_${currentStep}`)
          });
        }
        
        console.log(`[2단계 타이머 검증] ${question.qu_code}:`, {
          qu_time_limit_sec: dbTimerValue,
          type: typeof dbTimerValue,
          hasValidTimer,
          isAlreadyCompleted,
          willCreateTimer: hasValidTimer
        });
      
      // DB에 실제 양수 타이머 값이 있을 때만 타이머 상태 생성
      if (hasValidTimer) {
        const timeLimitSec = Number(dbTimerValue);
        
        if (isAlreadyCompleted) {
          // 이미 완료된 타이머는 완료 상태로 설정
          newTimerStates[question.qu_code] = {
            timeLeft: 0,
            isActive: false,
            isCompleted: true,
            totalTime: timeLimitSec,
          };
          alreadyCompletedCount++;
          console.log(`[2단계 타이머 복원] ${question.qu_code}: 이미 완료된 타이머 (F5 대응)`);
        } else {
          // 새로운 타이머는 활성화 상태로 설정
          newTimerStates[question.qu_code] = {
            timeLeft: timeLimitSec,
            isActive: true,
            isCompleted: false,
            totalTime: timeLimitSec,
          };
          timerCount++;
          console.log(`[2단계 타이머 생성] ${question.qu_code}: ${timeLimitSec}초 타이머 활성화`);
        }
      } else {
        noTimerCount++;
        console.log(`[2단계 타이머 제외] ${question.qu_code}: 타이머 없음 (DB값: ${dbTimerValue})`);
      }
    });

    // 계산된 새 타이머 상태를 한 번에 업데이트합니다.
    console.log(`[2단계 타이머 요약] 새 타이머 ${timerCount}개, 완료된 타이머 ${alreadyCompletedCount}개, 타이머 없음 ${noTimerCount}개`);
    console.log('[2단계 타이머 상태] 최종 타이머 상태:', newTimerStates);
    setTimerStates(newTimerStates);

    // [핵심 수정] isReady가 false일 때만(즉, 최초 로드 시에만) true로 변경합니다.
    // 이렇게 하면 다음 문제로 넘어갈 때 isReady가 false로 변하지 않아 로딩 화면이 나타나지 않습니다.
    if (!isReady) {
      setIsReady(true);
      console.log('[2단계] 컴포넌트 준비 완료');
    }
    
  }, [stableQuestions, isReady]); // stableQuestions가 변경될 때마다 타이머를 재설정합니다.

  // [수정] 타이머 실행 로직은 isReady 상태에만 의존하도록 분리하여 더 명확하게 만듭니다.
  useEffect(() => {
    // 컴포넌트가 준비되지 않았으면 인터벌을 시작하지 않습니다.
    if (!isReady) {
      return;
    }

    console.log('[타이머 실행] 타이머 인터벌 시작');

    const intervalId = setInterval(() => {
      setTimerStates(prevStates => {
        const newStates = { ...prevStates };
        let hasChanges = false;
        
        Object.keys(newStates).forEach(code => {
          const state = newStates[code];
          if (state && state.isActive && state.timeLeft > 0) {
            newStates[code] = {
              ...state,
              timeLeft: state.timeLeft - 1,
            };
            hasChanges = true;
            
            // 타이머 완료 처리
            if (newStates[code].timeLeft <= 0) {
              newStates[code].isActive = false;
              newStates[code].isCompleted = true;
              console.log(`[타이머 완료] ${code} 타이머 완료 - 보기가 표시됩니다`);
              // localStorage에 완료 상태 저장 (F5 대응)
              const currentStep = getCurrentStep(stableQuestions);
              saveCompletedTimerToStorage(code, currentStep);
            }
          }
        });
        
        // 변경사항이 있을 때만 새 상태 반환
        return hasChanges ? newStates : prevStates;
      });
    }, 1000);

    return () => {
      console.log('[타이머 실행] 인터벌 정리');
      clearInterval(intervalId);
    };
  }, [isReady]); // isReady가 true가 되면 타이머를 시작하고, 컴포넌트가 언마운트되면 정리합니다.

  // 개발 환경 자동 답변
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isReady) {
      const timer = setTimeout(() => {
        stableQuestions.forEach((question) => {
          if (selectedAnswers[question.qu_code]) return;
          const timerState = timerStates[question.qu_code];
          if (timerState && !timerState.isCompleted) return;
          
          const availableChoices = question.choices.filter(c => c.an_val >= 1 && c.an_val <= 5);
          if (availableChoices.length > 0) {
            const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
            onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
          }
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stableQuestions, selectedAnswers, onSelectChoice, timerStates, isReady]);

  // 수동 자동 답변
  const handleManualAutoSelect = () => {
    if (process.env.NODE_ENV === 'development') {
      stableQuestions.forEach((question) => {
        const timerState = timerStates[question.qu_code];
        if (timerState && !timerState.isCompleted) return;
        const availableChoices = question.choices.filter(c => c.an_val >= 1 && c.an_val <= 5);
        if (availableChoices.length > 0) {
          const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
          onSelectChoice(question.qu_code, randomChoice.an_val, randomChoice.an_wei);
        }
      });
    }
  };

  // 개발 모드: 타이머 강제 완료
  const handleForceCompleteTimer = (questionCode: string) => {
    if (process.env.NODE_ENV === 'development') {
      setTimerStates(prev => ({
        ...prev,
        [questionCode]: {
          ...prev[questionCode],
          timeLeft: 0,
          isActive: false,
          isCompleted: true,
        },
      }));
      // localStorage에 완료 상태 저장 (F5 대응)
      const currentStep = getCurrentStep(stableQuestions);
      saveCompletedTimerToStorage(questionCode, currentStep);
    }
  };

  // 개발 모드: localStorage 완료 타이머 초기화
  const handleClearCompletedTimers = () => {
    if (process.env.NODE_ENV === 'development') {
      const currentStep = getCurrentStep(stableQuestions);
      const key = `completedTimers_${currentStep}`;
      localStorage.removeItem(key);
      console.log(`[localStorage] ${currentStep} 단계 완료 타이머 초기화됨`);
      
      // 타이머 상태도 다시 초기화
      const newTimerStates: Record<string, {
        timeLeft: number;
        isActive: boolean;
        isCompleted: boolean;
        totalTime: number;
      }> = {};

      stableQuestions.forEach((question) => {
        const dbTimerValue = question.qu_time_limit_sec;
        const hasValidTimer = dbTimerValue !== null && 
                             dbTimerValue !== undefined && 
                             Number(dbTimerValue) > 0;
        
        if (hasValidTimer) {
          const timeLimitSec = Number(dbTimerValue);
          newTimerStates[question.qu_code] = {
            timeLeft: timeLimitSec,
            isActive: true,
            isCompleted: false,
            totalTime: timeLimitSec,
          };
          console.log(`[타이머 재시작] ${question.qu_code}: ${timeLimitSec}초 타이머 다시 활성화`);
        }
      });

      setTimerStates(newTimerStates);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerProgress = (questionCode: string): number => {
    const timerState = timerStates[questionCode];
    if (!timerState || timerState.totalTime === 0) return 0;
    return ((timerState.totalTime - timerState.timeLeft) / timerState.totalTime) * 100;
  };

  // [수정] 렌더링 조건을 isReady로 변경하여 최초 로드 시에만 로딩 화면을 보여줍니다.
  if (!isReady) {
    console.log('[렌더링] 초기화 대기 중...');
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">문항을 불러오는 중...</span>
      </div>
    );
  }

  console.log('[렌더링] 컴포넌트 렌더링 시작, 문항 수:', stableQuestions.length);

  return (
    <div className="relative group">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-yellow-800 text-sm font-medium">개발 모드: 사고력 진단 자동 답변이 1.5초 후 적용됩니다.</span>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleManualAutoSelect} className="px-3 py-1 bg-yellow-600 text-white text-xs font-medium rounded hover:bg-yellow-700">지금 자동 선택</button>
              {stableQuestions.some(q => timerStates[q.qu_code]?.isActive) && (
                <button 
                  onClick={() => stableQuestions.forEach(q => handleForceCompleteTimer(q.qu_code))} 
                  className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                >
                  모든 타이머 완료
                </button>
              )}
              <button 
                onClick={handleClearCompletedTimers} 
                className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700"
              >
                타이머 초기화
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10 hover:shadow-3xl transition-all duration-500">
        {stableQuestions.map((question, questionIndex) => {
          const timerState = timerStates[question.qu_code];
          
          // [3단계] 타이머 렌더링 조건을 더욱 엄격하게 검증
          const dbTimerValue = question.qu_time_limit_sec;
          const hasValidDbTimer = dbTimerValue !== null && dbTimerValue !== undefined && Number(dbTimerValue) > 0;
          const hasTimerState = timerState !== undefined;
          const hasTimeLimit = hasValidDbTimer && hasTimerState;
          const timerIsActive = hasTimeLimit && timerState?.isActive;
          const timerIsCompleted = hasTimeLimit && timerState?.isCompleted;
          
          // 보기 표시 조건: 타이머가 없거나 타이머가 완료된 경우
          const showChoices = !hasTimeLimit || timerIsCompleted;
          // 제시문 표시 조건: 타이머가 없거나 타이머가 진행 중인 경우 (완료되면 숨김)
          const showExplanation = !hasTimeLimit || !timerIsCompleted;
          // 이미지 표시 조건: 타이머가 없거나 타이머가 진행 중인 경우 (완료되면 숨김)
          // thk02020 문제의 경우 특별 처리: 타이머 완료 시 첫 번째 이미지만 숨김
          const showImages = !hasTimeLimit || !timerIsCompleted;
          const isThk02020 = question.qu_code === 'thk02020';

          // [4단계] 타이머 렌더링 상태 디버깅 로그
          console.log(`[3단계 렌더링] ${question.qu_code}:`, {
            dbTimerValue,
            hasValidDbTimer,
            hasTimerState,
            hasTimeLimit,
            showChoices,
            showExplanation,
            showImages,
            timerIsActive,
            timerIsCompleted,
            timerWillRender: hasTimeLimit,
            timerState: timerState ? {
              활성: timerState.isActive,
              완료: timerState.isCompleted,
              남은시간: timerState.timeLeft,
              전체시간: timerState.totalTime
            } : 'null'
          });

          const imageCount = question.qu_images?.length || 0;
          let imageGridClass = 'grid-cols-2 md:grid-cols-3';
          if (imageCount === 2) imageGridClass = 'grid-cols-1 md:grid-cols-2';
          if (imageCount === 3) imageGridClass = 'grid-cols-1 md:grid-cols-3';
          if (imageCount === 4) imageGridClass = 'grid-cols-2';
          const choiceGridClass = question.choices.length === 6 ? 'lg:grid-cols-3' : 'xl:grid-cols-5';

          return (
            <div key={question.qu_code} className={`transition-opacity duration-300 ${questionIndex > 0 ? 'border-t border-gray-100 pt-10 mt-10' : ''}`}>
              <div className="flex items-start mb-8">
                <div className="relative group/number">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-60 group-hover/number:opacity-100 transition"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-xl transition-all hover:scale-110 hover:rotate-3">
                    <span className="text-white font-bold text-lg">{question.qu_order}</span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  {/* 문제 도입부/제목 - qu_text와 다를 때만 표시 */}
                  {question.qu_title && 
                   question.qu_title.trim() !== '' && 
                   question.qu_title.trim() !== question.qu_text.trim() && (
                    <div className="mb-4">
                      <p className="text-gray-600 text-base leading-relaxed">{question.qu_title}</p>
                    </div>
                  )}

                  {/* 핵심 지문 */}
                  {question.qu_passage && question.qu_passage.trim() !== '' ? (
                    <div className="mt-6 px-5 py-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span className="text-blue-800 font-bold text-sm">지문</span>
                      </div>
                      <div 
                        className="text-slate-700 text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: question.qu_passage }}
                      />
                    </div>
                  ) : (
                    // 지문이 없을 때 디버깅 정보 표시 (개발 모드에서만)
                    process.env.NODE_ENV === 'development' && (
                      <div className="mt-6 px-5 py-4 bg-gray-100 rounded-lg border-l-4 border-gray-400">
                        <div className="flex items-center mb-3">
                          <svg className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <span className="text-gray-800 font-bold text-sm">디버깅: 지문 없음</span>
                        </div>
                        <div className="text-gray-600 text-sm">
                          <p>문제 코드: {question.qu_code}</p>
                          <p>qu_passage 값: {question.qu_passage === null ? 'null' : question.qu_passage === undefined ? 'undefined' : question.qu_passage === '' ? '빈 문자열' : `"${question.qu_passage}"`}</p>
                          <p>qu_passage 길이: {question.qu_passage ? question.qu_passage.length : 0}자</p>
                          <p>qu_title: {question.qu_title || '없음'}</p>
                          <p>qu_text: {question.qu_text || '없음'}</p>
                          <p>qu_instruction: {question.qu_instruction || '없음'}</p>
                          <p>qu_title과 qu_text 중복: {question.qu_title && question.qu_title.trim() === question.qu_text.trim() ? '예 (도입부 숨김)' : '아니오'}</p>
                          <p>렌더링 조건: {question.qu_passage && question.qu_passage.trim() !== '' ? '조건 만족 (표시됨)' : '조건 불만족 (숨겨짐)'}</p>
                          {question.qu_code === 'thk06090' && (
                            <>
                              <hr className="my-2 border-gray-300" />
                              <p className="font-bold text-red-600">🔍 thk06090 특별 디버깅:</p>
                              <p>qu_passage 타입: {typeof question.qu_passage}</p>
                              <p>qu_passage === null: {question.qu_passage === null ? 'true' : 'false'}</p>
                              <p>qu_passage === undefined: {question.qu_passage === undefined ? 'true' : 'false'}</p>
                              <p>qu_passage === (빈 문자열): {question.qu_passage === '' ? 'true' : 'false'}</p>
                              <p>qu_passage trim 결과: {question.qu_passage ? `[${question.qu_passage.trim()}]` : 'N/A'}</p>
                              <p>qu_passage trim 길이: {question.qu_passage ? question.qu_passage.trim().length : 0}</p>
                              <p>렌더링 조건 상세: {question.qu_passage ? 'qu_passage 존재' : 'qu_passage 없음'} && {question.qu_passage && question.qu_passage.trim() !== '' ? 'trim 후 빈값 아님' : 'trim 후 빈값'}</p>
                              {question.qu_passage && (
                                <p>qu_passage 미리보기: {question.qu_passage.substring(0, 100)}...</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {/* 지시문 */}
                  {question.qu_instruction && (
                    <div className="mt-6 px-5 py-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                        <span className="text-yellow-800 font-bold text-sm">지시문</span>
                      </div>
                      <p className="text-slate-700 text-base leading-relaxed">{question.qu_instruction}</p>
                    </div>
                  )}

                  {/* 핵심 질문 */}
                  <div className="mt-6">
                    <p className="text-xl text-black leading-relaxed font-semibold">{question.qu_text}</p>
                  </div>
                  
                  {/* 기존 qu_explain 처리 - 답안 설명용으로 유지 */}
                  {question.qu_explain && showExplanation && (
                    <div className="mt-6 px-5 py-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="text-green-800 font-bold text-sm">설명</span>
                      </div>
                      <div>
                        {question.qu_explain.split('\n\n').map((p, i) => <p key={i} className="text-slate-700 text-base leading-relaxed last:mb-0 mb-3">{p}</p>)}
                      </div>
                    </div>
                  )}

                  {timerIsActive && (
                    <div 
                      className="mt-4 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200/50 shadow-lg" 
                      role="timer"
                      aria-label={`문제 ${question.qu_order} 타이머 진행 중: ${formatTime(timerState.timeLeft)} 남음`}
                    >
                      <div className="flex items-center justify-center space-x-6">
                        <div className="relative" aria-hidden="true">
                          <CircularProgress progress={getTimerProgress(question.qu_code)} />
                          <div className="absolute -inset-2 bg-red-500 rounded-full animate-ping opacity-10"></div>
                        </div>
                        <div className="text-center">
                          <div 
                            className="text-3xl font-bold text-red-600 font-mono tracking-wider"
                            aria-live="polite"
                            aria-atomic="true"
                          >
                            {formatTime(timerState.timeLeft)}
                          </div>
                          <div className="text-sm text-red-500 font-medium mt-2">
                            보기는 타이머 종료 후 나타납니다
                          </div>
                          <div className="text-xs text-red-400 mt-1">
                            {Math.round(getTimerProgress(question.qu_code))}% 진행됨
                          </div>
                          {process.env.NODE_ENV === 'development' && (
                            <button
                              onClick={() => handleForceCompleteTimer(question.qu_code)}
                              className="mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              타이머 완료
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {timerIsCompleted && (
                    <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 shadow-lg">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="absolute -inset-1 bg-green-400 rounded-full animate-ping opacity-30"></div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-700 font-bold text-base">타이머 완료!</div>
                          <div className="text-green-600 text-sm mt-1">이제 답안을 선택하세요</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {imageCount > 0 && showImages && (
                <div className="mb-8 ml-20">
                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/50 shadow-lg">
                    {imageCount === 1 ? (
                      <div className="relative">
                        {question.qu_code === 'thk02040' && (
                          <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-lg">
                            1
                          </div>
                        )}
                        <img src={question.qu_images![0]} alt="문제 이미지" className="max-w-md h-auto mx-auto rounded-xl shadow-md"/>
                      </div>
                    ) : (
                      <div className={`grid ${imageGridClass} gap-4`}>
                        {question.qu_images!.map((img, i) => (
                          <div key={i} className="relative">
                            {question.qu_code === 'thk02040' && (
                              <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-lg">
                                {i + 1}
                              </div>
                            )}
                            <img src={img} alt={`문제 이미지 ${i + 1}`} className="w-full h-auto object-cover rounded-xl shadow-md"/>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* thk02020 문제에서 타이머 완료 시 두 번째 이미지만 표시 */}
              {imageCount > 0 && isThk02020 && timerIsCompleted && (
                <div className="mb-8 ml-20">
                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/50 shadow-lg">
                    {imageCount > 1 && (
                      <div className={`grid ${imageGridClass} gap-4`}>
                        {question.qu_images!.slice(1).map((img, i) => (
                          <div key={i + 1} className="relative">
                            {question.qu_code === 'thk02040' && (
                              <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-lg">
                                {i + 2}
                              </div>
                            )}
                            <img src={img} alt={`문제 이미지 ${i + 2}`} className="w-full h-auto object-cover rounded-xl shadow-md"/>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showChoices ? (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${choiceGridClass} gap-4 ml-20`}>
                  {question.choices.map((choice) => (
                    <div key={choice.an_val} className="relative group/choice">
                      <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-hover/choice:opacity-60 transition ${ selectedAnswers[question.qu_code] === choice.an_val ? 'bg-gradient-to-r from-indigo-500 to-purple-600 opacity-75' : 'bg-gradient-to-r from-indigo-400 to-purple-500' }`}></div>
                      <button onClick={() => onSelectChoice(question.qu_code, choice.an_val, choice.an_wei)} className={`relative w-full h-full p-3 text-center rounded-xl font-semibold transition-all hover:scale-105 hover:-translate-y-1 ${ selectedAnswers[question.qu_code] === choice.an_val ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl scale-105 -translate-y-1' : 'bg-white/90 border border-gray-200/60 text-gray-700 hover:bg-white' }`}>
                        {choice.choice_image_path ? (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs mb-1">{choice.an_val}</div>
                            <div className="rounded-lg overflow-hidden shadow-md"><img src={choice.choice_image_path} alt={`선택지 ${choice.an_val}`} className="max-w-20 h-auto"/></div>
                          </div>
                        ) : (
                          <div className="flex flex-row items-center justify-center h-full">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${ selectedAnswers[question.qu_code] === choice.an_val ? 'bg-white text-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' }`}>{choice.an_val}</div>
                            <span className="ml-2 text-sm font-medium text-left">{choice.an_text}</span>
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-20 p-8 bg-gray-50/50 rounded-2xl border border-gray-200/50 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                    </div>
                    <div className="text-gray-600 font-medium">보기는 타이머 종료 후 나타납니다</div>
                    <div className="text-gray-500 text-sm">제시된 문제를 충분히 검토하세요</div>
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