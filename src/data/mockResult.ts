// data/mockResult.ts

export interface TestResult {
  cr_seq: number;
  pd_name: string;
  pe_name: string;
  personalInfo: {
    id: string;
    birth: string;
    sex: string;
    cellphone: string;
    contact: string;
    email: string;
    education: string;
    school: string;
    syear: string;
    smajor: string;
    job: string;
    age: number;
    job_name: string;
    job_detail: string;
  };
  personalityAnalysis: any;
  detailedPersonality: any;
  learningStyle: any;
  recommendations: any;
}

export const mockFullResult: TestResult = {
  cr_seq: 12345,
  pd_name: "종합 진로 탐색 검사",
  pe_name: "홍길동",
  personalInfo: {
    id: "hong123",
    birth: "1998-05-12",
    sex: "남",
    cellphone: "010-1234-5678",
    contact: "02-123-4567",
    email: "hong.gildong@example.com",
    education: "대학교 재학",
    school: "한국대학교",
    syear: "3학년",
    smajor: "컴퓨터공학과",
    job: "학생",
    age: 26,
    job_name: "",
    job_detail: "",
  },
  personalityAnalysis: {
    summary: [
      { label: "관계지향성", score: 85, level: "매우 높음", myPercent: 85, avgPercent: 55, color: "blue" },
      { label: "성취지향성", score: 72, level: "높음", myPercent: 72, avgPercent: 60, color: "amber" },
      { label: "안정지향성", score: 45, level: "보통", myPercent: 45, avgPercent: 50, color: "green" },
      { label: "자율지향성", score: 68, level: "높음", myPercent: 68, avgPercent: 65, color: "purple" },
    ],
  },
  detailedPersonality: [
    {
      trait: "관계지향성",
      strength_desc: "사람들과 우호적인 관계를 맺고 팀워크를 중요시합니다. 공감 능력이 뛰어나 갈등을 중재하고 협력적인 분위기를 만드는 데 탁월합니다.",
      weakness_desc: "때로는 관계를 우선시하여 자신의 의견을 명확히 주장하기 어려워하거나, 객관적인 판단이 필요한 상황에서 감정적인 결정을 내릴 수 있습니다.",
    },
    // ...
  ],
  recommendations: {
    byPersonality: [
      { name: "인사(HR) 전문가", description: "사람을 이해하고 성장을 돕습니다." },
      { name: "사회복지사", description: "공감 능력으로 타인에게 힘이 됩니다." },
      { name: "서비스 기획자", description: "사용자 경험을 중심으로 생각합니다." },
    ],
    byCompetency: [ { name: "데이터 분석가", description: "데이터 기반의 논리적 의사결정을 내립니다." } ],
    subjectsByPersonality: [
        { name: "사회문화", description: "사회의 구조와 상호작용을 탐구합니다." },
        { name: "문학", description: "인간의 감정과 삶을 깊이 있게 이해합니다." },
    ],
    subjectsByCompetency: [ { name: "통계학", description: "데이터의 의미를 해석하고 미래를 예측합니다." } ],
  },
  learningStyle: { summary: "시각적 학습과 실제 적용을 통해 가장 잘 배웁니다." },
};