import { NextResponse } from 'next/server';
import { db } from '../../../lib/db/prisma';

// 결과 타입 정의
interface InstituteInfo {
  ins_name: string;
  ins_seq: number;
  tur_seq: number;
  tur_use: string;
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ valid: false, message: '회차코드를 입력해주세요.' }, { status: 400 });
    }
    
    // 1. 기관 및 차수 정보 조회 (유효성검사)
    const result = await db.$queryRaw<InstituteInfo[]>`
      SELECT ins.ins_name, tur.ins_seq, tur.tur_seq, tur.tur_use
      FROM mwd_institute ins, mwd_institute_turn tur
      WHERE ins.ins_seq = tur.ins_seq
        AND tur_code = ${code}
    `;
    
    // 결과가 배열이고 비어있으면 유효하지 않은 코드
    if (!Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ valid: false, message: '유효하지 않은 회차코드입니다.' }, { status: 404 });
    }
    
    const instituteInfo = result[0];
    
    if (instituteInfo.tur_use !== 'Y') {
      return NextResponse.json({ valid: false, message: '사용할 수 없는 회차코드입니다.' }, { status: 403 });
    }
    
    return NextResponse.json({
      valid: true,
      instituteName: instituteInfo.ins_name,
      insSeq: instituteInfo.ins_seq,
      turSeq: instituteInfo.tur_seq
    });
    
  } catch (error) {
    console.error('회차코드 확인 오류:', error);
    return NextResponse.json({ valid: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 