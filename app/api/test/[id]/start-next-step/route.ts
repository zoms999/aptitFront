import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../../lib/db';
import { authOptions } from '../../../../../lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 로그인 세션 확인
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const userId = session.user.id;
    const resolvedParams = await params;
    const testId = parseInt(resolvedParams.id, 10);
    
    const { currentStep, anpSeq } = await request.json();

    if (isNaN(testId)) {
      return NextResponse.json({ error: '유효하지 않은 테스트 ID입니다' }, { status: 400 });
    }

    console.log(`다음 단계 시작 API 호출 - 테스트 ID: ${testId}, 사용자: ${userId}, 현재 단계: ${currentStep}, anpSeq: ${anpSeq}`);

    // 다음 단계 결정
    const getNextStep = (current: string): string => {
      switch (current) {
        case 'tnd': return 'thk';
        case 'thk': return 'img';
        case 'img': return 'completed';
        default: return 'tnd';
      }
    };

    const nextStep = getNextStep(currentStep);

    if (nextStep === 'completed') {
      return NextResponse.json({ 
        success: true, 
        message: '모든 단계가 완료되었습니다',
        nextStep: 'completed'
      });
    }

    // mwd_answer_progress 테이블 업데이트
    try {
      const updateResult = await prisma.$queryRaw`
        UPDATE mwd_answer_progress 
        SET 
          qu_code = ${nextStep + '01010'},
          anp_step = ${nextStep},
          anp_done = 'R'
        WHERE anp_seq = ${anpSeq}
          AND ac_gid = ${userId}::uuid
        RETURNING anp_seq, qu_code, anp_step
      `;

      if (!Array.isArray(updateResult) || updateResult.length === 0) {
        throw new Error('진행 상태 업데이트에 실패했습니다');
      }

      const updatedProgress = updateResult[0];
      console.log('진행 상태 업데이트 완료:', updatedProgress);

      return NextResponse.json({
        success: true,
        message: `${nextStep} 단계로 전환되었습니다`,
        nextStep: nextStep,
        updatedProgress: updatedProgress
      });

    } catch (dbError) {
      console.error('데이터베이스 업데이트 오류:', dbError);
      return NextResponse.json({ 
        error: '진행 상태 업데이트 중 오류가 발생했습니다' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('다음 단계 시작 API 오류:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' 
    }, { status: 500 });
  }
} 