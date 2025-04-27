import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('결제 실패 로그 기록 시작');
    
    // 요청 바디에서 필요한 데이터 추출
    const { code, message, orderId } = await request.json();
    
    // 기본 검증
    if (!code || !message) {
      return NextResponse.json({ 
        success: false, 
        message: '필수 오류 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    // 오류 정보를 DB에 기록
    if (orderId) {
      // 이미 존재하는 결제 정보가 있는 경우 업데이트
      const paymentExists = await db.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS(SELECT 1 FROM mwd_payment WHERE order_id = ${orderId}) as exists
      `;
      
      if (paymentExists[0].exists) {
        await db.$queryRaw`
          UPDATE mwd_payment
          SET status = 'FAILED', 
              fail_reason = ${message}
          WHERE order_id = ${orderId}
        `;
      }
    }
    
    // 결제 실패 로그 저장
    await db.$queryRaw`
      INSERT INTO mwd_payment_log (
        order_id,
        event_type,
        code,
        message,
        ac_gid,
        status
      )
      VALUES (
        ${orderId || null},
        'PAYMENT_FAIL',
        ${code},
        ${message},
        (SELECT ac_gid FROM mwd_payment WHERE order_id = ${orderId}),
        'FAILED'
      )
    `;
    
    return NextResponse.json({ 
      success: true, 
      message: '결제 실패 정보가 기록되었습니다.'
    });
    
  } catch (error) {
    console.error('결제 실패 정보 기록 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: '결제 실패 정보 기록 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 