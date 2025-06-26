import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../../lib/db/index';
import { authOptions } from '../../../../../lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 로그인 세션 확인
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 언어 정보 추출
    const acceptLanguage = request.headers.get('Accept-Language') || 'ko-KR';
    const language = ['ko-KR', 'en-US', 'ja-JP', 'zh-CN'].includes(acceptLanguage) 
      ? acceptLanguage 
      : 'ko-KR';

    // params를 비동기적으로 처리
    const resolvedParams = await params;
    const testId = parseInt(resolvedParams.id, 10);

    if (isNaN(testId)) {
      return NextResponse.json({ error: '유효하지 않은 테스트 ID입니다' }, { status: 400 });
    }

    // 요청 본문에서 데이터 파싱
    const requestData = await request.json();
    const { anp_seq, qu_code, an_val, an_wei, step } = requestData;

    if (!anp_seq || !qu_code || an_val === undefined) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 });
    }

    console.log(`답변 저장 API 호출 - anp_seq: ${anp_seq}, qu_code: ${qu_code}, an_val: ${an_val}`);

    // 1. 답변 저장 (이미 존재하는 경우 업데이트, 없는 경우 삽입)
    // an_ex 컬럼이 integer 타입이므로 text 캐스팅 제거
    await prisma.$queryRaw`
      INSERT INTO mwd_answer (anp_seq, qu_code, an_ex, an_wei, an_progress)
      VALUES (${anp_seq}::integer, ${qu_code}, ${an_val}::integer, ${an_wei || 0}::integer, 
        (SELECT COALESCE(MAX(an_progress), 0) + 1 
         FROM mwd_answer 
         WHERE anp_seq = ${anp_seq}::integer))
      ON CONFLICT (anp_seq, qu_code) 
      DO UPDATE SET 
        an_ex = ${an_val}::integer,
        an_wei = ${an_wei || 0}::integer
    `;

    // 2. 진행 상태 업데이트
    await prisma.$queryRaw`
      UPDATE mwd_answer_progress
      SET qu_code = ${qu_code},
          anp_done = 'I',
          anp_step = ${step}
      WHERE anp_seq = ${anp_seq}::integer
    `;

    // 3. 현재 단계 완료 여부 확인 및 다음 질문 추출
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
          WHERE ap.anp_seq = ${anp_seq}::integer
            AND qu.qu_kind1 = (SELECT anp_step FROM mwd_answer_progress WHERE anp_seq = ${anp_seq}::integer)
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
          WHERE ap.anp_seq = ${anp_seq}::integer AND pl.anp_seq = ap.anp_seq AND pl.qu_code = ap.qu_code
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
    `;

    let nextQuestion = null;
    let isStepCompleted = false;
    
    if (Array.isArray(nextQuestionResult) && nextQuestionResult.length > 0) {
      nextQuestion = nextQuestionResult[0];
    } else {
      // 현재 단계에서 다음 질문이 없는 경우, 단계 완료 확인
      console.log('현재 단계에서 다음 질문이 없음. 단계 완료 여부 확인 중...');
      
      // 성향 진단(tnd) 완료 후 사고력 진단(thk)으로 전환
      if (step === 'tnd') {
        console.log('성향 진단 완료. 사고력 진단으로 전환 시도...');
        
        // 사고력 진단의 첫 번째 문항 조회
        const thinkingQuestionResult = await prisma.$queryRaw`
          SELECT 
              qu.qu_filename, 
              qu.qu_code, 
              qu.qu_kind1 AS step,
              'tnd' AS prev_step,
              qu.qu_action, 
              ${qu_code} AS prev_code, 
              COALESCE(qa.qua_type, '-') AS qua_type, 
              cr.pd_kind
          FROM mwd_question qu
          JOIN mwd_choice_result cr ON cr.cr_seq = (
              SELECT cr_seq FROM mwd_answer_progress WHERE anp_seq = ${anp_seq}::integer
          )
          LEFT JOIN mwd_question_attr qa ON qa.qua_code = 
              CASE WHEN qu.qu_kind1 = 'img' THEN qu.qu_kind3 ELSE qu.qu_kind2 END
          WHERE qu.qu_use = 'Y'
            AND qu.qu_kind1 = 'thk'
            AND qu.qu_filename NOT LIKE '%Index%'
            AND qu.qu_filename NOT LIKE '%index%'
          ORDER BY qu.qu_filename, qu.qu_order
          LIMIT 1
        `;
        
        if (Array.isArray(thinkingQuestionResult) && thinkingQuestionResult.length > 0) {
          nextQuestion = thinkingQuestionResult[0];
          console.log('사고력 진단 첫 문항 찾음:', nextQuestion);
          
          // answer_progress의 단계를 사고력 진단으로 업데이트
          await prisma.$queryRaw`
            UPDATE mwd_answer_progress
            SET anp_step = 'thk',
                qu_code = ${nextQuestion.qu_code}
            WHERE anp_seq = ${anp_seq}::integer
          `;
          
          console.log('answer_progress 테이블 업데이트 완료: anp_step=thk, qu_code=', nextQuestion.qu_code);
          
          // 성향 진단 완료 상태로 설정하여 안내페이지가 나타나도록 함
          isStepCompleted = true;
          console.log('성향 진단 완료 상태로 설정 - 안내페이지 표시');
        } else {
          isStepCompleted = true;
          console.log('성향 진단 완료 - 사고력 진단 문항 없음');
        }
      } else if (step === 'thk') {
        // 사고력 진단에서 현재 파일명의 문제가 완료되면 다음 파일명의 문제로 진행
        console.log('사고력 진단에서 다음 파일명의 문제 조회 시도...');
        
        // 현재 문제의 파일명 가져오기
        const currentFilenameResult = await prisma.$queryRaw`
          SELECT qu_filename FROM mwd_question WHERE qu_code = ${qu_code} AND qu_use = 'Y'
        `;
        
        let currentFilename = '';
        if (Array.isArray(currentFilenameResult) && currentFilenameResult.length > 0) {
          currentFilename = currentFilenameResult[0].qu_filename;
        }
        
        // 사고력 진단의 다음 파일명 문제 조회
        const nextThinkingQuestionResult = await prisma.$queryRaw`
          SELECT 
              qu.qu_filename, 
              qu.qu_code, 
              qu.qu_kind1 AS step,
              'thk' AS prev_step,
              qu.qu_action, 
              ${qu_code} AS prev_code, 
              COALESCE(qa.qua_type, '-') AS qua_type, 
              cr.pd_kind
          FROM mwd_question qu
          JOIN mwd_choice_result cr ON cr.cr_seq = (
              SELECT cr_seq FROM mwd_answer_progress WHERE anp_seq = ${anp_seq}::integer
          )
          LEFT JOIN mwd_question_attr qa ON qa.qua_code = 
              CASE WHEN qu.qu_kind1 = 'img' THEN qu.qu_kind3 ELSE qu.qu_kind2 END
          WHERE qu.qu_use = 'Y'
            AND qu.qu_kind1 = 'thk'
            AND qu.qu_filename NOT LIKE '%Index%'
            AND qu.qu_filename NOT LIKE '%index%'
            AND qu.qu_filename > ${currentFilename}
          ORDER BY qu.qu_filename, qu.qu_order
          LIMIT 1
        `;
        
        if (Array.isArray(nextThinkingQuestionResult) && nextThinkingQuestionResult.length > 0) {
          nextQuestion = nextThinkingQuestionResult[0];
          console.log('사고력 진단 다음 파일명 문항 찾음:', nextQuestion);
          
          // answer_progress 업데이트
          await prisma.$queryRaw`
            UPDATE mwd_answer_progress
            SET qu_code = ${nextQuestion.qu_code}
            WHERE anp_seq = ${anp_seq}::integer
          `;
        } else {
          // 사고력 진단 완료 후 선호도 진단(img)으로 전환
          console.log('사고력 진단 완료. 선호도 진단으로 전환 시도...');
          
          const preferenceQuestionResult = await prisma.$queryRaw`
            SELECT 
                qu.qu_filename, 
                qu.qu_code, 
                qu.qu_kind1 AS step,
                'thk' AS prev_step,
                qu.qu_action, 
                ${qu_code} AS prev_code, 
                COALESCE(qa.qua_type, '-') AS qua_type, 
                cr.pd_kind
            FROM mwd_question qu
            JOIN mwd_choice_result cr ON cr.cr_seq = (
                SELECT cr_seq FROM mwd_answer_progress WHERE anp_seq = ${anp_seq}::integer
            )
            LEFT JOIN mwd_question_attr qa ON qa.qua_code = 
                CASE WHEN qu.qu_kind1 = 'img' THEN qu.qu_kind3 ELSE qu.qu_kind2 END
            WHERE qu.qu_use = 'Y'
              AND qu.qu_kind1 = 'img'
              AND qu.qu_filename NOT LIKE '%Index%'
              AND qu.qu_filename NOT LIKE '%index%'
            ORDER BY qu.qu_filename, qu.qu_order
            LIMIT 1
          `;
          
          if (Array.isArray(preferenceQuestionResult) && preferenceQuestionResult.length > 0) {
            nextQuestion = preferenceQuestionResult[0];
            console.log('선호도 진단 첫 문항 찾음:', nextQuestion);
            
            // answer_progress의 단계를 선호도 진단으로 업데이트
            await prisma.$queryRaw`
              UPDATE mwd_answer_progress
              SET anp_step = 'img',
                  qu_code = ${nextQuestion.qu_code}
              WHERE anp_seq = ${anp_seq}::integer
            `;
            
            // 사고력 진단 완료 상태로 설정하여 안내페이지가 나타나도록 함
            isStepCompleted = true;
            console.log('사고력 진단 완료 상태로 설정 - 안내페이지 표시');
          } else {
            isStepCompleted = true;
            console.log('사고력 진단 완료 - 선호도 진단 문항 없음');
          }
        }
      } else {
        // 모든 단계 완료
        isStepCompleted = true;
        console.log('모든 단계 완료');
      }
    }

    // 4. 완료율 계산
    const progressResult = await prisma.$queryRaw`
      WITH current_progress_details AS (
        -- 현재 anp_seq에 대한 step, ac_gid, cr_seq, pd_kind 정보를 가져옵니다.
        SELECT
            ap.anp_seq,
            ap.anp_step,
            ap.ac_gid,
            ap.cr_seq,
            cr.pd_kind
        FROM mwd_answer_progress ap
        JOIN mwd_choice_result cr ON cr.ac_gid = ap.ac_gid AND cr.cr_seq = ap.cr_seq
        WHERE ap.anp_seq = ${anp_seq}::integer
        LIMIT 1 -- anp_seq는 PK이므로 하나의 행만 반환됩니다.
    ),
    total_questions_for_step AS (
        -- 현재 단계(anp_step)의 "총 문제 수 (tcnt)"를 계산합니다.
        SELECT
            COUNT(qu.qu_code) AS tcnt,
            cpd.anp_step AS step
        FROM mwd_question qu
        JOIN current_progress_details cpd ON qu.qu_kind1 = cpd.anp_step -- 현재 단계의 문제만 필터링
        WHERE qu.qu_use = 'Y'
          AND qu.qu_qusyn = 'Y' -- 사용자의 "총문제수" 예시 쿼리 조건
          -- pd_kind에 따른 필터링 제거 (모든 단계 포함)
          AND TRUE
        GROUP BY cpd.anp_step
    ),
    answered_questions_for_step AS (
        -- 현재 단계(anp_step)에서 "답변된 문제 수 (acnt)"를 계산합니다.
       SELECT
        COUNT(an.qu_code) AS acnt -- 또는 COUNT(*)
        FROM mwd_answer an
        JOIN mwd_question qu ON qu.qu_code = an.qu_code
        JOIN current_progress_details cpd ON an.anp_seq = cpd.anp_seq AND qu.qu_kind1 = cpd.anp_step
        WHERE an.an_progress > 0
          AND an.an_ex >= 0
          AND qu.qu_use = 'Y'
          AND qu.qu_qusyn = 'Y'
          AND TRUE
    )
    SELECT
        COALESCE(tqs.tcnt, 0) AS tcnt,
        COALESCE(aqs.acnt, 0) AS acnt,
        cpd.anp_step AS step, -- current_progress_details에서 step을 가져옴
        CASE
            WHEN cpd.anp_step = 'thk' THEN 'ui green progress'
            WHEN cpd.anp_step = 'tnd' THEN 'ui pink progress'
            WHEN cpd.anp_step = 'img' THEN 'ui blue progress'
            ELSE 'ui grey progress' -- 기본값 또는 에러 처리
        END AS progress, -- progress로 컬럼명 변경
        CASE
            WHEN COALESCE(tqs.tcnt, 0) = 0 THEN 0 -- 분모가 0이면 0%
            ELSE ROUND((COALESCE(aqs.acnt, 0)::numeric / tqs.tcnt) * 100) -- numeric으로 형변환하여 정확도 향상
        END AS completion_percentage
    FROM
        current_progress_details cpd
    LEFT JOIN
        total_questions_for_step tqs ON cpd.anp_step = tqs.step
    LEFT JOIN
        answered_questions_for_step aqs ON 1=1 -- answered_questions_for_step은 항상 단일 행(또는 0)을 반환
    `;

    console.log('progressResult:', progressResult);

    // 5. 현재 페이지에 표시할 문항과 답변 선택지 조회
    const questionFilename = nextQuestion?.qu_filename;
    console.log('다음 문항 파일명:', questionFilename);

    interface QuestionChoice {
      qu_code: string;
      qu_filename: string;
      qu_order: number;
      qu_time_limit_sec?: number | null;
      qu_text: string;
      qu_explain?: string;
      qu_category: string;
      qu_action: string;
      qu_images: string[] | null;  // JSON 배열로 변경
      choices: Array<{
        an_val: number;
        an_text: string;
        an_desc: string | null;
        an_sub: string | null;
        an_wei: number;
        choice_image_path?: string;
      }> | null;  // JSON 배열로 변경
    }

    interface Question {
      qu_code: string;
      qu_filename: string;
      qu_order: number;
      qu_time_limit_sec?: number | null;
      qu_text: string;
      qu_explain?: string;
      qu_category: string;
      qu_action: string;
      qu_images?: string[];
      choices: Array<{
        an_val: number;
        an_text: string;
        an_desc: string | null;
        an_sub: string | null;
        an_wei: number;
        choice_image_path?: string;
      }>;
    }

    const questions: Question[] = [];
    
    if (questionFilename) {
      // 다국어 테이블이 존재하는지 확인하고, 없으면 기존 방식 사용
      let questionsWithChoices;
      try {
        // JSON 집계 함수를 사용한 쿼리 (이미지와 선택지 중복 제거)
        questionsWithChoices = await prisma.$queryRaw`
          SELECT
              q.qu_code,
              q.qu_filename,
              q.qu_order,
              COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
              q.qu_action,
              ql.qu_text,
              ql.qu_explain,
              ql.qu_category,
              
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
                                  WHEN qc_inner.display_order = 1 THEN '매우 그렇다'
                                  WHEN qc_inner.display_order = 2 THEN '그렇다'
                                  WHEN qc_inner.display_order = 3 THEN '약간 그렇다'
                                  WHEN qc_inner.display_order = 4 THEN '별로 그렇지 않다'
                                  WHEN qc_inner.display_order = 5 THEN '그렇지 않다'
                                  WHEN qc_inner.display_order = 6 THEN '전혀 그렇지 않다'
                                  ELSE '선택지'
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
        `;
      } catch (error) {
        console.log('다국어 테이블 쿼리 실패, 기존 방식으로 폴백:', error);
        // 기존 방식으로 폴백
        questionsWithChoices = await prisma.$queryRaw`
          SELECT
            q.qu_code,
            q.qu_filename,
            q.qu_order,
            COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
            COALESCE(q.qu_explain, '질문 텍스트') as qu_text,
            'default' as qu_category,
            q.qu_action,
            1 as an_val,
            '매우 그렇다' as an_text,
            null as an_desc,
            null as an_sub,
            q.qu_ex1wei as an_wei,
            null as choice_image_path,
            null as qu_image
          FROM mwd_question q
          WHERE q.qu_filename = ${questionFilename} AND q.qu_use = 'Y'
          
          UNION ALL
          
          SELECT
            q.qu_code,
            q.qu_filename,
            q.qu_order,
            COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
            COALESCE(q.qu_explain, '질문 텍스트') as qu_text,
            'default' as qu_category,
            q.qu_action,
            2 as an_val,
            '그렇다' as an_text,
            null as an_desc,
            null as an_sub,
            q.qu_ex2wei as an_wei,
            null as choice_image_path,
            null as qu_image
          FROM mwd_question q
          WHERE q.qu_filename = ${questionFilename} AND q.qu_use = 'Y'
          
          UNION ALL
          
          SELECT
            q.qu_code,
            q.qu_filename,
            q.qu_order,
            COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
            COALESCE(q.qu_explain, '질문 텍스트') as qu_text,
            'default' as qu_category,
            q.qu_action,
            3 as an_val,
            '약간 그렇다' as an_text,
            null as an_desc,
            null as an_sub,
            q.qu_ex3wei as an_wei,
            null as choice_image_path,
            null as qu_image
          FROM mwd_question q
          WHERE q.qu_filename = ${questionFilename} AND q.qu_use = 'Y'
          
          UNION ALL
          
          SELECT
            q.qu_code,
            q.qu_filename,
            q.qu_order,
            COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
            COALESCE(q.qu_explain, '질문 텍스트') as qu_text,
            'default' as qu_category,
            q.qu_action,
            4 as an_val,
            '별로 그렇지 않다' as an_text,
            null as an_desc,
            null as an_sub,
            q.qu_ex4wei as an_wei,
            null as choice_image_path,
            null as qu_image
          FROM mwd_question q
          WHERE q.qu_filename = ${questionFilename} AND q.qu_use = 'Y'
          
          UNION ALL
          
          SELECT
            q.qu_code,
            q.qu_filename,
            q.qu_order,
            COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
            COALESCE(q.qu_explain, '질문 텍스트') as qu_text,
            'default' as qu_category,
            q.qu_action,
            5 as an_val,
            '그렇지 않다' as an_text,
            null as an_desc,
            null as an_sub,
            q.qu_ex5wei as an_wei,
            null as choice_image_path,
            null as qu_image
          FROM mwd_question q
          WHERE q.qu_filename = ${questionFilename} AND q.qu_use = 'Y'
          
          UNION ALL
          
          SELECT
            q.qu_code,
            q.qu_filename,
            q.qu_order,
            COALESCE(q.qu_time_limit_sec, 0)::integer as qu_time_limit_sec,
            COALESCE(q.qu_explain, '질문 텍스트') as qu_text,
            'default' as qu_category,
            q.qu_action,
            6 as an_val,
            '전혀 그렇지 않다' as an_text,
            null as an_desc,
            null as an_sub,
            q.qu_ex6wei as an_wei,
            null as choice_image_path,
            null as qu_image
          FROM mwd_question q
          WHERE q.qu_filename = ${questionFilename} AND q.qu_use = 'Y'
          
          ORDER BY qu_order ASC, an_val ASC
        `;
      }

      // 문항과 선택지를 문항별로 그룹화 (JSON 구조 처리)
      if (Array.isArray(questionsWithChoices) && questionsWithChoices.length > 0) {
        (questionsWithChoices as QuestionChoice[]).forEach(row => {
          const question: Question = {
            qu_code: row.qu_code,
            qu_filename: row.qu_filename,
            qu_order: row.qu_order,
            qu_time_limit_sec: row.qu_time_limit_sec,
            qu_text: row.qu_text,
            qu_explain: row.qu_explain,
            qu_category: row.qu_category,
            qu_action: row.qu_action,
            qu_images: row.qu_images || [],
            choices: row.choices || []
          };
          
          questions.push(question);
        });
      }
    }

    // 완료 상태 확인
    const isCompleted = !nextQuestion;
    
    // 전체 테스트 완료 시에만 기본 완료 처리
    if (isCompleted) {
      await prisma.$queryRaw`
        UPDATE mwd_answer_progress
        SET anp_done = 'E',
            anp_end_date = NOW()
        WHERE anp_seq = ${anp_seq}::integer
      `;
      console.log('전체 테스트 완료 처리됨');
    }

    // BigInt 직렬화 오류 해결을 위한 헬퍼 함수
    const prepareBigIntForJSON = (data: unknown): unknown => {
      if (data === null || data === undefined) {
        return data;
      }
      
      if (typeof data === 'bigint') {
        return Number(data);
      }
      
      if (Array.isArray(data)) {
        return data.map(item => prepareBigIntForJSON(item));
      }
      
      if (typeof data === 'object') {
        const result: Record<string, unknown> = {};
        for (const key in data as Record<string, unknown>) {
          result[key] = prepareBigIntForJSON((data as Record<string, unknown>)[key]);
        }
        return result;
      }
      
      return data;
    };

    // ResponseData 처리 시 BigInt 변환
    const responseData = prepareBigIntForJSON({
      success: true,
      anp_seq: anp_seq,
      isCompleted,
      isStepCompleted,
      nextQuestion,
      progress: Array.isArray(progressResult) && progressResult.length > 0 ? progressResult[0] : null,
      questions,
      // 현재 페이지와 총 문항 수 정보 추가
      completed_pages: Array.isArray(progressResult) && progressResult.length > 0 ? progressResult[0].acnt : 0,
      total_questions: Array.isArray(progressResult) && progressResult.length > 0 ? progressResult[0].tcnt : 0
    });

    // 현재 단계 완료 여부 최종 확인 (모든 단계에 대해)
    if (!isCompleted && !isStepCompleted) {
      // BigInt 타입을 Number로 변환하여 처리
      const completedPages = Array.isArray(progressResult) && progressResult.length > 0 
        ? Number((progressResult[0] as { acnt: bigint | number }).acnt)
        : 0;
      
      const totalQuestions = Array.isArray(progressResult) && progressResult.length > 0 
        ? Number((progressResult[0] as { tcnt: bigint | number }).tcnt)
        : 0;
        
      console.log(`단계 완료 체크 (${step}): 완료된 페이지 ${completedPages}, 총 문항 수 ${totalQuestions}`);
      
      // 현재 단계의 모든 문항이 완료된 경우
      if (completedPages >= totalQuestions) {
        console.log(`${step} 단계 모든 문항 완료됨, 다음 단계 전환 시작`);
        
        try {
          if (step === 'tnd') {
            // 성향 진단 완료 처리
            console.log('성향 진단 점수 계산 시작');
            
            // 1. 기존 점수 데이터 삭제
            await prisma.$queryRaw`
              DELETE FROM mwd_score1 
              WHERE anp_seq = ${anp_seq}::integer 
              AND sc1_step = 'tnd'
            `;
            
            // 2. 새로운 점수 데이터 계산 및 삽입
            await prisma.$queryRaw`
              INSERT INTO mwd_score1 
              (anp_seq, sc1_step, qua_code, sc1_score, sc1_rate, sc1_rank, sc1_qcnt) 
              SELECT 
                ${anp_seq}::integer AS anpseq, 
                'tnd' AS tnd, 
                qua_code, 
                score, 
                rate, 
                row_number() OVER (ORDER BY rate DESC, fcnt DESC, ocnt), 
                cnt 
              FROM (
                SELECT 
                  qa.qua_code, 
                  sum(an.an_wei) AS score, 
                  round(cast(sum(an.an_wei) AS numeric)/cast(qa.qua_totalscore AS numeric),3) AS rate, 
                  count(*) AS cnt, 
                  cast(sum(CASE WHEN an.an_wei = 5 THEN 1 ELSE 0 END) AS numeric) AS fcnt, 
                  cast(sum(CASE WHEN an.an_wei = 1 THEN 1 ELSE 0 END) AS numeric) AS ocnt 
                FROM 
                  mwd_answer an, 
                  mwd_question qu, 
                  mwd_question_attr qa 
                WHERE 
                  an.anp_seq = ${anp_seq}::integer 
                  AND qu.qu_code = an.qu_code 
                  AND qu.qu_qusyn = 'Y' 
                  AND qu.qu_use = 'Y' 
                  AND qu.qu_kind1 = 'tnd' 
                  AND qa.qua_code = qu.qu_kind2 
                  AND an.an_ex > 0 
                  AND an.an_progress > 0 
                GROUP BY 
                  qa.qua_code, qa.qua_totalscore
              ) AS t1
            `;
            
            // 3. 다음 단계(사고력 진단)로 업데이트
            await prisma.$queryRaw`
              UPDATE mwd_answer_progress 
              SET qu_code = 'thk00000', 
                  anp_done = 'I', 
                  anp_step = 'thk' 
              WHERE anp_seq = ${anp_seq}::integer
            `;
            
            console.log('성향 진단 점수 계산 및 사고력 진단 단계로 업데이트 완료');
            
          } else if (step === 'thk') {
            // 사고력 진단 완료 처리 - 선호도 진단으로 전환
            await prisma.$queryRaw`
              UPDATE mwd_answer_progress 
              SET qu_code = 'img00000', 
                  anp_done = 'I', 
                  anp_step = 'img' 
              WHERE anp_seq = ${anp_seq}::integer
            `;
            
            console.log('사고력 진단 완료, 선호도 진단 단계로 업데이트 완료');
            
          } else if (step === 'img') {
            // 선호도 진단 완료 처리 - 전체 테스트 완료
            await prisma.$queryRaw`
              UPDATE mwd_answer_progress 
              SET anp_done = 'E', 
                  anp_end_date = NOW() 
              WHERE anp_seq = ${anp_seq}::integer
            `;
            
            console.log('선호도 진단 완료, 전체 테스트 완료 처리됨');
          }
          
          // 응답 데이터에 단계 완료 플래그 및 다음 단계 정보 추가
          (responseData as Record<string, unknown>).isStepCompleted = true;
          
          // 다음 단계 정보 설정
          let nextStepInfo = null;
          if (step === 'tnd') {
            nextStepInfo = {
              step: 'thk',
              qu_code: 'thk00000',
              qu_filename: 'thk00000',
              prev_step: 'tnd'
            };
          } else if (step === 'thk') {
            nextStepInfo = {
              step: 'img',
              qu_code: 'img00000', 
              qu_filename: 'img00000',
              prev_step: 'thk'
            };
          }
          
          if (nextStepInfo) {
            (responseData as Record<string, unknown>).nextQuestion = nextStepInfo;
            console.log(`다음 단계 정보 설정: ${step} -> ${nextStepInfo.step}`);
          }
          
        } catch (error) {
          console.error(`${step} 단계 완료 처리 중 오류:`, error);
        }
      }
    }

    console.log('답변 저장 완료');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('답변 저장 API 오류:', error);
    return NextResponse.json(
      { error: '답변을 저장하는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 