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

    // 회차코드 검증 쿼리
    const result = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM mwd_institute_turn 
        WHERE tur_code = ${code} 
        AND tur_use = 'Y'
      ) as exists
    `;
    
    const isValid = result[0].exists;
    
    if (isValid) {
      // 회차 정보 조회
      const turnInfo = await db.$queryRaw<{ ins_seq: number, tur_seq: number, ins_name: string, tur_use: string }[]>`
        SELECT ins.ins_name, tur.ins_seq, tur.tur_seq, tur.tur_use 
        FROM mwd_institute ins, mwd_institute_turn tur
        WHERE ins.ins_seq = tur.ins_seq
        AND tur_code = ${code} 
        AND tur_use = 'Y'
      `;
      
      if (turnInfo.length > 0) {
        // 응답 객체 생성
        const response = NextResponse.json({ 
          valid: true, 
          message: '유효한 회차코드입니다.',
          instituteSeq: turnInfo[0].ins_seq,
          turnSeq: turnInfo[0].tur_seq,
          instituteName: turnInfo[0].ins_name,
          turnUse: turnInfo[0].tur_use
        });
        
        // 쿠키에 기관 정보 저장 (1시간 유효)
        const maxAge = 60 * 60; // 1시간
        const secure = process.env.NODE_ENV === 'production';
        
        response.cookies.set('institute_seq', String(turnInfo[0].ins_seq), { 
          maxAge,
          path: '/',
          secure,
          httpOnly: false,
          sameSite: 'lax'
        });
        
        response.cookies.set('turn_seq', String(turnInfo[0].tur_seq), { 
          maxAge,
          path: '/',
          secure,
          httpOnly: false,
          sameSite: 'lax'
        });
        
        response.cookies.set('institute_name', turnInfo[0].ins_name, { 
          maxAge,
          path: '/',
          secure,
          httpOnly: false,
          sameSite: 'lax'
        });
        
        return response;
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