import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../../lib/db/index';
import { authOptions } from '../../../../../lib/auth';
import { 
  calculatePersonalityResults, 
  calculateThinkingResults, 
  calculatePreferenceResults,
  calculateFinalResults 
} from '../../../../../lib/test/services/results';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let requestData: {
    anp_seq?: number;
    qu_code?: string;
    an_val?: number;
    an_wei?: number;
    step?: string;
    isStartPage?: boolean;
  } = {};
  
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
    requestData = await request.json();
    const { anp_seq, qu_code, an_val, an_wei, step, isStartPage } = requestData;

    // 시작 페이지가 아닐 때만 qu_code 검증
    if (!anp_seq || (!qu_code && !isStartPage) || an_val === undefined) {
      console.log('[DEBUG] 필수 파라미터 검증 실패:', {
        anp_seq: anp_seq,
        qu_code: qu_code,
        an_val: an_val,
        an_val_type: typeof an_val,
        an_val_undefined: an_val === undefined,
        isStartPage: isStartPage
      });
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 });
    }

    console.log('[DEBUG] 답변 저장 파라미터:', {
      anp_seq,
      qu_code: qu_code || '(빈 문자열)',
      qu_code_length: qu_code ? qu_code.length : 0,
      an_val,
      an_wei,
      step,
      isStartPage
    });

    // 1. 답변 저장 (시작 페이지가 아닌 경우만)
    if (!isStartPage) {
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
    } else {
      console.log('[DEBUG] 시작 페이지이므로 답변 저장 건너뜀');
    }

    // 2. 진행 상태 업데이트
    if (isStartPage) {
      // 시작 페이지인 경우 실제 첫 번째 문제로 qu_code 업데이트
      console.log('[DEBUG] 시작 페이지에서 실제 첫 번째 문제로 전환');
      console.log('[DEBUG] 현재 qu_code:', qu_code, '타입:', typeof qu_code);
      
      let firstQuCode = qu_code; // 기본값으로 현재 qu_code 사용
      
      // 데이터베이스에서 해당 단계의 실제 첫 번째 문제 조회
      try {
        const firstQuestionResult = await prisma.$queryRaw`
          SELECT qu_code
          FROM mwd_question
          WHERE qu_kind1 = ${step}
            AND qu_use = 'Y'
            AND qu_filename NOT LIKE '%Index%'
            AND qu_filename NOT LIKE '%index%'
           ORDER BY qu_filename ASC
          LIMIT 1
        `;
        
        if (Array.isArray(firstQuestionResult) && firstQuestionResult.length > 0) {
          firstQuCode = firstQuestionResult[0].qu_code;
          console.log(`[DEBUG] DB에서 조회한 첫 번째 문제: ${firstQuCode}`);
        } else {
          console.error(`[DEBUG] ${step} 단계의 첫 번째 문제를 찾을 수 없음`);
          throw new Error(`No questions found for step: ${step}`);
        }
      } catch (dbError) {
        console.error('[DEBUG] DB 조회 실패, 폴백 사용:', dbError);
        // 폴백: 기존 하드코딩된 값들
        if (step === 'thk') {
          firstQuCode = 'thk01010';
        } else if (step === 'img') {
          firstQuCode = 'img11010'; 
        } else if (step === 'tnd') {
          firstQuCode = 'tnd01010';
        } else {
          console.error('[DEBUG] 알 수 없는 단계:', step);
          firstQuCode = 'tnd01010'; // 기본값
        }
      }
      
      console.log(`[DEBUG] 첫 번째 실제 문제: ${firstQuCode} (단계: ${step})`);
      
      // 업데이트 전 현재 상태 확인
      const beforeUpdate = await prisma.$queryRaw`
        SELECT anp_seq, qu_code, anp_step, anp_done 
        FROM mwd_answer_progress 
        WHERE anp_seq = ${anp_seq}::integer
      `;
      console.log('[DEBUG] 업데이트 전 상태:', beforeUpdate);
      
      await prisma.$queryRaw`
        UPDATE mwd_answer_progress
        SET qu_code = ${firstQuCode},
            anp_done = 'I',
            anp_step = ${step}
        WHERE anp_seq = ${anp_seq}::integer
      `;
      
      // 업데이트 후 상태 확인
      const afterUpdate = await prisma.$queryRaw`
        SELECT anp_seq, qu_code, anp_step, anp_done 
        FROM mwd_answer_progress 
        WHERE anp_seq = ${anp_seq}::integer
      `;
      console.log('[DEBUG] 업데이트 후 상태:', afterUpdate);
    } else {
      // 일반 문제 진행 시에도 qu_code 유효성 재확인
      if (!qu_code || qu_code.trim() === '') {
        console.error('[DEBUG] 일반 문제 진행 중 qu_code가 비어있음:', qu_code);
        return NextResponse.json({ error: '문제 코드가 유효하지 않습니다' }, { status: 400 });
      }
      
      await prisma.$queryRaw`
        UPDATE mwd_answer_progress
        SET qu_code = ${qu_code},
            anp_done = 'I',
            anp_step = ${step}
        WHERE anp_seq = ${anp_seq}::integer
      `;
    }

    // 2.5. 단계 완료 여부 먼저 확인하고 필요시 단계 전환 처리
    const stepCompletionCheck = await prisma.$queryRaw`
      WITH current_progress_details AS (
        SELECT
            ap.anp_seq,
            ap.anp_step,
            ap.ac_gid,
            ap.cr_seq,
            cr.pd_kind
        FROM mwd_answer_progress ap
        JOIN mwd_choice_result cr ON cr.ac_gid = ap.ac_gid AND cr.cr_seq = ap.cr_seq
        WHERE ap.anp_seq = ${anp_seq}::integer
        LIMIT 1
      ),
      total_questions_for_step AS (
        SELECT
            COUNT(qu.qu_code) AS tcnt,
            cpd.anp_step AS step
        FROM mwd_question qu
        JOIN current_progress_details cpd ON qu.qu_kind1 = cpd.anp_step
        WHERE qu.qu_use = 'Y'
          AND qu.qu_qusyn = 'Y'
        GROUP BY cpd.anp_step
      ),
      answered_questions_for_step AS (
        SELECT
            COUNT(an.qu_code) AS acnt
        FROM mwd_answer an
        JOIN mwd_question qu ON qu.qu_code = an.qu_code
        JOIN current_progress_details cpd ON an.anp_seq = cpd.anp_seq AND qu.qu_kind1 = cpd.anp_step
        WHERE an.an_progress > 0
          AND an.an_ex >= 0
          AND qu.qu_use = 'Y'
          AND qu.qu_qusyn = 'Y'
      )
      SELECT
          COALESCE(tqs.tcnt, 0) AS tcnt,
          COALESCE(aqs.acnt, 0) AS acnt,
          cpd.anp_step AS step
      FROM current_progress_details cpd
      LEFT JOIN total_questions_for_step tqs ON cpd.anp_step = tqs.step
      LEFT JOIN answered_questions_for_step aqs ON 1=1
    `;

    // 단계 완료 시 즉시 다음 단계로 전환
    if (Array.isArray(stepCompletionCheck) && stepCompletionCheck.length > 0) {
      const { tcnt, acnt, step: currentStep } = stepCompletionCheck[0];
      
      if (Number(acnt) >= Number(tcnt)) {
        console.log(`🔄 [단계 전환] ${currentStep} 단계 완료됨 (${acnt}/${tcnt}), 다음 단계로 전환 시작`);
        
        try {
                     // 각 단계별 결과 계산
           if (currentStep === 'tnd') {
             await calculatePersonalityResults(anp_seq);
             
             // 사고력 진단 시작 전 안내 페이지로 전환
             await prisma.$queryRaw`
               UPDATE mwd_answer_progress 
               SET qu_code = 'thk00000', 
                   anp_done = 'I', 
                   anp_step = 'thk' 
               WHERE anp_seq = ${anp_seq}::integer
             `;
             console.log('✅ [단계 전환] 성향진단 → 사고력진단 시작 안내 페이지');
             
           } else if (currentStep === 'thk') {
             await calculateThinkingResults(anp_seq);
             
             // 선호도 진단 시작 전 안내 페이지로 전환
             await prisma.$queryRaw`
               UPDATE mwd_answer_progress 
               SET qu_code = 'img00000', 
                   anp_done = 'I', 
                   anp_step = 'img' 
               WHERE anp_seq = ${anp_seq}::integer
             `;
             console.log('✅ [단계 전환] 사고력진단 → 선호도진단 시작 안내 페이지');
            
          } else if (currentStep === 'img') {
            await calculatePreferenceResults(anp_seq);
            
            // 최종 결과 계산 (재능 점수 포함)
            try {
              await calculateFinalResults(anp_seq);
              console.log('✅ [최종 결과] 계산 완료');
            } catch (finalError) {
              console.error('❌ [최종 결과] 계산 중 오류:', finalError);
            }
            
            // 전체 테스트 완료 처리
            await prisma.$queryRaw`
              UPDATE mwd_answer_progress 
              SET anp_done = 'E', 
                  anp_end_date = NOW() 
              WHERE anp_seq = ${anp_seq}::integer
            `;
            console.log('✅ [단계 전환] 선호도진단 → 전체 완료');
          }
        } catch (error) {
          console.error(`❌ [단계 전환] ${currentStep} 처리 중 오류:`, error);
        }
      }
    }

    // 3. 현재 단계 완료 여부 확인 및 다음 질문 추출
    console.log('[DEBUG] 다음 문제 조회 시작 - anp_seq:', anp_seq);
    
    // 현재 단계 정보 확인
    const currentStepInfo = await prisma.$queryRaw`
      SELECT anp_seq, anp_step, qu_code 
      FROM mwd_answer_progress 
      WHERE anp_seq = ${anp_seq}::integer
    `;
    console.log('[DEBUG] 현재 단계 정보:', currentStepInfo);
    
    const nextQuestionResult = await prisma.$queryRaw`
      WITH progress_list AS (
          SELECT  
              ap.anp_seq, 
              qu.qu_code, 
              qu.qu_filename,
              qu.qu_order,
              ROW_NUMBER() OVER (ORDER BY co.coc_order, qu.qu_kind2, qu_order) AS progress,
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
            AND qu.qu_qusyn = 'Y'
            AND qu.qu_use = 'Y'
      ),
      plist AS (
          SELECT 
              pl.qu_code, 
              pl.qu_filename, 
              pl.qu_order,
              pl.progress, 
              pl.step
          FROM mwd_answer_progress ap, progress_list pl
          WHERE ap.anp_seq = ${anp_seq}::integer AND pl.anp_seq = ap.anp_seq AND pl.qu_code = ap.qu_code
      )
      SELECT 
          nlist.qu_filename, 
          nlist.qu_code, 
          nlist.qu_order,
          nlist.step, 
          plist.step AS prev_step,
          nlist.qu_action, 
          plist.qu_code AS prev_code, 
          plist.qu_order AS prev_order,
          nlist.qua_type, 
          nlist.pd_kind,
          nlist.progress AS next_progress,
          plist.progress AS current_progress
      FROM progress_list nlist, plist
      WHERE nlist.progress > plist.progress
      ORDER BY nlist.progress
      LIMIT 1
    `;

    let nextQuestion = null;
    let isStepCompleted = false;
    
    console.log('[DEBUG] 다음 문제 조회 결과:', nextQuestionResult);
    
    if (Array.isArray(nextQuestionResult) && nextQuestionResult.length > 0) {
      nextQuestion = nextQuestionResult[0];
      console.log('[DEBUG] 다음 문제 발견:', {
        현재_문제: nextQuestion.prev_code,
        현재_순서: nextQuestion.prev_order,
        다음_문제: nextQuestion.qu_code,
        다음_순서: nextQuestion.qu_order,
        단계: nextQuestion.step,
        진행상황: `${nextQuestion.current_progress} → ${nextQuestion.next_progress}`
      });
    } else {
      // 현재 단계에서 다음 질문이 없는 경우, 단계 완료 확인
      console.log('현재 단계에서 다음 질문이 없음. 단계 완료 여부 확인 중...');
      try {
        if (step === 'tnd') {
          await calculatePersonalityResults(anp_seq);
        } else if (step === 'thk') {
          await calculateThinkingResults(anp_seq);
        } else if (step === 'img') {
          await calculatePreferenceResults(anp_seq);
        }
      } catch (scoreError) {
        console.error(`[${step} 결과] 계산 중 오류:`, scoreError);
        // 결과 계산 실패해도 다음 단계로 진행
      }
      isStepCompleted = true;
      console.log(`✅ [${step} 완료] 단계 완료 상태로 설정 - 안내페이지 표시`);
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
      qu_template_type?: string | null;  // 템플릿 유형 추가
      qu_title?: string;  // 문제 제목 추가
      qu_passage?: string;  // 지문 추가
      qu_instruction?: string;  // 지시문 추가
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
      qu_template_type?: string | null;  // 템플릿 유형 추가
      qu_title?: string;  // 문제 제목 추가
      qu_passage?: string;  // 지문 추가
      qu_instruction?: string;  // 지시문 추가
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
              q.qu_template_type,
              q.qu_action,
              ql.qu_title,
              ql.qu_passage,
              ql.qu_instruction,
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
            q.qu_template_type,
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
            q.qu_template_type,
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
            q.qu_template_type,
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
            q.qu_template_type,
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
            q.qu_template_type,
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
            q.qu_template_type,
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
            qu_template_type: row.qu_template_type,
            qu_title: row.qu_title,
            qu_passage: row.qu_passage,
            qu_instruction: row.qu_instruction,
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

    // cr_seq 조회 (전체 검사 완료 시 결과 페이지 이동을 위함)
    let crSeq = null;
    if (isStepCompleted && step === 'img') {
      const crSeqResult = await prisma.$queryRaw`
        SELECT cr_seq 
        FROM mwd_answer_progress 
        WHERE anp_seq = ${anp_seq}::integer
        LIMIT 1
      `;
      
      if (Array.isArray(crSeqResult) && crSeqResult.length > 0) {
        crSeq = crSeqResult[0].cr_seq;
        console.log('✅ [전체검사 완료] cr_seq 조회:', crSeq);
      }
    }

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
      total_questions: Array.isArray(progressResult) && progressResult.length > 0 ? progressResult[0].tcnt : 0,
      // 전체 검사 완료 시 cr_seq 추가
      cr_seq: crSeq
    });

    // 중복 처리 로직 제거됨 (위에서 이미 단계 전환 처리 완료)

    console.log('답변 저장 완료');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('답변 저장 API 오류:', error);
    console.error('오류 스택:', error instanceof Error ? error.stack : 'Stack not available');
    console.error('요청 데이터:', requestData);
    
    return NextResponse.json(
      { 
        error: '답변을 저장하는 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 