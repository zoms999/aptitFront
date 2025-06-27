import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth';
import prisma from '../db';
import { AccountStatus, TestStep } from './types';

/**
 * 데이터베이스 연결 상태를 확인합니다
 */
export async function checkDatabaseConnection(): Promise<void> {
  await prisma.$queryRaw`SELECT 1 as test_connection`;
}

/**
 * 사용자 세션을 검증하고 사용자 ID를 반환합니다
 */
export async function validateUserSession(): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다');
  }
  
  return session.user.id;
}

/**
 * 언어 설정을 처리합니다
 */
export function processLanguage(request: Request): string {
  const acceptLanguage = request.headers.get('Accept-Language') || 'ko-KR';
  const browserLanguage = ['ko-KR', 'en-US', 'ja-JP', 'zh-CN'].includes(acceptLanguage) 
    ? acceptLanguage 
    : 'ko-KR';
  
  // DB에 ko-KR로 저장되어 있으므로 전체 언어 코드 사용
  return browserLanguage;
}

/**
 * 계정 상태를 조회합니다
 */
export async function getAccountStatus(userId: string): Promise<AccountStatus> {
  const accountStatusResult = await prisma.$queryRaw`
    SELECT cr_pay, pd_kind, expire, state 
    FROM (
        SELECT 
            ac.ac_gid, 
            ROW_NUMBER() OVER (ORDER BY cr.cr_seq DESC) rnum,
            COALESCE(cr.cr_pay, 'N') cr_pay, 
            COALESCE(cr.pd_kind, '') pd_kind,
            CASE WHEN ac.ac_expire_date >= now() THEN 'Y' ELSE 'N' END AS expire,
            COALESCE(ap.anp_done, 'R') AS state
        FROM mwd_person pe
        JOIN mwd_account ac ON pe.pe_seq = ac.pe_seq
        LEFT OUTER JOIN mwd_choice_result cr ON cr.ac_gid = ac.ac_gid
        LEFT OUTER JOIN mwd_answer_progress ap ON ap.cr_seq = cr.cr_seq
        WHERE ac.ac_gid = ${userId}::uuid
          AND ac.ac_use = 'Y'
    ) t 
    WHERE rnum = 1
  ` as AccountStatus[];

  if (!Array.isArray(accountStatusResult) || accountStatusResult.length === 0) {
    throw new Error('테스트 정보를 찾을 수 없습니다');
  }

  return accountStatusResult[0];
}

/**
 * anp_seq를 조회하거나 새로 생성합니다
 */
export async function getOrCreateAnpSeq(userId: string, language: string): Promise<number> {
  // 진행 중인 anp_seq 조회
  const anpSeqResult = await prisma.$queryRaw`
    SELECT COALESCE(ap.anp_seq, 0) AS anp_seq
    FROM mwd_account ac
    JOIN mwd_answer_progress ap ON ac.ac_gid = ap.ac_gid
    WHERE ac.ac_use = 'Y' 
      AND ac.ac_expire_date >= now()
      AND ac.ac_gid = ${userId}::uuid
      AND anp_done IN ('R', 'I')
  ` as Array<{ anp_seq: number }>;

  // 기존에 진행 중인 테스트가 있으면 반환
  if (Array.isArray(anpSeqResult) && anpSeqResult.length > 0) {
    return anpSeqResult[0].anp_seq;
  }

  // 새로운 테스트 생성
  const firstQuestionResult = await prisma.$queryRaw`
    SELECT qu.qu_code, qu.qu_filename, qu.qu_kind1
    FROM mwd_question qu
    JOIN mwd_question_lang ql ON qu.qu_code = ql.qu_code
    WHERE qu.qu_kind1 = 'tnd'
      AND qu.qu_use = 'Y'
      AND ql.lang_code = ${language}
      AND qu.qu_filename NOT LIKE '%Index%'
      AND qu.qu_filename NOT LIKE '%index%'
      AND qu.qu_filename NOT LIKE '%00000%'
    ORDER BY qu.qu_code
    LIMIT 1
  ` as Array<{ qu_code: string }>;

  const firstQuCode = Array.isArray(firstQuestionResult) && firstQuestionResult.length > 0
    ? firstQuestionResult[0].qu_code
    : 'tnd00000';

  // 새 answer_progress 생성
  const newProgressResult = await prisma.$queryRaw`
    INSERT INTO mwd_answer_progress (
        anp_seq, qu_code, anp_step, anp_start_date, anp_done, ac_gid, cr_seq
    )
    SELECT 
        NEXTVAL('anp_seq'),
        ${firstQuCode},
        'tnd',
        now(), 
        'R', 
        ${userId}::uuid, 
        t.cr_seq
    FROM (
        SELECT cr_seq, ROW_NUMBER() OVER (ORDER BY cr_seq DESC) AS lastrow, pd_kind
        FROM mwd_choice_result
        WHERE ac_gid = ${userId}::uuid
    ) t 
    WHERE lastrow = 1
    RETURNING anp_seq
  ` as Array<{ anp_seq: number }>;

  if (!Array.isArray(newProgressResult) || newProgressResult.length === 0) {
    throw new Error('테스트 진행 정보를 생성할 수 없습니다');
  }

  return newProgressResult[0].anp_seq;
}

/**
 * 현재 단계를 검증하고 수정합니다
 */
export async function validateCurrentStep(anpSeq: number): Promise<TestStep> {
  // 현재 단계 확인
  const currentStepResult = await prisma.$queryRaw`
    SELECT anp_step, qu_code, anp_done
    FROM mwd_answer_progress
    WHERE anp_seq = ${anpSeq}
  ` as Array<{ anp_step: string; qu_code: string; anp_done: string }>;
  
  let currentStep: TestStep = 'tnd';
  if (Array.isArray(currentStepResult) && currentStepResult.length > 0) {
    currentStep = currentStepResult[0].anp_step as TestStep;
  }

  // 성향 진단 완료 여부 확인 (다른 단계에서)
  if (currentStep !== 'tnd') {
    const tndProgressResult = await prisma.$queryRaw`
      SELECT 
          COUNT(DISTINCT an.qu_code) AS tnd_completed,
          COUNT(DISTINCT qu.qu_code) AS tnd_total
      FROM mwd_answer_progress ap
      LEFT JOIN mwd_answer an ON an.anp_seq = ap.anp_seq 
          AND an.an_progress > 0 
          AND an.an_ex > 0
      JOIN mwd_question qu ON qu.qu_kind1 = 'tnd'
          AND qu.qu_use = 'Y'
          AND qu.qu_filename NOT LIKE '%Index%'
          AND qu.qu_filename NOT LIKE '%index%'
      WHERE ap.anp_seq = ${anpSeq}
    ` as Array<{ tnd_completed: number; tnd_total: number }>;

    if (Array.isArray(tndProgressResult) && tndProgressResult.length > 0) {
      const tndProgress = tndProgressResult[0];
      const tndCompleted = Number(tndProgress.tnd_completed) || 0;
      const tndTotal = Number(tndProgress.tnd_total) || 0;
      
      // 성향 진단이 완료되지 않았는데 다른 단계에 있는 경우 되돌리기
      if (tndCompleted < tndTotal) {
        await prisma.$queryRaw`
          UPDATE mwd_answer_progress 
          SET qu_code = 'tnd00000', 
              anp_step = 'tnd' 
          WHERE anp_seq = ${anpSeq}::integer
        `;
        
        currentStep = 'tnd';
      }
    }
  }

  return currentStep;
}

/**
 * 진행률 정보를 조회합니다
 */
export async function getProgressInfo(anpSeq: number): Promise<{ completed: number; total: number; step: string }> {
  const progressInfoResult = await prisma.$queryRaw`
    SELECT 
        COUNT(DISTINCT an.qu_code) AS acnt,
        COUNT(DISTINCT qu.qu_code) AS tcnt,
        ap.anp_step AS step
    FROM mwd_answer_progress ap
    LEFT JOIN mwd_answer an ON an.anp_seq = ap.anp_seq 
        AND an.an_progress > 0 
        AND an.an_ex > 0
        AND EXISTS (
          SELECT 1 FROM mwd_question q2 
          WHERE q2.qu_code = an.qu_code 
            AND q2.qu_kind1 = ap.anp_step
        )
    JOIN mwd_question qu ON qu.qu_kind1 = ap.anp_step 
        AND qu.qu_use = 'Y'
        AND qu.qu_filename NOT LIKE '%Index%'
        AND qu.qu_filename NOT LIKE '%index%'
    WHERE ap.anp_seq = ${anpSeq}
    GROUP BY ap.anp_step
  ` as Array<{ acnt: number; tcnt: number; step: string }>;

  if (Array.isArray(progressInfoResult) && progressInfoResult.length > 0) {
    const progressInfo = progressInfoResult[0];
    return {
      completed: Number(progressInfo.acnt) || 0,
      total: Number(progressInfo.tcnt) || 0,
      step: progressInfo.step || 'tnd'
    };
  }

  return { completed: 0, total: 0, step: 'tnd' };
} 