import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/db';
import { authOptions } from '../../../lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // 세션 정보 확인
    console.log('대시보드 라우팅 - 세션 정보:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      console.log('대시보드 라우팅 - 인증되지 않은 세션');
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    let ac_gid;
    let ins_seq = -1;
    let userType;
    
    // session.user에서 사용자 정보 확인
    console.log('대시보드 라우팅 - 사용자 상세 정보:', JSON.stringify(session.user, null, 2));
    const userAny = session.user as { id?: string; ac_id?: string; type?: string };
    
    // 세션에 필수 필드 검증
    if (userAny.id && userAny.ac_id) {
      ac_gid = userAny.id;
      userType = userAny.type;
      console.log('대시보드 라우팅 - ac_gid 확인:', ac_gid, 'userType:', userType);
      
      // 기관 여부 검증
      try {
        const validateResult = await prisma.$queryRaw`
          SELECT ins_seq FROM mwd_account 
          WHERE ac_gid = ${ac_gid}::uuid
          AND ac_use = 'Y'
        `;
        
        console.log('대시보드 라우팅 - 계정 검증 결과:', JSON.stringify(validateResult, null, 2));
        
        if (Array.isArray(validateResult) && validateResult.length > 0) {
          ins_seq = validateResult[0].ins_seq;
        } else {
          return NextResponse.json({ error: '계정 정보를 찾을 수 없습니다.' }, { status: 404 });
        }
      } catch (queryError) {
        console.error('대시보드 라우팅 - 계정 검증 오류:', queryError);
        throw queryError;
      }
    } else {
      console.log('대시보드 라우팅 - 세션 정보 불완전');
      return NextResponse.json({ 
        error: '인증 정보가 불완전합니다. 로그아웃 후 다시 로그인해주세요.', 
        requireLogin: true,
        forceLogout: true
      }, { status: 401 });
    }
    
    console.log('대시보드 라우팅 - 사용자 정보 확인 완료:', { ac_gid, ins_seq, userType });
    
    // 사용자 타입에 따라 적절한 대시보드로 라우팅
    if (userType === 'organization_admin' || userType === 'organization_member') {
      // 기관 계정인 경우 - 기관 대시보드로 라우팅
      console.log('기관 대시보드로 라우팅 (타입:', userType, ')');
      
      // 기관 대시보드 API로 내부 리다이렉트
      return NextResponse.json({
        redirect: '/api/dashboard/organization',
        userType: userType,
        isOrganization: true
      });
      
    } else {
      // 일반 회원인 경우 - 개인 대시보드로 라우팅
      console.log('개인 대시보드로 라우팅');
      
      // 개인 대시보드 API로 내부 리다이렉트
      return NextResponse.json({
        redirect: '/api/dashboard/personal',
        userType: 'personal',
        isOrganization: false
      });
    }
    
  } catch (error) {
    console.error('대시보드 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '대시보드 정보를 가져오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 