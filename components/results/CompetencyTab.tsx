import ResultCard from './ResultCard';
import { CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface TalentDetail {
  qua_name: string;
  tscore: number;
  explain: string;
  rank: number;
}

interface CompetencyTabProps {
  result?: {
    personalInfo?: {
      pname: string;
    };
    talentList?: string;
    talentDetails?: TalentDetail[];
  };
}

export default function CompetencyTab({ result }: CompetencyTabProps) {
  const [showAllTalents, setShowAllTalents] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (!result) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500">역량 진단 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const userName = result.personalInfo?.pname || '사용자';
  
  // 상위 5개 역량과 나머지 역량 분리
  const top5Talents = result.talentDetails?.slice(0, 5) || [];
  const remainingTalents = result.talentDetails?.slice(5) || [];

  const toggleItem = (talentName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(talentName)) {
      newExpanded.delete(talentName);
    } else {
      newExpanded.add(talentName);
    }
    setExpandedItems(newExpanded);
  };

  if (!result.talentDetails || result.talentDetails.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg flex flex-col gap-4">
        <p className="text-center text-gray-500">역량진단 데이터를 불러올 수 없습니다.</p>
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
              <CheckSquare className="h-8 w-8 text-blue-500" />
            </div>
            
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {userName} 님!
              </h2>
              <p className="text-base text-gray-600">
                핵심역량은 <span className="font-bold text-blue-600">{result.talentList}</span>입니다.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 text-white px-6 py-3">
          <p className="text-sm">
            옥타그노시스 검사의 역량진단은 인간의 총 60가지 역량 스키마 중에서 도출합니다.
          </p>
        </div>
      </div>
      
      {/* 상위 5개 역량 카드 */}
      <ResultCard className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300">
        <div className="bg-gradient-to-r from-blue-50 via-blue-200 to-blue-100 border-b border-blue-100 py-3 px-6 -mx-6 -mt-6 mb-4">
          <h3 className="flex items-center text-lg text-blue-800 font-bold">
            <div className="bg-white p-2 rounded-full shadow-sm mr-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
            </div>
            상위 5개 역량
          </h3>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg mb-4">
          <p className="text-gray-700 text-center font-medium">
            {result.talentList}
          </p>
        </div>
        
        {top5Talents.map((talent, index) => (
          <div key={index} className="mb-4 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <div className="bg-blue-100 p-3 flex justify-between items-center">
              <h3 className="font-semibold">{talent.qua_name}</h3>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded text-sm font-medium">{talent.tscore}점</span>
            </div>
            <div className="p-4">
              <p className="text-gray-700 text-sm whitespace-pre-line pl-2 border-l-2 border-blue-200">{talent.explain}</p>
            </div>
          </div>
        ))}
      </ResultCard>
      
      {/* 나머지 역량 카드 */}
      {remainingTalents.length > 0 && (
        <ResultCard className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300">
          <div className="bg-gradient-to-r from-indigo-50 via-indigo-100 to-indigo-50 border-b border-indigo-100 py-3 px-6 -mx-6 -mt-6 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center text-lg text-indigo-800 font-bold">
                <div className="bg-white p-2 rounded-full shadow-sm mr-2">
                  <CheckSquare className="h-5 w-5 text-indigo-600" />
                </div>
                나머지 역량 ({remainingTalents.length}개)
              </h3>
              <button 
                onClick={() => setShowAllTalents(!showAllTalents)}
                className="flex items-center text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 px-3 py-1 rounded transition-colors"
              >
                {showAllTalents ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" /> 접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" /> 펼치기
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className={`p-4 pt-2 bg-white ${showAllTalents ? '' : 'hidden'}`}>
            <div className="text-sm text-gray-500 mb-4 p-3 bg-indigo-50 rounded-lg">
              <p>역량명을 클릭하면 상세 설명을 볼 수 있습니다. 총 {remainingTalents.length}개의 역량에 대한 진단 결과입니다.</p>
            </div>
            
            <div className="space-y-2">
              {remainingTalents.map((talent, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg overflow-hidden hover:shadow-sm transition-all duration-300"
                >
                  <div 
                    className={`px-4 py-3 cursor-pointer ${
                      talent.tscore >= 80 
                        ? 'bg-green-50 hover:bg-green-100' 
                        : talent.tscore >= 50 
                          ? 'bg-blue-50 hover:bg-blue-100' 
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleItem(talent.qua_name)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <span className="w-8 h-8 flex items-center justify-center bg-white rounded-full mr-3 text-xs font-bold shadow-sm">
                          {talent.rank || index + 6}
                        </span>
                        <span className="font-medium">{talent.qua_name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`mr-3 px-2 py-1 rounded border text-sm ${
                          talent.tscore >= 80 
                            ? 'bg-green-50 text-green-700 border-green-300' 
                            : talent.tscore >= 50 
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : 'bg-gray-50 text-gray-700 border-gray-300'
                          }`}
                        >
                          {talent.tscore}점
                        </span>
                        {expandedItems.has(talent.qua_name) 
                          ? <ChevronUp className="h-4 w-4" /> 
                          : <ChevronDown className="h-4 w-4" />
                        }
                      </div>
                    </div>
                  </div>
                  
                  {expandedItems.has(talent.qua_name) && (
                    <div className="px-5 py-4 border-t text-gray-700">
                      <div className="whitespace-pre-line pl-3 border-l-2 border-indigo-200">
                        {talent.explain}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  );
} 