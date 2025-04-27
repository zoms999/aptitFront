import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '../../../../lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: '인증되지 않았습니다.' 
      }, { status: 401 });
    }
    
    console.log('결제 준비 요청 시작');
    
    // 요청 바디에서 필요한 데이터 추출
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('요청 데이터 파싱 오류:', parseError);
      return NextResponse.json({ 
        success: false, 
        message: '잘못된 요청 형식입니다.' 
      }, { status: 400 });
    }
    
    const { 
      orderId, 
      amount, 
      orderName, 
      acGid, 
      productId,
      productType,
      paymentMethod
    } = requestData;
    
    // 필수 파라미터 검증
    if (!orderId || !amount || !orderName || !acGid) {
      return NextResponse.json({ 
        success: false, 
        message: '필수 결제 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    try {
      // 주문 ID 중복 체크
      const orderExists = await db.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS(SELECT 1 FROM mwd_payment WHERE order_id = ${orderId}) as exists
      `;
      
      if (orderExists[0].exists) {
        return NextResponse.json({ 
          success: false, 
          message: '이미 존재하는 주문번호입니다.' 
        }, { status: 400 });
      }

      // 사용자 계정 확인
      const accountExists = await db.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS(SELECT 1 FROM mwd_account WHERE ac_gid = ${acGid}::uuid) as exists
      `;
      
      if (!accountExists[0].exists) {
        return NextResponse.json({ 
          success: false, 
          message: '유효하지 않은 계정입니다.' 
        }, { status: 400 });
      }

      // choice_result 테이블에 결제 전 데이터 추가 또는 업데이트
      let crSeq: number;
      
      // 기존 choice_result 레코드 확인
      const existingResult = await db.$queryRaw<{ cr_seq: number }[]>`
        SELECT cr_seq FROM mwd_choice_result 
        WHERE ac_gid = ${acGid}::uuid AND cr_pay = 'N'
        ORDER BY cr_seq DESC 
        LIMIT 1
      `;
      
      if (existingResult.length > 0) {
        // 기존 레코드 업데이트
        crSeq = existingResult[0].cr_seq;
        await db.$queryRaw`
          UPDATE mwd_choice_result
          SET pd_num = ${productId ? parseInt(productId, 10) : 0}::smallint,
              pd_kind = ${productType || 'basic'},
              pd_price = ${amount},
              order_id = ${orderId}
          WHERE ac_gid = ${acGid}::uuid AND cr_seq = ${crSeq}
        `;
      } else {
        // 새 레코드 생성
        const newResult = await db.$queryRaw<{ cr_seq: number }[]>`
          INSERT INTO mwd_choice_result (
            ac_gid, cr_seq, cr_duty, cr_study, cr_subject, cr_image,
            pd_num, pd_kind, pd_price, cr_pay, order_id
          )
          VALUES (
            ${acGid}::uuid, 
            (SELECT COALESCE(MAX(cr_seq), 0) + 1 FROM mwd_choice_result WHERE ac_gid = ${acGid}::uuid), 
            'Y', 'Y', 'Y', 'Y',
            ${productId ? parseInt(productId, 10) : 0}::smallint,
            ${productType || 'basic'},
            ${amount},
            'N',
            ${orderId}
          )
          RETURNING cr_seq
        `;
        crSeq = newResult[0].cr_seq;
      }
      
      // mwd_payment 테이블에 결제 정보 추가
      await db.$queryRaw`
        INSERT INTO mwd_payment (
          ac_gid,
          cr_seq,
          order_id,
          amount,
          method,
          status,
          requested_at
        )
        VALUES (
          ${acGid}::uuid,
          ${crSeq},
          ${orderId},
          ${amount},
          ${paymentMethod || null},
          'READY',
          now()
        )
      `;
      
      // 결제 데이터 로그 기록
      await db.$queryRaw`
        INSERT INTO mwd_payment_log (
          order_id, 
          amount, 
          order_name, 
          ac_gid, 
          product_id, 
          product_type, 
          payment_method,
          status,
          event_type
        ) VALUES (
          ${orderId}, 
          ${amount}, 
          ${orderName}, 
          ${acGid}::uuid, 
          ${productId ? parseInt(productId, 10) : null}, 
          ${productType || 'basic'}, 
          ${paymentMethod || ''},
          'READY',
          'PAYMENT_READY'
        )
      `;
      
      return NextResponse.json({ 
        success: true, 
        message: '결제 준비가 완료되었습니다.',
        orderId,
        amount,
        orderName: orderName || '기본 검사 프로그램',
        customerKey: acGid,
      });
    } catch (dbError) {
      console.error('데이터베이스 작업 오류:', dbError);
      return NextResponse.json({ 
        success: false, 
        message: '결제 준비 중 데이터베이스 오류가 발생했습니다.',
        error: dbError instanceof Error ? dbError.message : '알 수 없는 오류'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('결제 준비 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: '결제 준비 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 