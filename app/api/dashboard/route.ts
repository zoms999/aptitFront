import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '../../../lib/db/prisma';

export async function GET() {
  try {
    // 테스트 모드 활성화 - 개발 환경에서만 사용
    const isTestMode = process.env.NODE_ENV === 'development';
    
    const session = await getServerSession();
    console.log('Session info:', JSON.stringify(session, null, 2));
    
    // 테스트 모드일 경우 인증 우회 가능
    if ((!session || !session.user) && !isTestMode) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    // 테스트 모드이거나 실제 인증된 세션이 있을 경우 계속 진행
    let ac_gid;
    
    if (isTestMode && (!session || !session.user)) {
      console.log('Test mode enabled, using test account');
      // 테스트용 계정 데이터 반환
      return getTestDashboardData();
    } else {
      // session.user에서 사용자 정보 확인
      console.log('Session user info:', session?.user);
      
      // session에 email이 있는지 확인
      if (session?.user?.email) {
        try {
          // 이메일로 사용자 계정 ID 조회
          const userEmail = session.user.email;
          console.log('Looking up account by email:', userEmail);
          
          // 1. 이메일로 person 테이블에서 pe_seq 찾기
          const personResult = await db.$queryRaw`
            SELECT pe_seq FROM mwd_person WHERE pe_email = ${userEmail}
          `;
          
          console.log('Person query result:', JSON.stringify(personResult, null, 2));
          
          if (!Array.isArray(personResult) || personResult.length === 0) {
            if (isTestMode) {
              return getTestDashboardData();
            }
            return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
          }
          
          const pe_seq = personResult[0].pe_seq;
          
          // 2. pe_seq로 account 테이블에서 ac_gid 찾기
          const accountResult = await db.$queryRaw`
            SELECT ac_gid FROM mwd_account 
            WHERE pe_seq = ${pe_seq}
            AND ac_use = 'Y'
          `;
          
          console.log('Account query result:', JSON.stringify(accountResult, null, 2));
          
          if (!Array.isArray(accountResult) || accountResult.length === 0) {
            if (isTestMode) {
              return getTestDashboardData();
            }
            return NextResponse.json({ error: '계정 정보를 찾을 수 없습니다.' }, { status: 404 });
          }
          
          ac_gid = accountResult[0].ac_gid;
        } catch (queryError) {
          console.error('Query error:', queryError);
          if (isTestMode) {
            return getTestDashboardData();
          }
          throw queryError;
        }
      } else if (session?.user?.name && isTestMode) {
        // 테스트 모드에서 이름만 있는 경우 (개발용)
        console.log('Only name available in test mode');
        return getTestDashboardData();
      } else {
        if (isTestMode) {
          return getTestDashboardData();
        }
        return NextResponse.json({ error: '사용자 이메일 정보가 없습니다.' }, { status: 400 });
      }
    }
    
    // 1. 계정 상태 조회
    const accountStatusResult = await db.$queryRaw`
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
        WHERE ac.ac_gid = ${ac_gid}
          AND pe.pe_seq = ac.pe_seq 
          AND ac.ac_use = 'Y'
      ) t 
      WHERE rnum = 1
    `;
    
    // 2. 검사 목록 조회
    const testsResult = await db.$queryRaw`
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
      WHERE ac.ac_gid = ${ac_gid}
        AND cr.ac_gid = ac.ac_gid 
        AND pr.pd_num = cr.pd_num
    `;
    
    // 3. 완료된 검사 수 계산
    const completedTests = Array.isArray(testsResult) 
      ? testsResult.filter(test => test.done === 'E').length 
      : 0;
    
    return NextResponse.json({
      accountStatus: Array.isArray(accountStatusResult) && accountStatusResult.length > 0 
        ? accountStatusResult[0] 
        : { cr_pay: 'N', pd_kind: '', expire: 'N', state: 'R' },
      tests: Array.isArray(testsResult) ? testsResult : [],
      completedTests
    });
    
  } catch (error) {
    console.error('대시보드 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '대시보드 정보를 가져오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
}

// 테스트 데이터 반환 함수
function getTestDashboardData() {
  console.log('Returning test data for dashboard');
  return NextResponse.json({
    accountStatus: { 
      cr_pay: 'Y', 
      pd_kind: 'basic', 
      expire: 'Y', 
      state: 'E' 
    },
    tests: [
      {
        num: 1,
        cr_seq: 100,
        cr_pay: 'Y',
        pd_name: '테스트 검사',
        anp_seq: 101,
        startdate: '2023-08-01 10:00:00',
        enddate: '2023-08-03',
        done: 'E',
        rview: 'Y',
        expiredate: '2024-08-01'
      },
      {
        num: 2,
        cr_seq: 101,
        cr_pay: 'Y',
        pd_name: '진행 중인 검사',
        anp_seq: 102,
        startdate: '2023-09-15 09:30:00',
        enddate: '',
        done: 'R',
        rview: 'N',
        expiredate: '2024-09-15'
      }
    ],
    completedTests: 1
  });
} 