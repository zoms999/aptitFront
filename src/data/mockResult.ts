import { DetailedPersonality } from '@/components/results/DetailedPersonalityTab';

export interface Tendency {
  rank: number;
  tendency_name: string;
  explanation: string;
}

export interface TestResult {
  personalInfo: any;
  tendency: any;
  topTendencies: Tendency[];
  bottomTendencies: Tendency[];
  topTendencyExplains: Tendency[];
  bottomTendencyExplains: Tendency[];
  // 다른 탭들을 위한 데이터 타입 추가
  detailedPersonality: DetailedPersonality[];
  learningStyle: any;
  recommendations: any;
  pe_name: string; // 최상위 레벨에 pe_name 추가
}