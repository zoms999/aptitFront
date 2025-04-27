import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db/prisma";

// 계정 결과 타입 정의
interface AccountResult {
  pe_seq: number;
  pe_name: string;
  ac_gid: string;
  ac_use: string;
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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
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
          // 개인 계정 로그인
          if (credentials.loginType === "personal") {
            // 사용자 계정 정보 조회
            const accountResult = await db.$queryRaw<AccountResult[]>`
              SELECT pe.pe_seq, pe.pe_name, ac.ac_gid, ac.ac_use 
              FROM mwd_person pe, mwd_account ac 
              WHERE ac.pe_seq = pe.pe_seq 
                AND ac.ac_id = lower(${credentials.username}) 
                AND ac.ac_pw = CRYPT(${credentials.password}, ac.ac_pw)
            `;

            if (accountResult.length === 0 || accountResult[0].ac_use !== 'Y') {
              console.log('로그인 실패: 계정 정보 없음 또는 비활성화된 계정');
              return null;
            }

            const acGid = accountResult[0].ac_gid;
            const peName = accountResult[0].pe_name;

            console.log('계정 정보 확인됨:', { acGid, peName });

            // 로그인 로그 기록
            try {
              // user_agent JSON 형식으로 변환
              const userAgentJson = JSON.stringify({ source: 'Web Login' });
              
              await db.$queryRaw`
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
              paymentResult = await db.$queryRaw<PaymentResult[]>`
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
              genderResult = await db.$queryRaw<GenderResult[]>`
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

            // 사용자 세션 데이터 구성
            return {
              id: acGid,
              name: peName,
              type: "personal",
              sex: genderResult.length > 0 ? genderResult[0].pe_sex : "",
              isPaid: paymentResult.length > 0 ? paymentResult[0].cr_pay === 'Y' : false,
              productType: paymentResult.length > 0 ? paymentResult[0].pd_kind : "",
              isExpired: paymentResult.length > 0 ? paymentResult[0].expire === 'N' : true,
              state: paymentResult.length > 0 ? paymentResult[0].state : "R"
            };
          } 
          // 기관 계정 로그인 (세션코드 필요)
          else if (credentials.loginType === "organization" && credentials.sessionCode) {
            // 세션코드 유효성 검사
            try {
              const url = process.env.NEXTAUTH_URL || 'http://localhost:3002';
              const codeVerification = await fetch(`${url}/api/verify-session-code`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: credentials.sessionCode }),
              });
              
              const verificationResult = await codeVerification.json();
              
              if (!verificationResult.valid) {
                console.log('세션코드 검증 실패:', verificationResult.message);
                return null;
              }
              
              console.log('세션코드 검증 성공:', verificationResult);
            } catch (verificationError) {
              console.error('세션코드 검증 요청 실패:', verificationError);
              return null;
            }

            // 사용자 계정 정보 조회
            const accountResult = await db.$queryRaw<AccountResult[]>`
              SELECT pe.pe_seq, pe.pe_name, ac.ac_gid, ac.ac_use 
              FROM mwd_person pe, mwd_account ac 
              WHERE ac.pe_seq = pe.pe_seq 
                AND ac.ac_id = lower(${credentials.username}) 
                AND ac.ac_pw = CRYPT(${credentials.password}, ac.ac_pw)
            `;

            if (accountResult.length === 0 || accountResult[0].ac_use !== 'Y') {
              console.log('로그인 실패: 계정 정보 없음 또는 비활성화된 계정');
              return null;
            }

            const acGid = accountResult[0].ac_gid;
            const peName = accountResult[0].pe_name;

            console.log('계정 정보 확인됨:', { acGid, peName });

            // 로그인 로그 기록
            try {
              // user_agent JSON 형식으로 변환
              const userAgentJson = JSON.stringify({ source: 'Web Login (Organization)' });
              
              await db.$queryRaw`
                INSERT INTO mwd_log_login_account (login_date, user_agent, ac_gid) 
                VALUES (now(), ${userAgentJson}::json, ${acGid}::uuid)
              `;
              console.log('로그인 로그 기록 완료');
            } catch (logError) {
              console.error('로그인 로그 기록 실패:', logError);
              // 로그 기록 실패는 로그인 진행에 영향 없음
            }

            return {
              id: acGid,
              name: peName,
              type: "organization",
              sessionCode: credentials.sessionCode
            };
          }

          return null;
        } catch (error) {
          console.error("로그인 중 오류 발생:", error);
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
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.type = user.type;
        
        if (user.type === "personal") {
          token.sex = user.sex;
          token.isPaid = user.isPaid;
          token.productType = user.productType;
          token.isExpired = user.isExpired;
          token.state = user.state;
        } else if (user.type === "organization") {
          token.sessionCode = user.sessionCode;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.type = token.type as string;
        
        if (token.type === "personal") {
          session.user.sex = token.sex as string;
          session.user.isPaid = token.isPaid as boolean;
          session.user.productType = token.productType as string;
          session.user.isExpired = token.isExpired as boolean;
          session.user.state = token.state as string;
        } else if (token.type === "organization") {
          session.user.sessionCode = token.sessionCode as string;
        }
      }
      return session;
    },
  },
}); 