import React, { useMemo } from 'react';
import ThinkingTestEntry from './ThinkingTestEntry';

// 템플릿 타입 정의들을 templates/types.ts에서 import
import { Question, TestData } from './templates/types';

interface ThinkingTestProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  onSelectChoice: (questionCode: string, choiceValue: number, choiceWeight: number) => void;
}

export default function ThinkingTest({ questions, selectedAnswers, onSelectChoice }: ThinkingTestProps) {
  
  // 안정화된 문항 데이터
  const stableQuestions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    
    console.log('[ThinkingTest] 템플릿 시스템으로 문항 로드:', questions.map(q => ({
      qu_code: q.qu_code,
      qu_template_type: q.qu_template_type || 'PURE_TEXT_QUESTION',
      qu_time_limit_sec: q.qu_time_limit_sec,
      hasValidTimer: q.qu_time_limit_sec !== null && q.qu_time_limit_sec !== undefined && Number(q.qu_time_limit_sec) > 0
    })));
    
    return questions;
  }, [questions]);

  // 템플릿 타입별로 문항들을 그룹화
  const groupedQuestions = useMemo(() => {
    if (!stableQuestions || stableQuestions.length === 0) return {};
    
    const groups: Record<string, Question[]> = {};
    
    stableQuestions.forEach(question => {
      // qu_template_type이 없으면 PURE_TEXT_QUESTION으로 기본 설정
      const templateType = question.qu_template_type || 'PURE_TEXT_QUESTION';
      
      if (!groups[templateType]) {
        groups[templateType] = [];
      }
      groups[templateType].push(question);
    });
    
    console.log('[ThinkingTest] 템플릿별 문항 그룹화 완료:', Object.keys(groups).map(key => ({
      templateType: key,
      count: groups[key].length,
      questions: groups[key].map(q => q.qu_code)
    })));
    
    return groups;
  }, [stableQuestions]);

  // 문항이 없는 경우 로딩 상태 표시
  if (!stableQuestions || stableQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">사고력 테스트 문항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {Object.entries(groupedQuestions).map(([templateType, questionsForTemplate]) => {
        // 각 템플릿 타입별로 TestData 객체 생성
        const testData: TestData = {
          qu_template_type: templateType,
          questions: questionsForTemplate
        };

        return (
          <div key={templateType} className="mb-8">
            {/* 템플릿별 구분을 위한 디버그 정보 (개발 모드에서만 표시) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="max-w-4xl mx-auto px-4 py-2 mb-4">
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-yellow-800 text-sm font-medium">
                      개발 모드: {templateType} 템플릿 ({questionsForTemplate.length}개 문항)
                    </span>
                  </div>
                  <div className="mt-1 text-yellow-700 text-xs">
                    문항: {questionsForTemplate.map(q => q.qu_code).join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* 템플릿 렌더링 */}
            <ThinkingTestEntry
              testData={testData}
              selectedAnswers={selectedAnswers}
              onSelectChoice={onSelectChoice}
            />
          </div>
        );
      })}
    </div>
  );
}