import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/db';
import { getPersonalityAnalysisResult } from '../../../../lib/test/services/personality';

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

    console.log(`[TEST-RESULT] cr_seq: ${crSeq}, user: ${session.user.id}, type: ${session.user.type}`);

    // 3. 검사 결과 기본 정보 조회 (권한 확인 포함)
    const resultInfo = await prisma.$queryRaw`
      SELECT
        cr.cr_seq,
        cr.ac_gid,
        pe.pe_name,
        cr.cr_start_date,
        cr.cr_end_date,
        ap.anp_seq,
        ap.anp_done as status,
        ac.ins_seq,
        ${session.user.ins_seq || 0} as current_user_ins_seq
      FROM mwd_choice_result cr
      JOIN mwd_account ac ON cr.ac_gid = ac.ac_gid
      JOIN mwd_person pe ON ac.pe_seq = pe.pe_seq
      LEFT JOIN mwd_answer_progress ap ON cr.cr_seq = ap.cr_seq
      WHERE cr.cr_seq = ${crSeq}
    ` as Array<{
      cr_seq: number;
      ac_gid: string;
      pe_name: string;
      cr_start_date: Date;
      cr_end_date: Date | null;
      anp_seq: number;
      status: string;
      ins_seq: number;
      current_user_ins_seq: number;
    }>;

    if (!Array.isArray(resultInfo) || resultInfo.length === 0) {
      return NextResponse.json({ error: '검사 결과를 찾을 수 없습니다' }, { status: 404 });
    }

    const result = resultInfo[0];
    console.log(`[TEST-RESULT] Found result:`, {
      cr_seq: result.cr_seq,
      ac_gid: result.ac_gid,
      anp_seq: result.anp_seq,
      ins_seq: result.ins_seq,
      current_user_ins_seq: result.current_user_ins_seq
    });

    // 4. 권한 확인
    const isOwner = result.ac_gid === session.user.id;
    const isOrganizationAdmin = session.user.type === 'organization_admin' && 
                               session.user.ins_seq && 
                               result.ins_seq === session.user.ins_seq;
    
    if (!isOwner && !isOrganizationAdmin) {
      return NextResponse.json({ 
        error: '이 검사 결과에 대한 접근 권한이 없습니다' 
      }, { status: 403 });
    }

    // 5. anp_seq 확인
    if (!result.anp_seq) {
      return NextResponse.json({ 
        error: '검사 진행 정보가 없습니다. 검사가 완료되지 않았을 수 있습니다.' 
      }, { status: 404 });
    }

    const anp_seq = result.anp_seq;
    console.log(`[TEST-RESULT] Using anp_seq: ${anp_seq}`);

    // 6. 성향 분석 결과 조회
    const personalityResult = await getPersonalityAnalysisResult(anp_seq);
    console.log(`[TEST-RESULT] Personality result:`, personalityResult);

    // 7. 최종 결과 데이터 구성
    const finalResult = {
      cr_seq: result.cr_seq,
      pe_name: result.pe_name,
      cr_start_date: result.cr_start_date,
      cr_end_date: result.cr_end_date,
      status: result.status,
      anp_seq: anp_seq, // 디버깅용
      personalInfo: {
        pname: result.pe_name,
        testDate: result.cr_start_date,
      },
      ...personalityResult,
      // 다른 결과들도 여기에 추가 (예: 사고력, 역량 등)
    };

    return NextResponse.json({
      success: true,
      data: finalResult
    });

  } catch (error) {
    console.error('Test result fetch error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '결과를 가져오는데 실패했습니다'
    }, { status: 500 });
  }
} 