import { useState } from 'react';
import { Heart, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// API 응답 데이터 구조에 맞춘 타입 정의
interface Tendency {
  rank: number;
  tendency_name: string;
  explanation: string;
}

interface ApiResultData {
  personalInfo: {
    pname: string;
  };
  tendency: {
    tnd1: string;
    tnd2: string;
  };
  topTendencies: Tendency[];
  bottomTendencies: Tendency[];
  topTendencyExplains: Tendency[];
  bottomTendencyExplains: Tendency[];
}

interface PersonalityAnalysisTabProps {
  result: ApiResultData;
}

export default function PersonalityAnalysisTab({ result }: PersonalityAnalysisTabProps) {
  const [showAllTopTendencies, setShowAllTopTendencies] = useState(false);
  const [showAllBottomTendencies, setShowAllBottomTendencies] = useState(false);
  
  // 데이터가 없는 경우를 대비한 안전 장치
  if (!result) {
    return <div>결과 데이터를 불러오는 중...</div>;
  }

  const {
    personalInfo,
    tendency,
    topTendencies = [],
    bottomTendencies = [],
    topTendencyExplains = [],
    bottomTendencyExplains = [],
  } = result;

  const topTendenciesToShow = showAllTopTendencies ? topTendencies : topTendencies.slice(0, 5);
  const bottomTendenciesToShow = showAllBottomTendencies ? bottomTendencies : bottomTendencies.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 섹션 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-50 opacity-80"></div>
          
          <div className="relative p-6 flex items-start gap-3">
            <div className="flex-shrink-0 rounded-lg bg-white p-3 shadow-md border border-emerald-100 transform -rotate-6">
              <Heart className="h-8 w-8 text-emerald-500" />
            </div>
            
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {personalInfo?.pname} 님!
              </h2>
              <p className="text-base text-gray-600">
                옥타그노시스 검사 결과에 따른 <span className="font-bold text-emerald-600">성향진단</span> 결과는 
                <span className="font-bold text-emerald-600 text-2xl mx-1">
                  {tendency?.tnd1}형
                </span> 
                입니다.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 text-white px-6 py-3">
          <p className="text-sm">
            1단계 8가지 사고력 검사 데이터와 2단계 15가지 성향을 진단한 결과를 토대로 주 성향을 판독한 결과입니다.
          </p>
        </div>
      </div>

      {/* 상단 요약 카드 */}
      <Card className="border border-gray-200 rounded-lg shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">나의 강점 심리자원</h3>
          <div className="flex flex-wrap gap-2">
            {topTendencies.slice(0, 2).map((t) => (
              <span 
                key={t.rank} 
                className="bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-sm font-medium"
              >
                #{t.tendency_name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 주요 성향 설명 */}
      <Card className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-200 py-4 flex items-center bg-gradient-to-r from-emerald-50 to-emerald-100">
          <Brain className="h-5 w-5 text-emerald-500 mr-2" />
          <CardTitle className="text-base font-medium text-emerald-700">
            주요 성향 설명
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="p-4 bg-emerald-50 rounded-lg mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-medium">{personalInfo?.pname}</span>님의 주요 성향은 
              <Badge variant="secondary" className="mx-1 font-medium text-emerald-700 bg-emerald-100 border-emerald-200">
                {tendency?.tnd1}
              </Badge>
              과(와) 
              <Badge variant="secondary" className="mx-1 font-medium text-emerald-700 bg-emerald-100 border-emerald-200">
                {tendency?.tnd2}
              </Badge>
              입니다.
            </p>
          </div>
          
          {topTendenciesToShow.length > 0 && topTendencyExplains.length > 0 && (
            <div className="space-y-5 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topTendenciesToShow.map((item, index) => {
                  const explain = topTendencyExplains.find(e => e.rank === item.rank);
                  
                  return (
                    <div 
                      key={`top-explain-${index}`} 
                      className="p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300"
                    >
                      <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center">
                        <Badge variant="outline" className="mr-2 bg-emerald-50 text-emerald-700">
                          주성향 상위 {item.rank}
                        </Badge>
                        <span className="text-emerald-700">{item.tendency_name}</span>
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed pl-2 border-l-2 border-emerald-200">
                        {explain?.explanation || '설명 정보가 없습니다.'}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {topTendencies.length > 5 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllTopTendencies(!showAllTopTendencies)}
                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    {showAllTopTendencies ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        성향 접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        모든 성향 보기 ({topTendencies.length}개)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* 나와 잘 안 맞는 성향 설명 */}
          {bottomTendenciesToShow.length > 0 && bottomTendencyExplains.length > 0 && (
            <div className="space-y-5">
              <h3 className="text-lg font-medium text-gray-800 pb-2 border-b border-gray-200 flex items-center">
                <span className="inline-block w-2 h-6 bg-gray-500 rounded-sm mr-2"></span>
                나와 잘 안 맞는 성향 설명
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {bottomTendenciesToShow.map((item, index) => {
                  const explain = bottomTendencyExplains.find(e => e.rank === item.rank);
                  
                  return (
                    <div 
                      key={`bottom-explain-${index}`} 
                      className="p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300"
                    >
                      <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center">
                        <Badge variant="outline" className="mr-2 bg-gray-50 text-gray-700">
                          하위 {index + 1}
                        </Badge>
                        <span className="text-gray-700">{item.tendency_name}</span>
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed pl-2 border-l-2 border-gray-200">
                        {explain?.explanation || '설명 정보가 없습니다.'}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {bottomTendencies.length > 3 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllBottomTendencies(!showAllBottomTendencies)}
                    className="text-gray-700 border-gray-200 hover:bg-gray-50"
                  >
                    {showAllBottomTendencies ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        성향 접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        모든 성향 보기 ({bottomTendencies.length}개)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}