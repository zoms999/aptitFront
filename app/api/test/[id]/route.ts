import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/db';
import { authOptions } from '../../../../lib/auth';

// 사용자 타입 정의
interface UserSession {
  name?: string;
  id: string;
  type: string;
  ac_id: string;
  isPaid?: boolean;
  productType?: string;
  isExpired?: boolean;
  state?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // 세션 확인
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    // params 해결
    const resolvedParams = await params;
    
    // 파라미터 검증
    const testId = resolvedParams.id;
    if (!testId || isNaN(Number(testId))) {
      return NextResponse.json({ error: '유효하지 않은 테스트 ID입니다.' }, { status: 400 });
    }

    const userSession = session.user as UserSession;
    const ac_gid = userSession.id;
    
    if (!ac_gid) {
      return NextResponse.json({ error: '계정 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 테스트 데이터 조회
    const testResult = await prisma.$queryRaw`
      SELECT cr.cr_seq, 
             pr.pd_name,
             pr.pd_num,
             cr.pd_kind,
             COALESCE(ap.anp_seq, -1) AS anp_seq, 
             COALESCE(ap.anp_done, 'R') AS done,
             TO_CHAR(ac.ac_expire_date, 'yyyy-mm-dd') AS expiredate
      FROM mwd_product pr, mwd_account ac, mwd_choice_result cr
      LEFT JOIN mwd_answer_progress ap ON ap.cr_seq = cr.cr_seq
      WHERE cr.cr_seq = ${Number(testId)}
        AND cr.ac_gid = ${ac_gid}::uuid
        AND ac.ac_gid = cr.ac_gid
        AND pr.pd_num = cr.pd_num
    `;
    
    if (!testResult || !Array.isArray(testResult) || testResult.length === 0) {
      return NextResponse.json({ error: '테스트 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // BigInt 값을 문자열로 변환하는 함수
    const convertBigIntToString = (obj: unknown): unknown => {
      if (obj === null || obj === undefined) return obj;
      
      if (typeof obj === 'bigint') {
        return obj.toString();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => convertBigIntToString(item));
      }
      
      if (typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const key in obj) {
          result[key] = convertBigIntToString((obj as Record<string, unknown>)[key]);
        }
        return result;
      }
      
      return obj;
    };
    
    // 결과 처리
    const testData = convertBigIntToString(testResult[0]);
    
    return NextResponse.json(testData);
    
  } catch (error) {
    console.error('테스트 데이터 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 