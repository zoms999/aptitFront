import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cr_seq: string }> }
) {
  try {
    // 1. 세션 검증
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 2. cr_seq 검증
    const resolvedParams = await params;
    const crSeq = parseInt(resolvedParams.cr_seq, 10);
    if (isNaN(crSeq)) {
      return NextResponse.json({ error: '유효하지 않은 검사 ID입니다' }, { status: 400 });
    }

    // 3. 검사 결과 기본 정보 조회
    const resultInfo = await prisma.$queryRaw`
      SELECT 
        cr.cr_seq,
        cr.ac_gid,
        pe.pe_name,
        cr.cr_start_date,
        cr.cr_end_date,
        ap.anp_done as status
      FROM mwd_choice_result cr
      JOIN mwd_account ac ON cr.ac_gid = ac.ac_gid
      JOIN mwd_person pe ON ac.pe_seq = pe.pe_seq
      LEFT JOIN mwd_answer_progress ap ON cr.cr_seq = ap.cr_seq
      WHERE cr.cr_seq = ${crSeq}
        AND cr.ac_gid = ${session.user.id}::uuid
    ` as Array<{
      cr_seq: number;
      ac_gid: string;
      pe_name: string;
      cr_start_date: Date;
      cr_end_date: Date | null;
      status: string;
    }>;

    if (!Array.isArray(resultInfo) || resultInfo.length === 0) {
      return NextResponse.json({ error: '검사 결과를 찾을 수 없습니다' }, { status: 404 });
    }

    const result = resultInfo[0];

    // 4. 목업 데이터 구성 (실제 구현 시 데이터베이스에서 조회)
    const mockResult = {
      cr_seq: result.cr_seq,
      pe_name: result.pe_name,
      cr_start_date: result.cr_start_date,
      cr_end_date: result.cr_end_date,
      status: result.status,
      personalInfo: {
        name: result.pe_name,
        testDate: result.cr_start_date,
        testType: '종합 적성 검사',
        completionTime: result.cr_end_date ? 
          Math.round((new Date(result.cr_end_date).getTime() - new Date(result.cr_start_date).getTime()) / (1000 * 60)) : null
      },
      tendency: [
        { name: '외향성', score: 85, description: '활발하고 사교적인 성향' },
        { name: '성실성', score: 78, description: '책임감이 강하고 계획적' },
        { name: '개방성', score: 72, description: '새로운 경험에 열린 자세' }
      ],
      detailedPersonality: {
        strengths: ['리더십', '의사소통', '문제해결'],
        weaknesses: ['완벽주의', '스트레스 관리'],
        recommendations: ['팀 프로젝트 참여', '스트레스 관리 기법 학습']
      },
      learningStyle: {
        primaryStyle: '시각적 학습',
        characteristics: ['도표와 그래프 선호', '체계적 정리'],
        recommendations: ['마인드맵 활용', '시각적 자료 활용']
      },
      recommendations: {
        byPersonality: [
          { category: '직업', name: '프로젝트 매니저', match: 92 },
          { category: '직업', name: '마케팅 전문가', match: 88 },
          { category: '학과', name: '경영학과', match: 90 }
        ],
        byCompetency: [
          { category: '직업', name: '데이터 분석가', match: 85 },
          { category: '직업', name: '컨설턴트', match: 82 },
          { category: '학과', name: '통계학과', match: 87 }
        ],
        subjectsByPersonality: [
          { category: '교과목', name: '경영학 개론', match: 95 },
          { category: '교과목', name: '마케팅 원론', match: 90 }
        ],
        subjectsByCompetency: [
          { category: '교과목', name: '통계학', match: 88 },
          { category: '교과목', name: '데이터 분석', match: 85 }
        ]
      }
    };

    return NextResponse.json({
      success: true,
      data: mockResult
    });

  } catch (error) {
    console.error('Test result fetch error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '결과를 가져오는데 실패했습니다'
    }, { status: 500 });
  }
} 