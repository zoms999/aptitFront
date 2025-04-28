import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db/prisma';

// 토스페이먼츠 시크릿 키
const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
const tossPaymentsApiUrl = 'https://api.tosspayments.com/v1/payments/confirm';

export async function POST(request: NextRequest) {
  try {
    console.log('결제 승인 요청 시작');
    
    // 요청 바디에서 필요한 데이터 추출
    const { paymentKey, orderId, amount } = await request.json();
    
    // 디버깅: 요청 데이터 로깅
    console.log('결제 승인 요청 데이터:', { paymentKey, orderId, amount });
    
    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ 
        success: false, 
        message: '필수 결제 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    // 결제 정보 조회 (주문번호로 결제 내역 확인)
    const paymentRecord = await db.$queryRaw<{ amount: number, ac_gid: string, cr_seq: number }[]>`
      SELECT * FROM mwd_payment WHERE order_id = ${orderId}
    `;
    
    // 디버깅: 조회된 결제 정보 로깅
    console.log('조회된 결제 정보:', JSON.stringify(paymentRecord));

    // 결제 정보가 존재하는지 확인
    if (!paymentRecord || paymentRecord.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '해당 주문 정보를 찾을 수 없습니다.' 
      }, { status: 400 });
    }

    // 결제 정보에서 ac_gid 가져오기
    const userGid = paymentRecord[0].ac_gid;
    const crSeq = paymentRecord[0].cr_seq;
    
    // 디버깅: 금액 타입 확인
    console.log('금액 타입 확인:', {
      requestAmount: amount,
      requestAmountType: typeof amount,
      dbAmount: paymentRecord[0].amount,
      dbAmountType: typeof paymentRecord[0].amount
    });

    // 결제 금액 검증 - 숫자 타입으로 변환하여 비교
    const requestAmount = parseInt(amount.toString(), 10);
    const dbAmount = parseInt(paymentRecord[0].amount.toString(), 10);
    
    if (requestAmount !== dbAmount) {
      return NextResponse.json({ 
        success: false, 
        message: `결제 금액이 일치하지 않습니다. (요청: ${requestAmount}, DB: ${dbAmount})` 
      }, { status: 400 });
    }
    
    // 토스페이먼츠 API 호출하여 결제 승인 요청
    console.log('토스페이먼츠 결제 승인 요청:', {
      paymentKey,
      orderId,
      amount: requestAmount
    });
    
    const response = await fetch(tossPaymentsApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: requestAmount
      })
    });

    // 토스페이먼츠 응답 처리
    const tossResponse = await response.json();
    console.log('토스페이먼츠 응답:', { 
      status: response.status, 
      ok: response.ok, 
      body: tossResponse 
    });
    
    if (!response.ok) {
      console.error('토스페이먼츠 결제 승인 실패:', tossResponse);
      
      // 결제 실패 정보 저장
      await db.$queryRaw`
        UPDATE mwd_payment
        SET status = 'FAILED', 
            fail_reason = ${tossResponse.message || '토스페이먼츠 API 오류'},
            payment_key = ${paymentKey}
        WHERE order_id = ${orderId}
      `;
      
      return NextResponse.json({ 
        success: false, 
        message: tossResponse.message || '결제 승인 중 오류가 발생했습니다.',
        code: tossResponse.code
      }, { status: response.status });
    }
    
    console.log('토스페이먼츠 결제 승인 성공:', tossResponse);
    
    // 트랜잭션 시작
    try {
      // 결제 정보 업데이트
      await db.$queryRaw`
        UPDATE mwd_payment
        SET status = 'DONE', 
            payment_key = ${paymentKey},
            method = ${tossResponse.method},
            approved_at = to_timestamp(${Math.floor(new Date().getTime() / 1000)})
        WHERE order_id = ${orderId}
      `;
      
      console.log('결제 정보 업데이트 완료');
      
      // choice_result 테이블 결제 완료 상태로 업데이트
      await db.$queryRaw`
        UPDATE mwd_choice_result
        SET cr_pay = 'Y',
            cr_paymentdate = now(),
            payment_status = 'DONE'
        WHERE ac_gid = ${userGid}::uuid AND cr_seq = ${crSeq}
      `;
      
      console.log('choice_result 업데이트 완료');
      
      // 결제 데이터 로그 기록 - 테이블 정의에 맞게 필수 필드 추가
      await db.$queryRaw`
        INSERT INTO mwd_payment_log (
          order_id, 
          amount, 
          order_name,
          ac_gid,
          status,
          created_at
        ) VALUES (
          ${orderId}, 
          ${requestAmount}, 
          ${tossResponse.orderName || '결제 완료'},
          ${userGid}::uuid,
          'DONE',
          now()
        )
      `;
      
      console.log('결제 로그 기록 완료');
      
    } catch (dbError) {
      console.error('데이터베이스 업데이트 오류:', dbError);
      return NextResponse.json({ 
        success: false, 
        message: '결제 정보 저장 중 오류가 발생했습니다.',
        error: dbError instanceof Error ? dbError.message : '데이터베이스 오류'
      }, { status: 500 });
    }
    
    // 성공 응답 반환
    console.log('결제 승인 완료, 성공 응답 반환');
    return NextResponse.json({ 
      success: true, 
      message: '결제가 성공적으로 완료되었습니다.',
      orderId: tossResponse.orderId,
      method: tossResponse.method,
      totalAmount: tossResponse.totalAmount,
      balanceAmount: tossResponse.balanceAmount,
      paymentKey: tossResponse.paymentKey,
      approvedAt: tossResponse.approvedAt,
      receiptUrl: tossResponse.receipt?.url
    });
    
  } catch (error) {
    console.error('결제 승인 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: '결제 승인 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 