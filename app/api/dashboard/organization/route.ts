import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '../../../../lib/db/prisma';

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

export async function GET() {
  try {
    const session = await getServerSession();
    
    // 세션 정보 자세히 출력
    console.log('기관회원 대시보드 - 세션 정보:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    let ac_gid;
    
    // session.user에서 사용자 정보 확인
    console.log('기관회원 대시보드 - 사용자 정보:', JSON.stringify(session.user, null, 2));
    
    // session에 ac_id가 있는지 확인 (타입 단언 사용)
    const userAny = session.user as Record<string, unknown>;
    
    if (userAny.ac_id) {
      try {
        // ac_id로 사용자 계정 조회
        const accountResult = await db.$queryRaw`
          SELECT ac_gid, ins_seq FROM mwd_account 
          WHERE ac_id = ${userAny.ac_id}
          AND ac_use = 'Y'
        `;
        
        console.log('기관회원 대시보드 - ac_id로 계정 조회 결과:', JSON.stringify(accountResult, null, 2));
        
        if (!Array.isArray(accountResult) || accountResult.length === 0) {
          return NextResponse.json({ error: '계정 정보를 찾을 수 없습니다.' }, { status: 404 });
        }
        
        ac_gid = accountResult[0].ac_gid;
        
        // 기관 회원 확인 - ins_seq가 -1이 아니어야 함
        const ins_seq = accountResult[0].ins_seq;
        if (ins_seq === -1) {
          return NextResponse.json({ error: '기관 회원 계정이 아닙니다.' }, { status: 403 });
        }
        
      } catch (queryError) {
        console.error('기관회원 대시보드 - 계정 조회 오류:', queryError);
        throw queryError;
      }
    } else if (userAny.id) {
      // id가 ac_gid인 경우
      try {
        ac_gid = userAny.id;
        console.log('기관회원 대시보드 - id를 ac_gid로 사용:', ac_gid);
        
        // ac_gid 유효성 검증 및 기관 회원 확인
        const validateResult = await db.$queryRaw`
          SELECT ac_gid, ins_seq FROM mwd_account 
          WHERE ac_gid = ${ac_gid}::uuid
          AND ac_use = 'Y'
        `;
        
        if (!Array.isArray(validateResult) || validateResult.length === 0) {
          return NextResponse.json({ error: '계정 정보를 찾을 수 없습니다.' }, { status: 404 });
        }
        
        // 기관 회원 확인 - ins_seq가 -1이 아니어야 함
        const ins_seq = validateResult[0].ins_seq;
        if (ins_seq === -1) {
          return NextResponse.json({ error: '기관 회원 계정이 아닙니다.' }, { status: 403 });
        }
        
      } catch (queryError) {
        console.error('기관회원 대시보드 - ac_gid 검증 오류:', queryError);
        throw queryError;
      }
    } else if (session.user.email) {
      try {
        // 이메일로 사용자 계정 ID 조회
        const userEmail = session.user.email;
        console.log('기관회원 대시보드 - 이메일로 계정 조회:', userEmail);
        
        // 1. 이메일로 person 테이블에서 pe_seq 찾기
        const personResult = await db.$queryRaw`
          SELECT pe_seq FROM mwd_person WHERE pe_email = ${userEmail}
        `;
        
        console.log('기관회원 대시보드 - 이메일로 개인정보 조회 결과:', JSON.stringify(personResult, null, 2));
        
        if (!Array.isArray(personResult) || personResult.length === 0) {
          return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
        }
        
        const pe_seq = personResult[0].pe_seq;
        
        // 2. pe_seq로 account 테이블에서 ac_gid 찾기
        const accountResult = await db.$queryRaw`
          SELECT ac_gid, ins_seq FROM mwd_account 
          WHERE pe_seq = ${pe_seq}
          AND ac_use = 'Y'
        `;
        
        console.log('기관회원 대시보드 - pe_seq로 계정 조회 결과:', JSON.stringify(accountResult, null, 2));
        
        if (!Array.isArray(accountResult) || accountResult.length === 0) {
          return NextResponse.json({ error: '계정 정보를 찾을 수 없습니다.' }, { status: 404 });
        }
        
        ac_gid = accountResult[0].ac_gid;
        
        // 기관 회원 확인 - ins_seq가 -1이 아니어야 함
        const ins_seq = accountResult[0].ins_seq;
        if (ins_seq === -1) {
          return NextResponse.json({ error: '기관 회원 계정이 아닙니다.' }, { status: 403 });
        }
        
      } catch (queryError) {
        console.error('기관회원 대시보드 - 이메일로 조회 오류:', queryError);
        throw queryError;
      }
    } else if (session.user.name) {
      try {
        // 이름으로 사용자 계정 ID 조회
        const userName = session.user.name;
        console.log('기관회원 대시보드 - 이름으로 계정 조회:', userName);
        
        // 1. 이름으로 person 테이블에서 pe_seq 찾기
        const personResult = await db.$queryRaw`
          SELECT pe_seq FROM mwd_person WHERE pe_name = ${userName}
        `;
        
        console.log('기관회원 대시보드 - 이름으로 개인정보 조회 결과:', JSON.stringify(personResult, null, 2));
        
        if (!Array.isArray(personResult) || personResult.length === 0) {
          return NextResponse.json({ 
            error: '해당 이름으로 사용자 정보를 찾을 수 없습니다.', 
            session: session.user 
          }, { status: 404 });
        }
        
        const pe_seq = personResult[0].pe_seq;
        
        // 2. pe_seq로 account 테이블에서 ac_gid 찾기
        const accountResult = await db.$queryRaw`
          SELECT ac_gid, ins_seq FROM mwd_account 
          WHERE pe_seq = ${pe_seq}
          AND ac_use = 'Y'
        `;
        
        console.log('기관회원 대시보드 - pe_seq로 계정 조회 결과:', JSON.stringify(accountResult, null, 2));
        
        if (!Array.isArray(accountResult) || accountResult.length === 0) {
          return NextResponse.json({ 
            error: '계정 정보를 찾을 수 없습니다.', 
            session: session.user 
          }, { status: 404 });
        }
        
        ac_gid = accountResult[0].ac_gid;
        
        // 기관 회원 확인 - ins_seq가 -1이 아니어야 함
        const ins_seq = accountResult[0].ins_seq;
        if (ins_seq === -1) {
          return NextResponse.json({ 
            error: '기관 회원 계정이 아닙니다.', 
            session: session.user 
          }, { status: 403 });
        }
        
      } catch (queryError) {
        console.error('기관회원 대시보드 - 이름으로 조회 오류:', queryError);
        throw queryError;
      }
    } else {
      console.log('기관회원 대시보드 - 사용자 식별 정보 없음');
      return NextResponse.json({ 
        error: '사용자 정보가 없습니다.', 
        session: session.user 
      }, { status: 400 });
    }
    
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
        for (const key in obj as Record<string, unknown>) {
          result[key] = convertBigIntToString((obj as Record<string, unknown>)[key]);
        }
        return result;
      }
      
      return obj;
    };
    
    // 결과 처리 - BigInt 처리
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
    
  } catch (error) {
    console.error('기관회원 대시보드 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '기관회원 대시보드 정보를 가져오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 