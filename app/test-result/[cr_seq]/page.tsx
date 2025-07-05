"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from "@/components/Footer";
import Tabs from '@/components/results/Tabs';

// 각 탭에 해당하는 컴포넌트들을 import 합니다.
import PersonalInfoTab from '@/components/results/PersonalInfoTab';
import PersonalityAnalysisTab from '@/components/results/PersonalityAnalysisTab';
import DetailedPersonalityTab from '@/components/results/DetailedPersonalityTab';
import JobRecommendationTab from '@/components/results/JobRecommendationTab';
import PlaceholderTab from '@/components/results/PlaceholderTab';
import LearningStyleTab from '@/components/results/LearningStyleTab';
import ThinkingTab from '../../../components/results/ThinkingTab';
import CompetencyTab from '../../../components/results/CompetencyTab';
import { TestResult } from '@/data/mockResult'; // 목업 데이터 분리

export default function TestResultPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('성향진단');

  const cr_seq = params.cr_seq as string;

  const tabs = [
    { id: '개인정보', label: '개인정보' },
    { id: '성향진단', label: '성향진단' },
    { id: '세부성향분석', label: '세부성향분석' },
    { id: '사고력진단', label: '사고력진단' },
    { id: '역량진단', label: '역량진단' },
    { id: '선호도', label: '선호도' },
    { id: '직무', label: '직무' },
    { id: '성향적합직업학과', label: '성향적합 직업/학과' },
    { id: '역량적합직업학과', label: '역량적합 직업/학과' },
    { id: '학습법분석', label: '학습법분석' },
    { id: '성향적합교과목', label: '성향적합 교과목' },
    { id: '역량적합교과목', label: '역량적합 교과목' },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && cr_seq) {
      fetchTestResult();
    }
  }, [status, cr_seq, router]);

  const fetchTestResult = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/test-result/${cr_seq}`);
      const result = await response.json();

      if (result.success) {
        setTestResult(result.data);
      } else {
        throw new Error(result.message || '결과를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Test result fetch error:', err);
      setError(err instanceof Error ? err.message : '결과를 가져오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 cursor-wait">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg animate-pulse">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">결과 로딩 중</h2>
            <p className="text-gray-600">검사 결과를 불러오고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">오류 발생</h1>
              <p className="text-gray-700 mb-6">{error}</p>
              <button 
                onClick={() => router.back()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                돌아가기
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!testResult) {
    return null;
  }

  const renderTabContent = () => {
    if (!testResult) return null;

    switch (activeTab) {
      case '개인정보':
        return <PersonalInfoTab result={{ personalInfo: testResult.personalInfo, pe_name: testResult.pe_name }} />;
      case '성향진단':
        // PersonalityAnalysisTab은 이제 personalInfo와 tendency 관련 데이터를 모두 필요로 합니다.
        return <PersonalityAnalysisTab result={testResult} />;
      case '세부성향분석':
        return <DetailedPersonalityTab result={testResult} />;
      case '사고력진단':
        return <ThinkingTab result={testResult} />;
      case '역량진단':
        return <CompetencyTab result={testResult} />;
      case '학습법분석':
        return <LearningStyleTab result={testResult.learningStyle} />;
      case '성향적합직업학과':
        return <JobRecommendationTab title="성향 기반 추천" recommendations={testResult.recommendations?.byPersonality || []} />;
      case '역량적합직업학과':
        return <JobRecommendationTab title="역량 기반 추천" recommendations={testResult.recommendations?.byCompetency || []} />;
      case '성향적합교과목':
        return <JobRecommendationTab title="성향 기반 추천 교과목" recommendations={testResult.recommendations?.subjectsByPersonality || []} iconType="subject" />;
      case '역량적합교과목':
        return <JobRecommendationTab title="역량 기반 추천 교과목" recommendations={testResult.recommendations?.subjectsByCompetency || []} iconType="subject" />;
      default:
        return <PlaceholderTab title={activeTab} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto space-y-8">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                종합 결과 리포트
              </h1>
              <p className="text-gray-500 mt-1">응시자: {testResult.pe_name} (검사 ID: {cr_seq})</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md cursor-pointer"
            >
              돌아가기
            </button>
          </div>

          {/* 탭 네비게이션 및 콘텐츠 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80">
            {/* 탭 컴포넌트 */}
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* 탭 콘텐츠 렌더링 영역 */}
            <div className="p-6 md:p-8">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}