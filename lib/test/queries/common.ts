import prisma from '../../db';
import { NextQuestion, TestStep } from '../types';

/**
 * 다음 질문 정보를 조회합니다
 */
export async function getNextQuestion(anpSeq: number): Promise<NextQuestion | null> {
  const nextQuestionResult = await prisma.$queryRaw`
    WITH progress_list AS (
        SELECT  
            ap.anp_seq, 
            qu.qu_code, 
            qu.qu_filename,
            CASE 
                WHEN an.an_progress < 0 THEN an.an_progress 
                ELSE COALESCE(an.an_progress, ROW_NUMBER() OVER (ORDER BY co.coc_order, qu.qu_kind2, qu_order))
            END AS progress, 
            qu.qu_kind1 AS step, 
            qu.qu_action, 
            COALESCE(qa.qua_type, '-') AS qua_type, 
            cr.pd_kind
        FROM mwd_answer_progress ap
        JOIN mwd_question qu ON qu.qu_use = 'Y'
        JOIN mwd_choice_result cr ON cr.cr_seq = ap.cr_seq
        LEFT JOIN mwd_answer an ON an.anp_seq = ap.anp_seq AND qu.qu_code = an.qu_code
        JOIN mwd_common_code co ON co.coc_group = 'STEP' AND co.coc_code = qu.qu_kind1
        LEFT JOIN mwd_question_attr qa ON qa.qua_code = 
            CASE WHEN qu.qu_kind1 = 'img' THEN qu.qu_kind3 ELSE qu.qu_kind2 END
        WHERE ap.anp_seq = ${anpSeq}
          AND TRUE
          AND qu.qu_filename NOT LIKE '%Index%'
          AND qu.qu_filename NOT LIKE '%index%'
    ),
    plist AS (
        SELECT 
            pl.qu_code, 
            pl.qu_filename, 
            pl.progress, 
            pl.step
        FROM mwd_answer_progress ap, progress_list pl
        WHERE ap.anp_seq = ${anpSeq} AND pl.anp_seq = ap.anp_seq AND pl.qu_code = ap.qu_code
    )
    SELECT 
        nlist.qu_filename, 
        nlist.qu_code, 
        nlist.step, 
        plist.step AS prev_step,
        nlist.qu_action, 
        plist.qu_code AS prev_code, 
        nlist.qua_type, 
        nlist.pd_kind
    FROM progress_list nlist, plist
    WHERE nlist.progress > plist.progress
    ORDER BY nlist.progress
    LIMIT 1
  ` as NextQuestion[];

  return Array.isArray(nextQuestionResult) && nextQuestionResult.length > 0 
    ? nextQuestionResult[0] 
    : null;
}

/**
 * 현재 단계의 첫 번째 실제 문항을 조회합니다
 */
export async function getFirstQuestionOfStep(
  anpSeq: number, 
  step: TestStep
): Promise<NextQuestion | null> {
  const firstQuestionResult = await prisma.$queryRaw`
    SELECT 
        qu.qu_filename, 
        qu.qu_code, 
        qu.qu_kind1 AS step,
        '' AS prev_step,
        qu.qu_action, 
        '' AS prev_code, 
        COALESCE(qa.qua_type, '-') AS qua_type, 
        cr.pd_kind
    FROM mwd_question qu
    JOIN mwd_choice_result cr ON cr.cr_seq = (
        SELECT cr_seq FROM mwd_answer_progress WHERE anp_seq = ${anpSeq}
    )
    LEFT JOIN mwd_question_attr qa ON qa.qua_code = 
        CASE WHEN qu.qu_kind1 = 'img' THEN qu.qu_kind3 ELSE qu.qu_kind2 END
    WHERE qu.qu_use = 'Y'
      AND qu.qu_kind1 = ${step}
      AND qu.qu_filename NOT LIKE '%Index%'
      AND qu.qu_filename NOT LIKE '%index%'
      AND (CASE WHEN cr.pd_kind = 'basic' AND ${step} = 'thk' THEN FALSE ELSE TRUE END)
    ORDER BY qu.qu_code
    LIMIT 1
  ` as NextQuestion[];

  return Array.isArray(firstQuestionResult) && firstQuestionResult.length > 0 
    ? firstQuestionResult[0] 
    : null;
}

/**
 * 더미 코드를 실제 첫 번째 문항으로 업데이트합니다
 */
export async function updateDummyQuestionCode(
  anpSeq: number, 
  step: TestStep, 
  language: string
): Promise<{ quCode: string; quFilename: string } | null> {
  const realFirstQuestionResult = await prisma.$queryRaw`
    SELECT qu.qu_code, qu.qu_filename
    FROM mwd_question qu
    JOIN mwd_question_lang ql ON qu.qu_code = ql.qu_code
    WHERE qu.qu_kind1 = ${step}
      AND qu.qu_use = 'Y'
      AND ql.lang_code = ${language}
      AND qu.qu_filename NOT LIKE '%Index%'
      AND qu.qu_filename NOT LIKE '%index%'
      AND qu.qu_filename NOT LIKE '%00000%'
    ORDER BY qu.qu_code
    LIMIT 1
  ` as Array<{ qu_code: string; qu_filename: string }>;

  if (Array.isArray(realFirstQuestionResult) && realFirstQuestionResult.length > 0) {
    const { qu_code, qu_filename } = realFirstQuestionResult[0];
    
    // mwd_answer_progress 테이블 업데이트
    await prisma.$queryRaw`
      UPDATE mwd_answer_progress 
      SET qu_code = ${qu_code}
      WHERE anp_seq = ${anpSeq}
    `;
    
    return { quCode: qu_code, quFilename: qu_filename };
  }

  return null;
}

/**
 * 현재 진행 중인 qu_filename을 조회합니다
 */
export async function getCurrentQuFilename(anpSeq: number): Promise<string | null> {
  const currentStepResult = await prisma.$queryRaw`
    SELECT anp_step, qu_code, anp_done
    FROM mwd_answer_progress
    WHERE anp_seq = ${anpSeq}
  ` as Array<{ anp_step: string; qu_code: string; anp_done: string }>;
  
  if (Array.isArray(currentStepResult) && currentStepResult.length > 0) {
    const currentQuCode = currentStepResult[0].qu_code;
    if (currentQuCode) {
      const currentQuResult = await prisma.$queryRaw`
        SELECT qu_filename 
        FROM mwd_question 
        WHERE qu_code = ${currentQuCode} AND qu_use = 'Y'
      ` as Array<{ qu_filename: string }>;
      
      if (Array.isArray(currentQuResult) && currentQuResult.length > 0) {
        return currentQuResult[0].qu_filename;
      }
    }
  }
  
  return null;
}

/**
 * 특정 단계의 첫 번째 실제 문항 파일명을 찾습니다
 */
export async function findFirstRealQuestionFilename(
  step: TestStep, 
  language: string
): Promise<string | null> {
  const firstRealQuestionResult = await prisma.$queryRaw`
    SELECT DISTINCT q.qu_filename
    FROM mwd_question q
    JOIN mwd_question_lang ql ON q.qu_code = ql.qu_code
    WHERE q.qu_kind1 = ${step}
      AND q.qu_use = 'Y'
      AND ql.lang_code = ${language}
      AND q.qu_filename NOT LIKE '%Index%'
      AND q.qu_filename NOT LIKE '%index%'
      AND q.qu_filename NOT LIKE '%00000%'
    ORDER BY q.qu_filename
    LIMIT 1
  ` as Array<{ qu_filename: string }>;
  
  return Array.isArray(firstRealQuestionResult) && firstRealQuestionResult.length > 0 
    ? firstRealQuestionResult[0].qu_filename 
    : null;
} 