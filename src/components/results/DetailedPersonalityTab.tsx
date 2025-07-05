import ResultCard from './ResultCard';
import { Icons } from '../icons';
import { Brain } from 'lucide-react';

interface DetailedPersonalityAnalysis {
  qu_explain: string;
  rank: number;
  an_wei?: number;
  qua_code?: string;
}

interface DetailedPersonalityTabProps {
  result?: {
    personalInfo?: {
      pname: string;
    };
    tendencyQuestionExplains?: DetailedPersonalityAnalysis[];
    detailedPersonalityAnalysis?: DetailedPersonalityAnalysis[];
  };
}

export default function DetailedPersonalityTab({ result }: DetailedPersonalityTabProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500">세부 성향 분석 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const analysisData = result.detailedPersonalityAnalysis || result.tendencyQuestionExplains || [];
  const userName = result.personalInfo?.pname || '사용자';

  if (analysisData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500">세부 성향 분석 데이터가 없습니다.</p>
      </div>
    );
  }

  // 성향 순위별로 그룹화
  const groupedByRank = analysisData.reduce((acc, item) => {
    if (!acc[item.rank]) {
      acc[item.rank] = [];
    }
    acc[item.rank].push(item);
    return acc;
  }, {} as Record<number, DetailedPersonalityAnalysis[]>);

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 opacity-80"></div>
          
          <div className="relative p-6 flex items-start gap-3">
            <div className="flex-shrink-0 rounded-lg bg-white p-3 shadow-md border border-blue-100 transform -rotate-6">
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
            
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {userName} 님!
              </h2>
              <p className="text-base text-gray-600">
                옥타그노시스 검사 결과에 따른 <span className="font-bold text-blue-600">세부성향분석</span> 결과입니다.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 text-white px-6 py-3">
          <p className="text-sm">
            옥타그노시스 검사 결과에 따라 {userName}님은 아래와 같은 결과로 분석되었습니다.
          </p>
        </div>
      </div>

      {/* 성향 순위별 분석 결과 */}
      {Object.entries(groupedByRank)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([rank, items]) => (
          <ResultCard key={rank} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-50 via-blue-200 to-blue-100 border-b border-blue-100 py-3 px-6 -mx-6 -mt-6 mb-4">
              <h3 className="flex items-center text-lg gap-2 text-blue-800 font-bold">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {rank}
                  </div>
                </div>
                {rank}순위 성향 특성
              </h3>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="pb-4 border-b border-gray-200 last:border-0">
                 
                  <p className="text-gray-700 leading-relaxed">{item.qu_explain}</p>
                 
                </div>
              ))}
            </div>
          </ResultCard>
        ))}
    </div>
  );
}