import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '../../../lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    // 사용자 타입 확인 (user 객체에 type 속성이 있는지 검사)
    let pdType = 'person';
    if ('type' in session.user && session.user.type === 'organization') {
      pdType = 'institute';
    }
    
    // 사용 가능한 상품만 조회 (pd_use = 'Y')
    const products = await db.$queryRaw`
      SELECT 
        pd_num,
        pd_price,
        pd_dc,
        pd_name,
        pd_type,
        pd_quota,
        pd_virtual_expire_at,
        pd_use,
        pd_kind
      FROM 
        mwd_product
      WHERE 
        pd_type = ${pdType}
        AND pd_use = 'Y'
      ORDER BY
        pd_price ASC
    `;
    
    return NextResponse.json(products);
    
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '상품 목록을 가져오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 