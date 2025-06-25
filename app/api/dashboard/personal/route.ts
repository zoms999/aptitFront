import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/db';
import { authOptions } from '../../../../lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // 세션 정보 자세히 출력
    console.log('일반회원 대시보드 - 세션 정보:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      console.log('일반회원 대시보드 - 인증되지 않은 세션');
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    let ac_gid;
    
    // session.user에서 사용자 정보 확인
    console.log('일반회원 대시보드 - 사용자 상세 정보:', JSON.stringify(session.user, null, 2));
    const userAny = session.user as any;
    
    // 세션에 필수 필드 검증
    if (userAny.id && userAny.ac_id) {
      ac_gid = userAny.id;
      console.log('일반회원 대시보드 - ac_gid 확인:', ac_gid);
      
      // 일반 회원 여부 검증
      try {
        const validateResult = await prisma.$queryRaw`
          SELECT ins_seq FROM mwd_account 
          WHERE ac_gid = ${ac_gid}::uuid
          AND ac_use = 'Y'
        `;
        
        console.log('일반회원 대시보드 - 계정 검증 결과:', JSON.stringify(validateResult, null, 2));
        
        if (!Array.isArray(validateResult) || validateResult.length === 0) {
          return NextResponse.json({ error: '계정 정보를 찾을 수 없습니다.' }, { status: 404 });
        }
        
        const ins_seq = validateResult[0].ins_seq;
        if (ins_seq !== -1) {
          return NextResponse.json({ error: '일반 회원 계정이 아닙니다.' }, { status: 403 });
        }
      } catch (queryError) {
        console.error('일반회원 대시보드 - 계정 검증 오류:', queryError);
        throw queryError;
      }
    } else {
      console.log('일반회원 대시보드 - 세션 정보 불완전');
      return NextResponse.json({ 
        error: '인증 정보가 불완전합니다. 로그아웃 후 다시 로그인해주세요.', 
        requireLogin: true,
        forceLogout: true
      }, { status: 401 });
    }
    
    // 사용자 데이터 조회
    try {
      // 1. 계정 상태 조회
      const accountStatusResult = await prisma.$queryRaw`
        SELECT cr_pay, pd_kind, expire, state 
        FROM (
          SELECT ac.ac_gid, 
              row_number() OVER (ORDER BY cr.cr_seq DESC) rnum,
              COALESCE(cr.cr_pay, 'N') cr_pay, 
              COALESCE(cr.pd_kind, '') pd_kind,
              CASE 
                  WHEN ac.ac_expire_date >= now() THEN 'Y' 
                  ELSE 'N' 
              END expire,
              COALESCE(ap.anp_done, 'R') state
          FROM mwd_person pe, mwd_account ac
          LEFT JOIN mwd_choice_result cr ON cr.ac_gid = ac.ac_gid
          LEFT JOIN mwd_answer_progress ap ON ap.cr_seq = cr.cr_seq
          WHERE ac.ac_gid = ${ac_gid}::uuid
            AND pe.pe_seq = ac.pe_seq 
            AND ac.ac_use = 'Y'
        ) t 
        WHERE rnum = 1
      `;
      
      // 2. 검사 목록 조회
      const testsResult = await prisma.$queryRaw`
        SELECT row_number() OVER (ORDER BY cr.cr_seq DESC) AS num, 
              cr.cr_seq, 
              cr.cr_pay, 
              pr.pd_name,
              COALESCE(ap.anp_seq, -1) AS anp_seq, 
              COALESCE(TO_CHAR(ap.anp_start_date, 'yyyy-mm-dd hh24:mi:ss'), '') AS startdate,
              COALESCE(TO_CHAR(ap.anp_end_date, 'yyyy-mm-dd'), '') AS enddate,
              COALESCE(ap.anp_done, 'R') AS done,
              CASE 
                  WHEN cr.pd_kind = 'basic' 
                      AND ac.ac_expire_date >= now() 
                      AND COALESCE(ap.anp_done, '') = 'E' THEN 'Y'
                  WHEN cr.pd_kind = 'basic' 
                      AND ac.ac_expire_date <= now() THEN 'E'
                  WHEN cr.pd_kind LIKE 'premium%' 
                      AND COALESCE(ap.anp_done, '') = 'E' THEN 'P'
                  ELSE 'N'
              END AS rview,
              TO_CHAR(ac.ac_expire_date, 'yyyy-mm-dd') AS expiredate
        FROM mwd_product pr, mwd_account ac, mwd_choice_result cr
        LEFT JOIN mwd_answer_progress ap ON ap.cr_seq = cr.cr_seq
        WHERE ac.ac_gid = ${ac_gid}::uuid
          AND cr.ac_gid = ac.ac_gid 
          AND pr.pd_num = cr.pd_num
      `;
      
      // 3. 사용자 정보 조회
      const userInfoResult = await prisma.$queryRaw`
        SELECT pe.pe_name, pe.pe_sex, pe.pe_email, pe.pe_cellphone,
              pe.pe_birth_year, pe.pe_birth_month, pe.pe_birth_day
        FROM mwd_account ac
        JOIN mwd_person pe ON ac.pe_seq = pe.pe_seq
        WHERE ac.ac_gid = ${ac_gid}::uuid
        AND ac.ac_use = 'Y'
      `;
      
      //console.log('일반회원 대시보드 - 사용자 정보 조회 결과:', JSON.stringify(userInfoResult, null, 2));
      
      if (!Array.isArray(userInfoResult) || userInfoResult.length === 0) {
        return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
      }
      
      // 4. 완료된 검사 수 계산
      const completedTests = Array.isArray(testsResult) 
        ? testsResult.filter(test => test.done === 'E').length 
        : 0;
      
      // BigInt 값을 문자열로 변환하는 함수
      const convertBigIntToString = (obj: unknown): unknown => {
        if (obj === null || obj === undefined) return obj;
        
        if (typeof obj === 'bigint') {
          return obj.toString();
        }
        
        if (Array.isArray(obj)) {
          return obj.map(item => convertBigIntToString(item));
        }
        
        if (typeof obj === 'object') {
          const result: Record<string, unknown> = {};
          for (const key in obj) {
            result[key] = convertBigIntToString((obj as Record<string, unknown>)[key]);
          }
          return result;
        }
        
        return obj;
      };
      
      // 결과 처리
      const safeAccountStatus = Array.isArray(accountStatusResult) && accountStatusResult.length > 0 
        ? convertBigIntToString(accountStatusResult[0])
        : { cr_pay: 'N', pd_kind: '', expire: 'N', state: 'R' };
        
      const safeTests = Array.isArray(testsResult) 
        ? convertBigIntToString(testsResult)
        : [];
        
      const safeUserInfo = Array.isArray(userInfoResult) && userInfoResult.length > 0
        ? convertBigIntToString(userInfoResult[0])
        : null;
      
      return NextResponse.json({
        accountStatus: safeAccountStatus,
        tests: safeTests,
        completedTests,
        userInfo: safeUserInfo,
        isOrganization: false
      });
      
    } catch (queryError) {
      console.error('일반회원 대시보드 - 데이터 조회 오류:', queryError);
      throw queryError;
    }
  } catch (error) {
    console.error('일반회원 대시보드 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '일반회원 대시보드 정보를 가져오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 