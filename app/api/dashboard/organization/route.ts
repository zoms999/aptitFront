import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../lib/db';
import { authOptions } from '../../../../lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // 세션 정보 자세히 출력
    console.log('기관 대시보드 - 세션 정보:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      console.log('기관 대시보드 - 인증되지 않은 세션');
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }
    
    let ac_gid;
    let userType;
    let ins_seq;
    
    // session.user에서 사용자 정보 확인
    console.log('기관 대시보드 - 사용자 상세 정보:', JSON.stringify(session.user, null, 2));
    const userAny = session.user as { id?: string; ac_id?: string; type?: string; ins_seq?: number };
    
    // 세션에 필수 필드 검증
    if (userAny.id && userAny.ac_id && userAny.type) {
      ac_gid = userAny.id;
      userType = userAny.type;
      console.log('기관 대시보드 - ac_gid 확인:', ac_gid, 'userType:', userType);
      
      // 기관 관련 계정인지 검증 (관리자 또는 회원)
      if (userType !== 'organization_admin' && userType !== 'organization_member') {
        return NextResponse.json({ error: '기관 계정이 아닙니다.' }, { status: 403 });
      }
      
      try {
        const validateResult = await prisma.$queryRaw`
          SELECT ins_seq FROM mwd_account 
          WHERE ac_gid = ${ac_gid}::uuid
          AND ac_use = 'Y'
        ` as { ins_seq: number }[];
        
        console.log('기관 대시보드 - 계정 검증 결과:', JSON.stringify(validateResult, null, 2));
        
        if (!Array.isArray(validateResult) || validateResult.length === 0) {
          return NextResponse.json({ error: '계정 정보를 찾을 수 없습니다.' }, { status: 404 });
        }
        
        ins_seq = validateResult[0].ins_seq;
        console.log('기관 대시보드 - ins_seq:', ins_seq, 'userType:', userType);
        
        // 기관 관리자와 기관 회원 모두 ins_seq > 0 이어야 함 (실제 기관 번호)
        if (ins_seq <= 0) {
          return NextResponse.json({ error: '유효하지 않은 기관 정보입니다.' }, { status: 403 });
        }
      } catch (queryError) {
        console.error('기관 대시보드 - 계정 검증 오류:', queryError);
        throw queryError;
      }
    } else {
      console.log('기관 대시보드 - 세션 정보 불완전');
      return NextResponse.json({ 
        error: '인증 정보가 불완전합니다. 로그아웃 후 다시 로그인해주세요.', 
        requireLogin: true,
        forceLogout: true
      }, { status: 401 });
    }
    
    // 기관 정보 조회 (관리자와 회원에 따라 다른 쿼리)
    let instituteResult;
    
    try {
      if (userType === 'organization_admin') {
        // 기관 관리자: ins_seq로 직접 조회
        instituteResult = await prisma.$queryRaw`
          SELECT ins.ins_seq, ins.ins_name, tur.tur_seq, tur.tur_code,
                tur.tur_req_sum, tur.tur_use_sum, tur.tur_is_paid, tur.tur_allow_no_payment
          FROM mwd_account ac
          JOIN mwd_institute ins ON ac.ins_seq = ins.ins_seq
          JOIN mwd_institute_turn tur ON ins.ins_seq = tur.ins_seq
          WHERE ac.ac_gid = ${ac_gid}::uuid
          AND tur.tur_use = 'Y'
        `;
      } else {
        // 기관 회원: 회원이 속한 기관 정보 조회
        instituteResult = await prisma.$queryRaw`
          SELECT ins.ins_seq, ins.ins_name, tur.tur_seq, tur.tur_code,
                tur.tur_req_sum, tur.tur_use_sum, tur.tur_is_paid, tur.tur_allow_no_payment
          FROM mwd_account ac
          JOIN mwd_institute ins ON ac.ins_seq = ins.ins_seq
          JOIN mwd_institute_turn tur ON ins.ins_seq = tur.ins_seq
          WHERE ac.ac_gid = ${ac_gid}::uuid
          AND tur.tur_use = 'Y'
        `;
      }
      
      console.log('기관 대시보드 - 기관 정보 조회 결과:', JSON.stringify(instituteResult, null, 2));
      
      if (!Array.isArray(instituteResult) || instituteResult.length === 0) {
        return NextResponse.json({ error: '기관 정보를 찾을 수 없습니다.' }, { status: 404 });
      }
      
      // 계정 상태 조회
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
          FROM mwd_account ac
          LEFT JOIN mwd_choice_result cr ON cr.ac_gid = ac.ac_gid
          LEFT JOIN mwd_answer_progress ap ON ap.cr_seq = cr.cr_seq
          WHERE ac.ac_gid = ${ac_gid}::uuid
            AND ac.ac_use = 'Y'
        ) t 
        WHERE rnum = 1
      `;
      
      // 검사 목록 조회
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
      
      // 기관 회원 목록 조회 (기관 관리자일 때만)
      interface MemberRecord {
        pe_seq: number;
        pe_name: string;
        pe_email: string;
        pe_sex: string;
        pe_cellphone: string;
        join_date: string;
        ac_gid: string | null;
      }
      
      interface TestStatusRecord {
        total_tests: string;
        completed_tests: string;
        latest_status: string;
      }
      
      let membersResult: MemberRecord[] = [];
      let membersWithTestStatus: (MemberRecord & { testStatus: object })[] = [];
      
      if (userType === 'organization_admin') {
        const currentInstituteInfo = instituteResult[0];
        
        // 기본 회원 목록 조회
        membersResult = await prisma.$queryRaw`
          SELECT pe.pe_seq, pe.pe_name, pe.pe_email, pe.pe_sex, pe.pe_cellphone,
                TO_CHAR(im.mem_insert_date, 'yyyy-mm-dd') AS join_date,
                ac.ac_gid
          FROM mwd_institute ins
          JOIN mwd_institute_turn tur ON ins.ins_seq = tur.ins_seq
          JOIN mwd_institute_member im ON tur.ins_seq = im.ins_seq AND tur.tur_seq = im.tur_seq
          JOIN mwd_person pe ON im.pe_seq = pe.pe_seq
          LEFT JOIN mwd_account ac ON pe.pe_seq = ac.pe_seq
          WHERE ins.ins_seq = ${currentInstituteInfo.ins_seq}
          AND tur.tur_use = 'Y'
          ORDER BY im.mem_insert_date DESC
        ` as MemberRecord[];
        
        // 각 회원의 검사 상태 조회
        if (Array.isArray(membersResult) && membersResult.length > 0) {
          for (const member of membersResult) {
            let testStatus = { hasTest: false, testCount: 0, completedCount: 0, latestTestStatus: 'none' };
        
            if (member?.ac_gid) {
              // [수정] 1. 검사 요약 정보 조회 (총 개수, 완료 개수)
              const summaryResult = await prisma.$queryRaw<any[]>`
                SELECT 
                    COUNT(*) AS total_tests,
                    SUM(CASE WHEN COALESCE(ap.anp_done, 'R') = 'E' THEN 1 ELSE 0 END) AS completed_tests
                FROM mwd_choice_result cr
                LEFT JOIN mwd_answer_progress ap ON ap.cr_seq = cr.cr_seq
                WHERE cr.ac_gid = ${member.ac_gid}::uuid
              `;
        
              // [수정] 2. 가장 최근 검사 상태 조회
              const latestStatusResult = await prisma.$queryRaw<any[]>`
                SELECT COALESCE(ap.anp_done, 'R') as latest_status
                FROM mwd_choice_result cr
                LEFT JOIN mwd_answer_progress ap ON ap.cr_seq = cr.cr_seq
                WHERE cr.ac_gid = ${member.ac_gid}::uuid
                ORDER BY cr.cr_seq DESC
                LIMIT 1
              `;
              
              const summaryData = summaryResult?.[0];
              const latestStatusData = latestStatusResult?.[0];
        
              if (summaryData && parseInt(summaryData.total_tests) > 0) {
                testStatus = {
                  hasTest: true,
                  testCount: parseInt(summaryData.total_tests),
                  completedCount: parseInt(summaryData.completed_tests || 0),
                  latestTestStatus: latestStatusData?.latest_status || 'none'
                };
              }
            }
        
            membersWithTestStatus.push({
              ...member,
              testStatus
            });
          }
        }
      } else {
        // 기관 회원은 회원 목록을 볼 수 없음
        membersResult = [];
        membersWithTestStatus = [];
      }
      
      // 완료된 검사 수 계산
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
        
      const safeInstituteInfo = Array.isArray(instituteResult) && instituteResult.length > 0
        ? convertBigIntToString(instituteResult[0])
        : null;
        
      const safeMembers = userType === 'organization_admin' 
        ? convertBigIntToString(membersWithTestStatus)
        : [];
      
      return NextResponse.json({
        accountStatus: safeAccountStatus,
        tests: safeTests,
        completedTests,
        instituteInfo: safeInstituteInfo,
        members: safeMembers,
        isOrganization: true,
        isOrganizationAdmin: userType === 'organization_admin',
        userType: userType
      });
      
    } catch (queryError) {
      console.error('기관 대시보드 - 데이터 조회 오류:', queryError);
      throw queryError;
    }
  } catch (error) {
    console.error('기관 대시보드 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '기관 대시보드 정보를 가져오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 