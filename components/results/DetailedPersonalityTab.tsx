import ResultCard from './ResultCard';
import { Icons } from '../icons';

export interface DetailedPersonality {
  qu_explain: string;
  rank: number;
  an_wei?: number;
  qua_code?: string;
}

interface DetailedPersonalityTabProps {
  result?: DetailedPersonality[];
}

export default function DetailedPersonalityTab({ result }: DetailedPersonalityTabProps) {
  if (!result || result.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500">세부 성향 분석 데이터가 없습니다.</p>
      </div>
    );
  }

  // 성향 순위별로 그룹화
  const groupedByRank = result.reduce((acc, item) => {
    if (!acc[item.rank]) {
      acc[item.rank] = [];
    }
    acc[item.rank].push(item);
    return acc;
  }, {} as Record<number, DetailedPersonality[]>);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">세부 성향 분석</h2>
        <p className="text-gray-600">상위 3개 성향에 대한 세부 분석 결과입니다.</p>
      </div>

      {Object.entries(groupedByRank)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([rank, items]) => (
          <ResultCard key={rank}>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {rank}
                </div>
                {rank}순위 성향 세부 분석
              </h3>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-blue-800 flex items-center">
                      <Icons.Sparkles className="w-5 h-5 mr-2" />
                      세부 분석 내용
                    </h4>
                    {item.an_wei && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        가중치: {item.an_wei}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.qu_explain}</p>
                  {item.qua_code && (
                    <p className="text-xs text-gray-500 mt-2">성향 코드: {item.qua_code}</p>
                  )}
                </div>
              ))}
            </div>
          </ResultCard>
        ))}
    </div>
  );
}