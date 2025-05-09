import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../../lib/db/index';
import { authOptions } from '../../../../../lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 로그인 세션 확인
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // params를 비동기적으로 처리
    const testId = parseInt(params.id, 10);

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

    // 3. 다음 질문 추출
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
            AND (CASE WHEN cr.pd_kind = 'basic' THEN qu.qu_kind1 != 'thk' ELSE TRUE END)
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
    if (Array.isArray(nextQuestionResult) && nextQuestionResult.length > 0) {
      nextQuestion = nextQuestionResult[0];
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
          -- pd_kind에 따른 필터링
          AND (CASE WHEN cpd.pd_kind = 'basic' THEN qu.qu_kind1 != 'thk' ELSE TRUE END)
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
          AND (CASE WHEN cpd.pd_kind = 'basic' THEN qu.qu_kind1 != 'thk' ELSE TRUE END)
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
      qu_text: string;
      qu_category: string;
      qu_action: string;
      an_val: number;
      an_text: string;
      an_desc: string | null;
      an_sub: string | null;
      an_wei: number;
    }

    interface Question {
      qu_code: string;
      qu_filename: string;
      qu_order: number;
      qu_text: string;
      qu_category: string;
      qu_action: string;
      choices: Array<{
        an_val: number;
        an_text: string;
        an_desc: string | null;
        an_sub: string | null;
        an_wei: number;
      }>;
    }

    const questions: Question[] = [];
    
    if (questionFilename) {
      const questionsWithChoices = await prisma.$queryRaw`
        SELECT
          q.qu_code,
          q.qu_filename,
          q.qu_order,
          q.qu_text,
          q.qu_category,
          q.qu_action,
          qc.an_val,
          qc.an_text,
          qc.an_desc,
          qc.an_sub,
          qc.an_wei
        FROM
          mwd_question q
        JOIN
          mwd_question_choice qc ON q.qu_code = qc.qu_code
        WHERE
          q.qu_filename = ${questionFilename}
          AND q.qu_use = 'Y'
          AND qc.an_use = 'Y'
        ORDER BY
          q.qu_order ASC,
          qc.an_val ASC
      `;

      // 문항과 선택지를 문항별로 그룹화
      const questionMap = new Map<string, Question>();

      if (Array.isArray(questionsWithChoices) && questionsWithChoices.length > 0) {
        (questionsWithChoices as QuestionChoice[]).forEach(row => {
          if (!questionMap.has(row.qu_code)) {
            questionMap.set(row.qu_code, {
              qu_code: row.qu_code,
              qu_filename: row.qu_filename,
              qu_order: row.qu_order,
              qu_text: row.qu_text,
              qu_category: row.qu_category,
              qu_action: row.qu_action,
              choices: []
            });
            questions.push(questionMap.get(row.qu_code)!);
          }
          
          questionMap.get(row.qu_code)!.choices.push({
            an_val: row.an_val,
            an_text: row.an_text,
            an_desc: row.an_desc,
            an_sub: row.an_sub,
            an_wei: row.an_wei
          });
        });
      }
    }

    // 완료 상태 확인
    const isCompleted = !nextQuestion;
    if (isCompleted) {
      // 모든 문항 완료 시 상태 업데이트
      await prisma.$queryRaw`
        UPDATE mwd_answer_progress
        SET anp_done = 'E',
            anp_end_date = NOW()
        WHERE anp_seq = ${anp_seq}::integer
      `;
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
      nextQuestion,
      progress: Array.isArray(progressResult) && progressResult.length > 0 ? progressResult[0] : null,
      questions,
      // 현재 페이지와 총 문항 수 정보 추가
      completed_pages: Array.isArray(progressResult) && progressResult.length > 0 ? progressResult[0].acnt : 0,
      total_questions: Array.isArray(progressResult) && progressResult.length > 0 ? progressResult[0].tcnt : 0
    });

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