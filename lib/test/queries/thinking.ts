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
  qu_template_type?: string | null;  // 템플릿 유형 추가
  qu_images: string[] | null;
  join_status?: string;
  actual_lang_code?: string;
  passage_length?: number;
  passage_is_null?: boolean;
  passage_is_empty?: boolean;
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
 * 사고력진단 문항들을 조회합니다 (다국어 테이블 포함)
 */
export async function getThinkingQuestionsWithLang(
  questionFilename: string, 
  language: string
): Promise<Question[]> {
  console.log(`[사고력진단 쿼리] 다국어 테이블 포함 조회 - 파일명: ${questionFilename}, 언어: ${language}`);
  
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
  
  console.log(`[사고력진단 데이터 확인] 파일명 ${questionFilename}에 대한 기본 데이터:`, basicDataCheck);
  
  // thk06090 문제에 대한 특별 디버깅
  if (questionFilename.includes('06090')) {
    console.log(`🔍 [thk06090 특별 디버깅] 쿼리 실행 전 상태:`, {
      questionFilename,
      language,
      basicDataCheck
    });
    
    // thk06090의 qu_passage 데이터를 직접 조회
    const directCheck = await prisma.$queryRaw`
      SELECT 
        q.qu_code,
        q.qu_filename,
        ql.lang_code,
        ql.qu_title,
        ql.qu_passage,
        ql.qu_instruction,
        ql.qu_text,
        LENGTH(ql.qu_passage) as passage_length,
        ql.qu_passage IS NULL as passage_is_null,
        ql.qu_passage = '' as passage_is_empty
      FROM mwd_question q
      LEFT JOIN mwd_question_lang ql ON q.qu_code = ql.qu_code
      WHERE q.qu_code = 'thk06090' AND ql.lang_code = ${language}
    `;
    console.log(`🔍 [thk06090 직접 조회] DB에서 직접 가져온 데이터:`, directCheck);
  }
  
  const questionsWithChoices = await prisma.$queryRaw`
    SELECT
        q.qu_code,
        q.qu_filename,
        q.qu_order,
        COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
        q.qu_template_type,
        ql.qu_title,
        ql.qu_passage,
        ql.qu_instruction,
        ql.qu_text,
        ql.qu_explain,
        ql.qu_category,
        
        -- 디버깅: JOIN 상태 확인  
        'JOIN_SUCCESS' as join_status,
        ql.lang_code as actual_lang_code,
        
        -- qu_passage 디버깅 정보 추가
        LENGTH(ql.qu_passage) as passage_length,
        ql.qu_passage IS NULL as passage_is_null,
        ql.qu_passage = '' as passage_is_empty,
        
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
                    'an_text', COALESCE(qcl_inner.choice_text, 
                        CASE 
                            WHEN qc_inner.display_order = 1 THEN '①'
                            WHEN qc_inner.display_order = 2 THEN '②'
                            WHEN qc_inner.display_order = 3 THEN '③'
                            WHEN qc_inner.display_order = 4 THEN '④'
                            WHEN qc_inner.display_order = 5 THEN '⑤'
                            ELSE CONCAT('선택지 ', qc_inner.display_order::text)
                        END
                    ),
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
  
  console.log(`[사고력진단 쿼리 결과] 결과 개수:`, Array.isArray(questionsWithChoices) ? questionsWithChoices.length : 0);
  if (Array.isArray(questionsWithChoices) && questionsWithChoices.length > 0) {
    console.log(`[사고력진단 쿼리 결과] 첫 번째 결과:`, JSON.stringify(questionsWithChoices[0], null, 2));
    
    // thk06090에 대한 특별 디버깅
    const thk06090Result = questionsWithChoices.find(q => q.qu_code === 'thk06090');
    if (thk06090Result) {
      console.log(`🔍 [thk06090 쿼리 결과] 상세 분석:`, {
        qu_code: thk06090Result.qu_code,
        qu_template_type: thk06090Result.qu_template_type || 'NULL',
        qu_passage_type: typeof thk06090Result.qu_passage,
        qu_passage_value: thk06090Result.qu_passage,
        qu_passage_length: thk06090Result.qu_passage ? thk06090Result.qu_passage.length : 0,
        qu_passage_preview: thk06090Result.qu_passage ? thk06090Result.qu_passage.substring(0, 100) + '...' : 'null/undefined',
        passage_is_null: thk06090Result.passage_is_null,
        passage_is_empty: thk06090Result.passage_is_empty,
        passage_length: thk06090Result.passage_length,
        join_status: thk06090Result.join_status,
        actual_lang_code: thk06090Result.actual_lang_code
      });
    }
  }

  return processThinkingQuestions(questionsWithChoices);
}

/**
 * 사고력진단 문항들을 조회합니다 (기본 테이블만)
 */
export async function getThinkingQuestionsFallback(questionFilename: string): Promise<Question[]> {
  console.log(`[사고력진단 Fallback] 기본 테이블만으로 조회 - 파일명: ${questionFilename}`);
  
  const questionsWithChoices = await prisma.$queryRaw`
    SELECT
        q.qu_code,
        q.qu_filename,
        q.qu_order,
        COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
        q.qu_template_type,
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

        -- 기본 선택지 생성 (사고력진단용 4개 선택지)
        '[
          {"an_val": 1, "an_text": "선택 1", "an_wei": 1, "an_desc": null, "an_sub": null, "choice_image_path": null},
          {"an_val": 2, "an_text": "선택 2", "an_wei": 2, "an_desc": null, "an_sub": null, "choice_image_path": null},
          {"an_val": 3, "an_text": "선택 3", "an_wei": 3, "an_desc": null, "an_sub": null, "choice_image_path": null},
          {"an_val": 4, "an_text": "선택 4", "an_wei": 4, "an_desc": null, "an_sub": null, "choice_image_path": null}
        ]'::json AS choices

    FROM
        mwd_question AS q
    WHERE
        q.qu_filename = ${questionFilename}
        AND q.qu_use = 'Y'
    ORDER BY
        q.qu_order ASC
  ` as QuestionChoice[];
  
  console.log(`[사고력진단 Fallback] 결과 개수:`, Array.isArray(questionsWithChoices) ? questionsWithChoices.length : 0);

  return processThinkingQuestions(questionsWithChoices);
}

/**
 * 쿼리 결과를 Question 타입으로 변환합니다
 */
function processThinkingQuestions(questionsWithChoices: QuestionChoice[]): Question[] {
  const questions: Question[] = [];

  if (Array.isArray(questionsWithChoices) && questionsWithChoices.length > 0) {
    questionsWithChoices.forEach(row => {
      // [핵심] DB에서 가져온 타이머 값을 정확하게 처리하여 다음 단계 이동 시에도 타이머가 바로 표시되도록 합니다.
      let finalTimeLimitSec: number | null = null;
      
      // DB 원본 값 확인 및 강화된 검증
      const dbTimerValue = row.qu_time_limit_sec;
      console.log(`[사고력진단 타이머 검증] ${row.qu_code}: DB값=${dbTimerValue} (타입: ${typeof dbTimerValue})`);
      
      // DB에 실제 양수 값이 있을 때만 타이머 설정 (더 엄격한 조건)
      if (dbTimerValue !== null && dbTimerValue !== undefined && Number(dbTimerValue) > 0) {
        finalTimeLimitSec = Number(dbTimerValue);
        console.log(`[사고력진단 타이머 확정] ${row.qu_code}: ${finalTimeLimitSec}초 타이머 설정 → 프론트엔드에서 표시됨`);
      } else {
        console.log(`[사고력진단 타이머 제외] ${row.qu_code}: 타이머 없음 (DB값: ${dbTimerValue}) → 프론트엔드에서 숨김`);
      }
      
      // qu_passage 및 qu_template_type 강화된 디버깅 로그
      if (row.qu_code.startsWith('thk')) {
        console.log(`[사고력진단 qu_passage 디버깅] ${row.qu_code}:`, {
          qu_template_type: row.qu_template_type || 'NULL',
          qu_title: row.qu_title && row.qu_title.trim() !== '' ? `있음(${row.qu_title.length}자)` : '없음/빈값',
          qu_passage: row.qu_passage && row.qu_passage.trim() !== '' ? `있음(${row.qu_passage.length}자)` : '없음/빈값',
          qu_instruction: row.qu_instruction && row.qu_instruction.trim() !== '' ? `있음(${row.qu_instruction.length}자)` : '없음/빈값',
          qu_text: row.qu_text ? `있음(${row.qu_text.length}자)` : '없음',
          raw_passage: row.qu_passage === null ? 'NULL' : row.qu_passage === undefined ? 'UNDEFINED' : `"${row.qu_passage}"`
        });
        
        // thk06090에 대한 특별 디버깅
        if (row.qu_code === 'thk06090') {
          console.log(`🔍 [thk06090 processThinkingQuestions] 상세 분석:`, {
            qu_code: row.qu_code,
            qu_passage_raw: row.qu_passage,
            qu_passage_type: typeof row.qu_passage,
            qu_passage_length: row.qu_passage ? row.qu_passage.length : 0,
            qu_passage_is_null: row.qu_passage === null,
            qu_passage_is_undefined: row.qu_passage === undefined,
            qu_passage_is_empty_string: row.qu_passage === '',
            qu_passage_trim_length: row.qu_passage ? row.qu_passage.trim().length : 0,
            passage_length_from_db: row.passage_length,
            passage_is_null_from_db: row.passage_is_null,
            passage_is_empty_from_db: row.passage_is_empty,
            will_be_included: row.qu_passage && row.qu_passage.trim() !== '',
            qu_passage_preview: row.qu_passage ? row.qu_passage.substring(0, 200) + '...' : 'null/undefined'
          });
        }
      }

      // qu_passage 처리 로직 강화 - trim 조건을 더 관대하게 변경
      let processedQuPassage: string | undefined = undefined;
      if (row.qu_passage !== null && row.qu_passage !== undefined) {
        // null이나 undefined가 아니면 일단 받아들임
        const trimmedPassage = row.qu_passage.trim();
        if (trimmedPassage !== '') {
          processedQuPassage = row.qu_passage; // 원본 데이터 유지 (trim하지 않음)
        }
      }
      
      // thk06090 처리 결과 디버깅
      if (row.qu_code === 'thk06090') {
        console.log(`🔍 [thk06090 처리 결과] qu_passage 최종 처리:`, {
          original: row.qu_passage,
          processed: processedQuPassage,
          will_render: processedQuPassage !== undefined
        });
      }

      const question: Question = {
        qu_code: row.qu_code,
        qu_filename: row.qu_filename,
        qu_order: row.qu_order,
        qu_title: row.qu_title && row.qu_title.trim() !== '' ? row.qu_title : undefined,
        qu_passage: processedQuPassage,
        qu_instruction: row.qu_instruction && row.qu_instruction.trim() !== '' ? row.qu_instruction : undefined,
        qu_text: row.qu_text,
        qu_explain: row.qu_explain,
        qu_category: row.qu_category,
        qu_action: row.qu_action || '/test/savestep',
        qu_time_limit_sec: finalTimeLimitSec, // 처리된 타이머 값 사용
        qu_template_type: row.qu_template_type, // 템플릿 유형 추가
        qu_images: row.qu_images || [],
        choices: row.choices || []
      };
      questions.push(question);
    });
  }

  return questions;
} 