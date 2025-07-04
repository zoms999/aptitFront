import { Icons } from '../icons'; // heroicons 같은 아이콘 라이브러리
import ResultCard from './ResultCard';

const ScoreBar = ({ label, score, level, myPercent, avgPercent, color = 'blue' }: any) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-semibold text-gray-700">{label}</h4>
      <span className={`text-lg font-bold text-${color}-600`}>{score}점 <span className={`text-sm font-medium text-gray-500`}>({level})</span></span>
    </div>
    <div className="relative w-full bg-gray-200 rounded-full h-2.5">
      <div className={`bg-${color}-500 h-2.5 rounded-full`} style={{ width: `${myPercent}%` }} />
      <div className="absolute top-0 h-full flex items-center" style={{ left: `calc(${avgPercent}% - 6px)` }}>
        <div className="w-3 h-3 bg-gray-500 rounded-full border-2 border-white cursor-help" title={`평균: ${avgPercent}점`}></div>
      </div>
    </div>
  </div>
);

export default function PersonalityAnalysisTab({ result }: any) {
  return (
    <div className="space-y-8 animate-fade-in">
      <ResultCard>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Icons.UserCircle className="w-7 h-7 text-indigo-500 mr-3" />
          종합 성향 분석
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {result.summary.map((item: any, index: number) => (
            <ScoreBar key={index} {...item} />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-6">* 위 점수는 백분위 점수이며, 점선 마커는 대한민국 평균 직장인 데이터입니다.</p>
      </ResultCard>
    </div>
  );
}