import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '../../../../lib/db/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    // URL에서 cr_seq 파라미터 추출
    const { searchParams } = new URL(request.url);
    const crSeq = searchParams.get('cr_seq');
    
    if (!crSeq) {
      return NextResponse.json({ error: '결제 정보가 없습니다.' }, { status: 400 });
    }
    
    // 결제 정보 조회
    const paymentInfo = await db.$queryRaw`
      SELECT 
        cr.cr_seq,
        pd.pd_name as orderName,
        COALESCE(pd.pd_price, 30000) as amount,
        pd.pd_kind as productType
      FROM 
        mwd_choice_result cr
        JOIN mwd_product pd ON cr.pd_seq = pd.pd_seq
      WHERE 
        cr.cr_seq = ${crSeq}::integer
    `;
    
    if (!Array.isArray(paymentInfo) || paymentInfo.length === 0) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json(paymentInfo[0]);
    
  } catch (error) {
    console.error('결제 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '결제 정보를 가져오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 