import ResultCard from './ResultCard';
import { Brain } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface ThinkingMain {
  thkm: string;
  thks: string;
  tscore: number;
}

interface ThinkingScore {
  thk1: number;
  thk2: number;
  thk3: number;
  thk4: number;
  thk5: number;
  thk6: number;
  thk7: number;
  thk8: number;
}

interface ThinkingDetail {
  qua_name: string;
  score: number;
  explain: string;
}

interface ThinkingTabProps {
  result?: {
    personalInfo?: {
      pname: string;
    };
    thinkingMain?: ThinkingMain;
    thinkingScore?: ThinkingScore;
    thinkingDetails?: ThinkingDetail[];
  };
}

// 사고력 이름 매핑
const getThinkingNameByKey = (key: string): string => {
  const nameMap: { [key: string]: string } = {
    'thk1': '논리사고력',
    'thk2': '수리사고력',
    'thk3': '언어사고력',
    'thk4': '공간사고력',
    'thk5': '추론사고력',
    'thk6': '비판사고력',
    'thk7': '창의사고력',
    'thk8': '종합사고력'
  };
  return nameMap[key] || key;
};

// 사고력 점수를 배열로 변환
const getThinkingScoreArray = (thinkingScore?: ThinkingScore) => {
  if (!thinkingScore) return [];
  
  return Object.entries(thinkingScore)
    .filter(([key]) => key.startsWith('thk'))
    .map(([key, value]) => ({
      name: getThinkingNameByKey(key),
      score: value as number
    }));
};

// 레이더 차트 데이터 변환
const getRadarChartData = (thinkingScore?: ThinkingScore) => {
  if (!thinkingScore) return [];
  
  return Object.entries(thinkingScore)
    .filter(([key]) => key.startsWith('thk'))
    .map(([key, value]) => ({
      subject: getThinkingNameByKey(key).replace('사고력', ''),
      score: value as number
    }));
};

export default function ThinkingTab({ result }: ThinkingTabProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500">사고력 진단 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const userName = result.personalInfo?.pname || '사용자';
  
  // 주요 사고력 찾기
  let topThinkingTypes = '';
  if (result.thinkingScore) {
    try {
      const thinkingScores = Object.entries(result.thinkingScore)
        .filter(([key]) => key.startsWith('thk'))
        .map(([key, value]) => ({
          qua_name: getThinkingNameByKey(key),
          score: value as number
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
      
      if (thinkingScores.length > 0) {
        topThinkingTypes = thinkingScores.map(item => item.qua_name).join('과 ');
      }
    } catch (err) {
      console.error('사고력 점수 처리 중 오류:', err);
    }
  }

  if (!result.thinkingMain && !result.thinkingScore && !result.thinkingDetails) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500">사고력 진단 데이터가 없습니다.</p>
      </div>
    );
  }

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
                옥타그노시스검사 결과, 강점 사고력은 <span className="font-bold text-blue-600">{topThinkingTypes}</span> 입니다.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 text-white px-6 py-3">
          <p className="text-sm">
            {userName}님의 8가지 사고력의 특징과 분포도의 결과가 분석된 결과입니다.
          </p>
        </div>
      </div>
      
      {/* 주사고 및 부사고 정보 */}
      {result.thinkingMain && (
        <ResultCard className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-50 via-blue-200 to-blue-100 border-b border-blue-100 py-3 px-6 -mx-6 -mt-6 mb-4">
            <h3 className="flex items-center text-lg text-blue-800 font-bold">
              <div className="bg-white p-2 rounded-full shadow-sm mr-2">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              사고력 유형 결과
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {userName}님의 주 사고력 유형은 <span className="font-semibold text-blue-800 bg-blue-100 border-blue-200 px-2 py-1 rounded">{result.thinkingMain.thkm}</span>, 
              부 사고력 유형은 <span className="font-semibold text-blue-800 bg-blue-100 border-blue-200 px-2 py-1 rounded">{result.thinkingMain.thks}</span>입니다.
              T점수는 <span className="font-semibold text-blue-800 bg-blue-100 border-blue-200 px-2 py-1 rounded">{result.thinkingMain.tscore}점</span>입니다.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg text-center mb-4">
            <p className="text-gray-700">
              옥타그노시스 검사 결과, {userName}님은 8가지 사고력을 진단한 결과입니다.
            </p>
          </div>
          
          {/* 사고력 차트 */}
          {result.thinkingScore && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* 바 차트 */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-center text-blue-800">사고력 수직 막대 그래프</h3>
                <div className="h-80 w-full bg-gray-50 rounded-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getThinkingScoreArray(result.thinkingScore)}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(value: string) => value.replace('사고력', '')} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => [`${value}%`, '점수']} />
                      <Legend />
                      <Bar 
                        dataKey="score" 
                        name="사고력 점수" 
                        fill="#3B82F6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* 레이더 차트 */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-center text-blue-800">사고력 분포 그래프</h3>
                <div className="h-80 w-full bg-gray-50 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarChartData(result.thinkingScore)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="사고력 점수" dataKey="score" stroke="#3B82F6" 
                        fill="#3B82F6" fillOpacity={0.6} />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </ResultCard>
      )}
      
      {/* 사고력 영역별 설명 */}
      {result.thinkingDetails && result.thinkingDetails.length > 0 && (
        <ResultCard className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-50 via-blue-200 to-blue-100 border-b border-blue-100 py-3 px-6 -mx-6 -mt-6 mb-4">
            <h3 className="flex items-center text-lg text-blue-800 font-bold">
              <div className="bg-white p-2 rounded-full shadow-sm mr-2">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              사고력 상세 분석
            </h3>
          </div>
          
          <div className="space-y-6">
            {result.thinkingDetails.map((item, index) => {
              const scoreColor = 
                item.score >= 80 ? 'bg-blue-100 text-blue-800 border-blue-300' : 
                item.score >= 51 ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                'bg-gray-100 text-gray-800 border-gray-300';
              
              return (
                <div key={`thinking-${index}`} className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${scoreColor}`}>
                  <div className="p-4 flex justify-between items-center">
                    <h4 className="font-semibold">{item.qua_name}</h4>
                    <span className={`text-base px-3 py-1 rounded border ${scoreColor}`}>
                      {item.score}점
                    </span>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed pl-2 border-l-2 border-blue-200">{item.explain}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ResultCard>
      )}
    </div>
  );
} 