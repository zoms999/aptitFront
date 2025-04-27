import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        message: '회차코드를 입력해주세요.' 
      });
    }

    // 회차코드 검증 쿼리 (예시)
    const result = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM mwd_institute_turn 
        WHERE itu_code = ${code} 
        AND itu_useyn = 'Y'
      ) as exists
    `;
    
    const isValid = result[0].exists;
    
    if (isValid) {
      // 회차 정보 조회 (추가 정보가 필요한 경우)
      const turnInfo = await db.$queryRaw<{ ins_seq: number, itu_seq: number, itu_title: string }[]>`
        SELECT ins_seq, itu_seq, itu_title 
        FROM mwd_institute_turn 
        WHERE itu_code = ${code} 
        AND itu_useyn = 'Y'
      `;
      
      if (turnInfo.length > 0) {
        return NextResponse.json({ 
          valid: true, 
          message: '유효한 회차코드입니다.',
          instituteSeq: turnInfo[0].ins_seq,
          turnSeq: turnInfo[0].itu_seq,
          turnTitle: turnInfo[0].itu_title
        });
      }
    }
    
    return NextResponse.json({ 
      valid: false, 
      message: '유효하지 않은 회차코드입니다.' 
    });
  } catch (error) {
    console.error('회차코드 검증 오류:', error);
    return NextResponse.json({ 
      valid: false, 
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 