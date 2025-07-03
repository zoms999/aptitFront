import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./db";

// 계정 결과 타입 정의
interface AccountResult {
  pe_seq: number;
  pe_name: string;
  ac_gid: string;
  ac_use: string;
  ac_id: string;
}

// 결제 상태 결과 타입 정의
interface PaymentResult {
  cr_pay: string;
  pd_kind: string;
  expire: string;
  state: string;
}

// 성별 정보 결과 타입 정의
interface GenderResult {
  pe_sex: string;
}

// 기관 관리자 계정 결과 타입을 별도로 정의
interface OrgAdminAccountResult {
  ins_seq: number;
  ins_manager1_name: string; // mwd_institute에서 이름을 가져옴
  ac_gid: string;
  ac_use: string;
  ac_id: string;
}

// Auth 옵션 정의
export const authOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
        sessionCode: { label: "Session Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // 로그인 타입을 명확히 구분하여 처리
          const { loginType, username, password, sessionCode } = credentials;

          // 1. 일반 개인 사용자 로그인
          if (loginType === "personal") {
            const accountResult = await prisma.$queryRaw<AccountResult[]>`
              SELECT pe.pe_seq, pe.pe_name, ac.ac_gid, ac.ac_use, ac.ac_id
              FROM mwd_person pe
              JOIN mwd_account ac ON ac.pe_seq = pe.pe_seq 
              WHERE ac.ac_id = lower(${username}) 
                AND ac.ac_pw = CRYPT(${password}, ac.ac_pw)
            `;

            if (accountResult.length === 0 || accountResult[0].ac_use !== 'Y') {
              return null;
            }
            
            const userAccount = accountResult[0];
            const acGid = userAccount.ac_gid;
            const peName = userAccount.pe_name;
            const acId = userAccount.ac_id;

            console.log('계정 정보 확인됨:', { acGid, peName, acId });

            // 로그인 로그 기록
            try {
              // user_agent JSON 형식으로 변환
              const userAgentJson = JSON.stringify({ source: 'Web Login' });
              
              await prisma.$queryRaw`
                INSERT INTO mwd_log_login_account (login_date, user_agent, ac_gid) 
                VALUES (now(), ${userAgentJson}::json, ${acGid}::uuid)
              `;
              console.log('로그인 로그 기록 완료');
            } catch (logError) {
              console.error('로그인 로그 기록 실패:', logError);
              // 로그 기록 실패는 로그인 진행에 영향 없음
            }

            // 사용자 결제 상태 확인
            let paymentResult: PaymentResult[] = [];
            try {
              paymentResult = await prisma.$queryRaw<PaymentResult[]>`
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
                    LEFT OUTER JOIN mwd_choice_result cr ON cr.ac_gid = ac.ac_gid
                    LEFT OUTER JOIN mwd_answer_progress ap ON ap.cr_seq = cr.cr_seq
                    WHERE ac.ac_gid = ${acGid}::uuid
                      AND pe.pe_seq = ac.pe_seq 
                      AND ac.ac_use = 'Y'
                ) t 
                WHERE rnum = 1
              `;
              console.log('결제 상태 확인 완료:', paymentResult);
            } catch (paymentError) {
              console.error('결제 상태 확인 실패:', paymentError);
              // 결제 정보 조회 실패는 기본값 처리로 진행
            }

            // 성별 정보 조회
            let genderResult: GenderResult[] = [];
            try {
              genderResult = await prisma.$queryRaw<GenderResult[]>`
                SELECT pe.pe_sex 
                FROM mwd_account ac, mwd_person pe 
                WHERE ac.ac_gid = ${acGid}::uuid
                  AND pe.pe_seq = ac.pe_seq
              `;
              console.log('성별 정보 확인 완료:', genderResult);
            } catch (genderError) {
              console.error('성별 정보 확인 실패:', genderError);
              // 성별 정보 조회 실패는 기본값 처리로 진행
            }

            return {
              id: acGid,
              name: peName,
              type: "personal",
              sex: genderResult.length > 0 ? genderResult[0].pe_sex : "",
              isPaid: paymentResult.length > 0 ? paymentResult[0].cr_pay === 'Y' : false,
              productType: paymentResult.length > 0 ? paymentResult[0].pd_kind : "",
              isExpired: paymentResult.length > 0 ? paymentResult[0].expire === 'N' : true,
              state: paymentResult.length > 0 ? paymentResult[0].state : "R",
              ac_id: acId
            };
          } 
          // 2. 기관 로그인 (관리자 또는 소속 사용자)
          else if (loginType === "organization") {
            if (!sessionCode) {
                return null;
            }

            // 회차코드 유효성 검사 및 정보 조회 (ins_seq, tur_seq를 여기서 얻음)
            interface TurnInfo { ins_seq: number; tur_seq: number; }
            const verificationResult = await prisma.$queryRaw<TurnInfo[]>`
                SELECT tur.ins_seq, tur.tur_seq
                FROM mwd_institute_turn tur
                WHERE tur.tur_code = ${sessionCode} AND tur.tur_use = 'Y'
            `;

            if (verificationResult.length === 0) {
                console.log('세션코드 검증 실패: 유효하지 않은 코드');
                return null;
            }
            const { ins_seq, tur_seq } = verificationResult[0]; // 회차 정보에서 기관/회차 ID 확보

            // 기관 관리자로 로그인 시도 (1순위)
            const adminAccountResult = await prisma.$queryRaw<OrgAdminAccountResult[]>`
              SELECT i.ins_seq, i.ins_manager1_name, ac.ac_gid, ac.ac_use, ac.ac_id
              FROM mwd_institute i
              JOIN mwd_account ac ON ac.ins_seq = i.ins_seq
              WHERE ac.pe_seq = -1
                AND ac.ins_seq = ${ins_seq} -- << 해당 기관의 관리자인지 확인
                AND ac.ac_id = lower(${username})
                AND ac.ac_pw = CRYPT(${password}, ac.ac_pw)
            `;
            if (adminAccountResult.length > 0 && adminAccountResult[0].ac_use === 'Y') {
                const adminAccount = adminAccountResult[0];
                return {
                    id: adminAccount.ac_gid,
                    name: adminAccount.ins_manager1_name,
                    type: "organization_admin",
                    sessionCode: sessionCode,
                    ac_id: adminAccount.ac_id,
                    ins_seq: adminAccount.ins_seq,
                };
            }

            // 기관 소속 개인 사용자로 로그인 시도 (2순위)
            const memberAccountResult = await prisma.$queryRaw<AccountResult[]>`
                SELECT pe.pe_seq, pe.pe_name, ac.ac_gid, ac.ac_use, ac.ac_id
                FROM mwd_person pe
                JOIN mwd_account ac ON ac.pe_seq = pe.pe_seq
                JOIN mwd_institute_member im ON im.pe_seq = pe.pe_seq
                WHERE ac.ac_id = lower(${username})
                  AND ac.ac_pw = CRYPT(${password}, ac.ac_pw)
                  AND im.ins_seq = ${ins_seq}
                  AND im.tur_seq = ${tur_seq}
            `;

            if (memberAccountResult.length > 0 && memberAccountResult[0].ac_use === 'Y') {
                const memberAccount = memberAccountResult[0];
                // 로그인 로그 기록
                try {
                  const userAgentJson: string = JSON.stringify({ source: 'Web Login (Organization Member)' });
                  await prisma.$queryRaw`
                    INSERT INTO mwd_log_login_account (login_date, user_agent, ac_gid) 
                    VALUES (now(), ${userAgentJson}::json, ${memberAccount.ac_gid}::uuid)
                  `;
                } catch (logError) {
                  console.error('기관 소속 사용자 로그 기록 실패:', logError);
                }
                
                return {
                    id: memberAccount.ac_gid,
                    name: memberAccount.pe_name,
                    type: "organization_member",
                    sessionCode: sessionCode,
                    ac_id: memberAccount.ac_id,
                };
            }

            console.log('기관 로그인 실패: 일치하는 계정 정보 없음 또는 해당 회차 소속 아님');
            return null;
          }

          return null; // 그 외의 경우는 로그인 실패
        } catch (error) {
          console.error("Authorize 함수 오류:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login?error=true"
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 2 * 60 * 60, 
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60, 
      },
    },
  },
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
        if (user) {
            token.id = user.id;
            token.name = user.name;
            token.ac_id = user.ac_id;
            token.type = user.type; // 'personal', 'organization_admin', 'organization_member'

            if (user.type === "organization_admin") {
                token.sessionCode = user.sessionCode;
                token.ins_seq = user.ins_seq;
            } else if (user.type === "organization_member") {
                token.sessionCode = user.sessionCode;
            } else if (user.type === "personal") {
                token.sex = user.sex;
                token.isPaid = user.isPaid;
                token.productType = user.productType;
                token.isExpired = user.isExpired;
                token.state = user.state;
            }
        }
        return token;
    },
    async session({ session, token }: { session: unknown, token: unknown }) {
        const s = session as Record<string, any>;
        const t = token as Record<string, any>;
        if (s.user) {
            s.user.id = t.id;
            s.user.name = t.name;
            s.user.ac_id = t.ac_id;
            s.user.type = t.type;

            if (t.type === "organization_admin") {
                s.user.sessionCode = t.sessionCode;
                s.user.ins_seq = t.ins_seq;
            } else if (t.type === "organization_member") {
                s.user.sessionCode = t.sessionCode;
            } else if (t.type === "personal") {
                s.user.sex = t.sex;
                s.user.isPaid = t.isPaid;
                s.user.productType = t.productType;
                s.user.isExpired = t.isExpired;
                s.user.state = t.state;
            }
        }
        return s;
    }
  },
}; 