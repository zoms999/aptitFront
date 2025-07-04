import ResultCard from './ResultCard';
import { Icons } from '../icons';

export interface DetailedPersonality {
  qu_explain: string;
  rank: number;
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

  return (
    <div className="space-y-8 animate-fade-in">
      {result.map((item, index) => (
        <ResultCard key={index}>
          <h3 className="text-xl font-bold text-gray-800 mb-4">성향 순위: {item.rank}</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-blue-800 mb-1 flex items-center">
                <Icons.Sparkles className="w-5 h-5 mr-2" />
                성향 설명
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{item.qu_explain}</p>
            </div>
          </div>
        </ResultCard>
      ))}
    </div>
  );
}