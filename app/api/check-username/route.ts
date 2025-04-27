import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

// 사용자 아이디 중복 확인 API
export async function POST(request: Request) {
  try {
    // 요청 본문에서 username 파라미터 추출
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { available: false, message: '아이디를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 데이터베이스에서 사용자 아이디 확인
    const existingAccount = await db.$queryRaw`
      SELECT ac_use FROM mwd_account WHERE ac_id = ${username.toLowerCase()}
    `;

    // 아이디가 존재하지 않으면 사용 가능
    const available = existingAccount.length === 0;

    return NextResponse.json({
      available,
      message: available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
    });

  } catch (error) {
    console.error('아이디 확인 중 오류 발생:', error);
    return NextResponse.json(
      { available: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 