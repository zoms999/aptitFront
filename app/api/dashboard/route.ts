import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '../../../lib/db/prisma';

// 세션 타입 확장
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      ac_id?: string;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // 세션 정보 확인
    console.log('대시보드 라우팅 - 세션 정보:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      console.log('대시보드 라우팅 - 인증되지 않은 세션');
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    let ac_gid;
    let ins_seq = -1;
    
    // session.user에서 사용자 정보 확인
    console.log('대시보드 라우팅 - 사용자 상세 정보:', JSON.stringify(session.user, null, 2));
    const userAny = session.user as Record<string, unknown>;
    
    try {
      // 계정 정보 조회하여 기관 여부 확인
      if (userAny.ac_id) {
        console.log('대시보드 라우팅 - ac_id로 조회:', userAny.ac_id);
        // ac_id로 조회
        const accountResult = await db.$queryRaw`
          SELECT ac_gid, ins_seq FROM mwd_account 
          WHERE ac_id = ${userAny.ac_id as string}
          AND ac_use = 'Y'
        `;
        
        console.log('대시보드 라우팅 - ac_id 조회 결과:', JSON.stringify(accountResult, null, 2));
        
        if (Array.isArray(accountResult) && accountResult.length > 0) {
          ac_gid = accountResult[0].ac_gid;
          ins_seq = accountResult[0].ins_seq;
        }
      } else if (userAny.id) {
        console.log('대시보드 라우팅 - id로 조회:', userAny.id);
        // id(ac_gid)로 조회
        ac_gid = userAny.id as string;
        const validateResult = await db.$queryRaw`
          SELECT ins_seq FROM mwd_account 
          WHERE ac_gid = ${ac_gid}::uuid
          AND ac_use = 'Y'
        `;
        
        console.log('대시보드 라우팅 - id 조회 결과:', JSON.stringify(validateResult, null, 2));
        
        if (Array.isArray(validateResult) && validateResult.length > 0) {
          ins_seq = validateResult[0].ins_seq;
        }
      } else if (session.user.email) {
        console.log('대시보드 라우팅 - 이메일로 조회:', session.user.email);
        // 이메일로 조회
        const userEmail = session.user.email;
        
        // 1. 이메일로 person 테이블에서 pe_seq 찾기
        const personResult = await db.$queryRaw`
          SELECT pe_seq FROM mwd_person WHERE pe_email = ${userEmail}
        `;
        
        console.log('대시보드 라우팅 - 이메일(person) 조회 결과:', JSON.stringify(personResult, null, 2));
        
        if (Array.isArray(personResult) && personResult.length > 0) {
          const pe_seq = personResult[0].pe_seq;
          
          // 2. pe_seq로 account 테이블에서 정보 찾기
          const accountResult = await db.$queryRaw`
            SELECT ac_gid, ins_seq FROM mwd_account 
            WHERE pe_seq = ${pe_seq}
            AND ac_use = 'Y'
          `;
          
          console.log('대시보드 라우팅 - pe_seq 조회 결과:', JSON.stringify(accountResult, null, 2));
          
          if (Array.isArray(accountResult) && accountResult.length > 0) {
            ac_gid = accountResult[0].ac_gid;
            ins_seq = accountResult[0].ins_seq;
          }
        }
      } else if (session.user.name) {
        console.log('대시보드 라우팅 - 이름으로 조회:', session.user.name);
        // 이름으로 조회 (마지막 방법)
        const userName = session.user.name;
        
        // 이름으로 person 테이블에서 pe_seq 찾기
        const personResult = await db.$queryRaw`
          SELECT pe_seq FROM mwd_person WHERE pe_name = ${userName}
        `;
        
        console.log('대시보드 라우팅 - 이름(person) 조회 결과:', JSON.stringify(personResult, null, 2));
        
        if (Array.isArray(personResult) && personResult.length > 0) {
          const pe_seq = personResult[0].pe_seq;
          
          // pe_seq로 account 테이블에서 정보 찾기
          const accountResult = await db.$queryRaw`
            SELECT ac_gid, ins_seq FROM mwd_account 
            WHERE pe_seq = ${pe_seq}
            AND ac_use = 'Y'
          `;
          
          console.log('대시보드 라우팅 - 이름(account) 조회 결과:', JSON.stringify(accountResult, null, 2));
          
          if (Array.isArray(accountResult) && accountResult.length > 0) {
            ac_gid = accountResult[0].ac_gid;
            ins_seq = accountResult[0].ins_seq;
          }
        }
      }
      
      // 계정 정보를 찾지 못한 경우
      if (!ac_gid) {
        console.log('대시보드 라우팅 - 사용자 정보를 찾을 수 없음');
        return NextResponse.json({ 
          error: '사용자 정보를 찾을 수 없습니다.',
          session: session.user
        }, { status: 404 });
      }
      
      console.log('대시보드 라우팅 - 사용자 정보 확인 완료:', { ac_gid, ins_seq });
      
      // 기관 계정 여부에 따라 적절한 API 호출 및 데이터 반환
      if (ins_seq !== -1) {
        // 기관 회원인 경우 - 직접 기관 대시보드 로직 호출
        console.log('기관 회원 대시보드로 라우팅');
        
        // 기관 정보 조회
        const instituteResult = await db.$queryRaw`
          SELECT ins.ins_seq, ins.ins_name, tur.tur_seq, tur.tur_code,
                tur.tur_req_sum, tur.tur_use_sum
          FROM mwd_account ac
          JOIN mwd_institute ins ON ac.ins_seq = ins.ins_seq
          JOIN mwd_institute_turn tur ON ins.ins_seq = tur.ins_seq
          WHERE ac.ac_gid = ${ac_gid}::uuid
          AND tur.tur_use = 'Y'
        `;
        
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
            WHERE ac.ac_gid = ${ac_gid}::uuid
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
          WHERE ac.ac_gid = ${ac_gid}::uuid
            AND cr.ac_gid = ac.ac_gid 
            AND pr.pd_num = cr.pd_num
        `;
        
        // 3. 기관 회원 목록 조회
        const membersResult = await db.$queryRaw`
          SELECT pe.pe_seq, pe.pe_name, pe.pe_email, pe.pe_sex, pe.pe_cellphone,
                TO_CHAR(im.mem_insert_date, 'yyyy-mm-dd') AS join_date
          FROM mwd_account ac
          JOIN mwd_institute ins ON ac.ins_seq = ins.ins_seq
          JOIN mwd_institute_turn tur ON ins.ins_seq = tur.ins_seq
          JOIN mwd_institute_member im ON tur.ins_seq = im.ins_seq AND tur.tur_seq = im.tur_seq
          JOIN mwd_person pe ON im.pe_seq = pe.pe_seq
          WHERE ac.ac_gid = ${ac_gid}::uuid
          AND tur.tur_use = 'Y'
          ORDER BY im.mem_insert_date DESC
        `;
        
        // 4. 완료된 검사 수 계산
        const completedTests = Array.isArray(testsResult) 
          ? testsResult.filter(test => test.done === 'E').length 
          : 0;
        
        // BigInt 값을 문자열로 변환하는 함수
        const convertBigIntToString = (obj: any): any => {
          if (obj === null || obj === undefined) return obj;
          
          if (typeof obj === 'bigint') {
            return obj.toString();
          }
          
          if (Array.isArray(obj)) {
            return obj.map(item => convertBigIntToString(item));
          }
          
          if (typeof obj === 'object') {
            const result: Record<string, any> = {};
            for (const key in obj) {
              result[key] = convertBigIntToString(obj[key]);
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
          
        const safeInstituteInfo = Array.isArray(instituteResult) && instituteResult.length > 0
          ? convertBigIntToString(instituteResult[0])
          : null;
          
        const safeMembers = Array.isArray(membersResult)
          ? convertBigIntToString(membersResult)
          : [];
        
        return NextResponse.json({
          accountStatus: safeAccountStatus,
          tests: safeTests,
          completedTests,
          instituteInfo: safeInstituteInfo,
          members: safeMembers,
          isOrganization: true
        });
        
      } else {
        // 일반 회원인 경우 - 직접 개인 대시보드 로직 호출
        console.log('일반 회원 대시보드로 라우팅');
        
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
            WHERE ac.ac_gid = ${ac_gid}::uuid
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
          WHERE ac.ac_gid = ${ac_gid}::uuid
            AND cr.ac_gid = ac.ac_gid 
            AND pr.pd_num = cr.pd_num
        `;
        
        // 3. 사용자 정보 조회
        const userInfoResult = await db.$queryRaw`
          SELECT pe.pe_name, pe.pe_sex, pe.pe_email, pe.pe_cellphone,
                pe.pe_birth_year, pe.pe_birth_month, pe.pe_birth_day
          FROM mwd_account ac
          JOIN mwd_person pe ON ac.pe_seq = pe.pe_seq
          WHERE ac.ac_gid = ${ac_gid}::uuid
          AND ac.ac_use = 'Y'
        `;
        
        // 4. 완료된 검사 수 계산
        const completedTests = Array.isArray(testsResult) 
          ? testsResult.filter(test => test.done === 'E').length 
          : 0;
        
        // BigInt 값을 문자열로 변환하는 함수
        const convertBigIntToString = (obj: any): any => {
          if (obj === null || obj === undefined) return obj;
          
          if (typeof obj === 'bigint') {
            return obj.toString();
          }
          
          if (Array.isArray(obj)) {
            return obj.map(item => convertBigIntToString(item));
          }
          
          if (typeof obj === 'object') {
            const result: Record<string, any> = {};
            for (const key in obj) {
              result[key] = convertBigIntToString(obj[key]);
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
      }
      
    } catch (error) {
      console.error('대시보드 라우팅 오류:', error);
      throw error;
    }
  } catch (error) {
    console.error('대시보드 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '대시보드 정보를 가져오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 