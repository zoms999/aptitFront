import prisma from '../../db';
import { Question } from '../types';

interface QuestionChoice {
  qu_code: string;
  qu_filename: string;
  qu_order: number;
  qu_title?: string;
  qu_passage?: string;
  qu_instruction?: string;
  qu_text: string;
  qu_explain?: string;
  qu_category: string;
  qu_action: string;
  qu_time_limit_sec?: number | null;
  qu_images: string[] | null;
  choices: Array<{
    an_val: number;
    an_text: string;
    an_desc: string | null;
    an_sub: string | null;
    an_wei: number;
    choice_image_path?: string;
  }> | null;
}

/**
 * 선호도진단 문항들을 조회합니다 (다국어 테이블 포함)
 */
export async function getPreferenceQuestionsWithLang(
  questionFilename: string, 
  language: string
): Promise<Question[]> {
  console.log(`[선호도진단 쿼리] 다국어 테이블 포함 조회 - 파일명: ${questionFilename}, 언어: ${language}`);
  
  // 먼저 기본 데이터 존재 여부 확인
  const basicDataCheck = await prisma.$queryRaw`
    SELECT 
      q.qu_code, 
      q.qu_filename, 
      q.qu_use,
      COUNT(ql.*) as lang_count,
      STRING_AGG(DISTINCT ql.lang_code, ', ') as available_langs
    FROM mwd_question q
    LEFT JOIN mwd_question_lang ql ON q.qu_code = ql.qu_code
    WHERE q.qu_filename = ${questionFilename}
    GROUP BY q.qu_code, q.qu_filename, q.qu_use
  `;
  
  console.log(`[선호도진단 데이터 확인] 파일명 ${questionFilename}에 대한 기본 데이터:`, basicDataCheck);
  
  const questionsWithChoices = await prisma.$queryRaw`
    SELECT
        q.qu_code,
        q.qu_filename,
        q.qu_order,
        COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
        ql.qu_title,
        ql.qu_passage,
        ql.qu_instruction,
        ql.qu_text,
        ql.qu_explain,
        ql.qu_category,
        
        -- 디버깅: JOIN 상태 확인  
        'JOIN_SUCCESS' as join_status,
        ql.lang_code as actual_lang_code,
        
        -- 1. 질문 이미지들을 하나의 JSON 배열로 집계
        (
            SELECT JSON_AGG(qal_inner.image_path)
            FROM mwd_question_asset qa_inner
            JOIN mwd_question_asset_lang qal_inner ON qa_inner.asset_id = qal_inner.asset_id
            WHERE qa_inner.qu_code = q.qu_code AND qal_inner.lang_code = ${language}
        ) AS qu_images,

        -- 2. 선택지들을 하나의 JSON 배열로 집계
        (
            SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                    'an_val', qc_inner.display_order,
                    'an_text', COALESCE(qcl_inner.choice_text, CONCAT('선택지 ', qc_inner.display_order::text)),
                    'choice_image_path', qcl_inner.choice_image_path,
                    'an_wei', qc_inner.weight,
                    'an_desc', NULL,
                    'an_sub', NULL
                ) ORDER BY qc_inner.display_order
            )
            FROM mwd_question_choice qc_inner
            LEFT JOIN mwd_question_choice_lang qcl_inner ON qc_inner.choice_id = qcl_inner.choice_id AND qcl_inner.lang_code = ${language}
            WHERE qc_inner.qu_code = q.qu_code
        ) AS choices

    FROM
        mwd_question AS q
    LEFT JOIN
        mwd_question_lang AS ql ON q.qu_code = ql.qu_code
    WHERE
        q.qu_filename = ${questionFilename}
        AND ql.lang_code = ${language}
        AND q.qu_use = 'Y'
    ORDER BY
        q.qu_order ASC
  ` as QuestionChoice[];
  
  console.log(`[선호도진단 쿼리 결과] 결과 개수:`, Array.isArray(questionsWithChoices) ? questionsWithChoices.length : 0);
  if (Array.isArray(questionsWithChoices) && questionsWithChoices.length > 0) {
    console.log(`[선호도진단 쿼리 결과] 첫 번째 결과:`, JSON.stringify(questionsWithChoices[0], null, 2));
  }

  return processPreferenceQuestions(questionsWithChoices);
}

/**
 * 선호도진단 문항들을 조회합니다 (기본 테이블만)
 */
export async function getPreferenceQuestionsFallback(questionFilename: string): Promise<Question[]> {
  console.log(`[선호도진단 Fallback] 기본 테이블만으로 조회 - 파일명: ${questionFilename}`);
  
  const questionsWithChoices = await prisma.$queryRaw`
    SELECT
        q.qu_code,
        q.qu_filename,
        q.qu_order,
        COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
        COALESCE(q.qu_explain, q.qu_text, '질문 텍스트') as qu_text,
        '' as qu_title,
        '' as qu_passage,
        '' as qu_instruction,
        COALESCE(q.qu_explain, '설명') as qu_explain,
        'default' as qu_category,
        'FALLBACK_NO_LANG' as join_status,
        'none' as actual_lang_code,
        
        -- 이미지는 일단 빈 배열
        '[]'::json AS qu_images,

        -- 기본 선택지 생성 (선호도진단용 3개 선택지)
        '[
          {"an_val": 1, "an_text": "선택 A", "an_wei": 1, "an_desc": null, "an_sub": null, "choice_image_path": null},
          {"an_val": 2, "an_text": "선택 B", "an_wei": 2, "an_desc": null, "an_sub": null, "choice_image_path": null},
          {"an_val": 3, "an_text": "선택 C", "an_wei": 3, "an_desc": null, "an_sub": null, "choice_image_path": null}
        ]'::json AS choices

    FROM
        mwd_question AS q
    WHERE
        q.qu_filename = ${questionFilename}
        AND q.qu_use = 'Y'
    ORDER BY
        q.qu_order ASC
  ` as QuestionChoice[];
  
  console.log(`[선호도진단 Fallback] 결과 개수:`, Array.isArray(questionsWithChoices) ? questionsWithChoices.length : 0);

  return processPreferenceQuestions(questionsWithChoices);
}

/**
 * 쿼리 결과를 Question 타입으로 변환합니다
 */
function processPreferenceQuestions(questionsWithChoices: QuestionChoice[]): Question[] {
  const questions: Question[] = [];

  if (Array.isArray(questionsWithChoices) && questionsWithChoices.length > 0) {
    questionsWithChoices.forEach(row => {
      // 타이머 값 처리 (선호도진단은 일반적으로 타이머가 없음)
      let finalTimeLimitSec: number | null = null;
      const dbTimerValue = row.qu_time_limit_sec;
      
      if (dbTimerValue !== null && dbTimerValue !== undefined && Number(dbTimerValue) > 0) {
        finalTimeLimitSec = Number(dbTimerValue);
        console.log(`[선호도진단 타이머] ${row.qu_code}: ${finalTimeLimitSec}초 타이머 설정`);
      } else {
        console.log(`[선호도진단 타이머] ${row.qu_code}: 타이머 없음`);
      }

      const question: Question = {
        qu_code: row.qu_code,
        qu_filename: row.qu_filename,
        qu_order: row.qu_order,
        qu_title: row.qu_title && row.qu_title.trim() !== '' ? row.qu_title : undefined,
        qu_passage: row.qu_passage && row.qu_passage.trim() !== '' ? row.qu_passage : undefined,
        qu_instruction: row.qu_instruction && row.qu_instruction.trim() !== '' ? row.qu_instruction : undefined,
        qu_text: row.qu_text,
        qu_explain: row.qu_explain,
        qu_category: row.qu_category,
        qu_action: row.qu_action || '/test/savestep',
        qu_time_limit_sec: finalTimeLimitSec,
        qu_images: row.qu_images || [],
        choices: row.choices || []
      };
      questions.push(question);
    });
  }

  return questions;
} 