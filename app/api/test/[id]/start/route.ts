import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../../lib/db';
import { authOptions } from '../../../../../lib/auth';

export async function GET(
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

    const userId = session.user.id;
    // params를 비동기적으로 처리
    const resolvedParams = await params;
    const testId = parseInt(resolvedParams.id, 10);

    if (isNaN(testId)) {
      return NextResponse.json({ error: '유효하지 않은 테스트 ID입니다' }, { status: 400 });
    }

    // console.log(`테스트 시작 API 호출 - 테스트 ID: ${testId}, 사용자: ${userId}, 언어: ${language}`);

    // 1. 선택 결과 조회
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
    `;

    if (!Array.isArray(accountStatusResult) || accountStatusResult.length === 0) {
      return NextResponse.json({ error: '테스트 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    const accountStatus = accountStatusResult[0];
    
    // 2. 진행 중인 anp_seq 조회
    const anpSeqResult = await prisma.$queryRaw`
      SELECT COALESCE(ap.anp_seq, 0) AS anp_seq
      FROM mwd_account ac
      JOIN mwd_answer_progress ap ON ac.ac_gid = ap.ac_gid
      WHERE ac.ac_use = 'Y' 
        AND ac.ac_expire_date >= now()
        AND ac.ac_gid = ${userId}::uuid
        AND anp_done IN ('R', 'I')
    `;

    let anpSeq;
    
    // 기존에 진행 중인 테스트가 없다면 새로 생성
    if (!Array.isArray(anpSeqResult) || anpSeqResult.length === 0) {
      // 먼저 첫 번째 실제 문항 조회
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
      `;

      let firstQuCode = 'tnd00000';
      if (Array.isArray(firstQuestionResult) && firstQuestionResult.length > 0) {
        firstQuCode = firstQuestionResult[0].qu_code;
        console.log('[새 테스트 생성] 첫 번째 실제 문항 코드:', firstQuCode);
      }

      // 새 answer_progress 생성 (실제 첫 번째 문항 코드 사용)
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
      `;

      if (!Array.isArray(newProgressResult) || newProgressResult.length === 0) {
        return NextResponse.json({ error: '테스트 진행 정보를 생성할 수 없습니다' }, { status: 500 });
      }

      anpSeq = newProgressResult[0].anp_seq;
    } else {
      anpSeq = anpSeqResult[0].anp_seq;
    }

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
    `;

    // console.log('다음 질문 조회 결과:', JSON.stringify(nextQuestionResult, null, 2));

    let nextQuestion = null;
    if (Array.isArray(nextQuestionResult) && nextQuestionResult.length > 0) {
      nextQuestion = nextQuestionResult[0];
          } else {
      // 다음 질문이 없을 경우 현재 단계의 첫 번째 실제 문항을 가져오기
      console.log('[문항조회] 다음 질문이 없어 현재 단계의 첫 번째 문항을 조회합니다');
      
      // 현재 진행 단계 확인
      const currentStepResult = await prisma.$queryRaw`
        SELECT anp_step, qu_code, anp_done
        FROM mwd_answer_progress
        WHERE anp_seq = ${anpSeq}
      `;
      
      let currentStep = 'tnd';
      if (Array.isArray(currentStepResult) && currentStepResult.length > 0) {
        const progress = currentStepResult[0];
        currentStep = progress.anp_step || 'tnd';
        console.log('[문항조회] 현재 진행 상태:', {
          anp_step: progress.anp_step,
          qu_code: progress.qu_code,
          anp_done: progress.anp_done
        });
      }
      
      // 먼저 현재 진행 중인 qu_code의 qu_filename을 조회
      let currentQuFilename = null;
      if (Array.isArray(currentStepResult) && currentStepResult.length > 0) {
        const currentQuCode = currentStepResult[0].qu_code;
        if (currentQuCode) {
          const currentQuResult = await prisma.$queryRaw`
            SELECT qu_filename 
            FROM mwd_question 
            WHERE qu_code = ${currentQuCode} AND qu_use = 'Y'
          `;
          
          if (Array.isArray(currentQuResult) && currentQuResult.length > 0) {
            currentQuFilename = currentQuResult[0].qu_filename;
            console.log('[문항조회] 현재 진행 중인 문항의 qu_filename:', currentQuFilename);
          }
        }
      }
      
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
          AND qu.qu_kind1 = ${currentStep}
          AND qu.qu_filename NOT LIKE '%Index%'
          AND qu.qu_filename NOT LIKE '%index%'
          AND (CASE WHEN cr.pd_kind = 'basic' AND ${currentStep} = 'thk' THEN FALSE ELSE TRUE END)
        ORDER BY qu.qu_code
        LIMIT 1
      `;
      
      if (Array.isArray(firstQuestionResult) && firstQuestionResult.length > 0) {
        nextQuestion = firstQuestionResult[0];
        console.log('[문항조회] 첫 번째 문항 조회 결과:', nextQuestion);
      }
      
      // 현재 진행 중인 qu_filename이 있으면 우선 사용
      if (currentQuFilename) {
        if (!nextQuestion) {
          // nextQuestion이 없으면 새로 생성
          nextQuestion = {
            qu_filename: currentQuFilename,
            qu_code: currentQuFilename,
            step: currentStep,
            prev_step: "",
            qu_action: "/test/savestep",
            prev_code: "",
            qua_type: "-",
            pd_kind: accountStatus.pd_kind || "basic"
          };
        } else {
          // nextQuestion이 있으면 qu_filename만 업데이트
          nextQuestion.qu_filename = currentQuFilename;
        }
        console.log('[문항조회] 현재 진행 중인 qu_filename으로 설정:', currentQuFilename);
      }
    }

    // 기본값 설정 (문항을 찾지 못한 경우)
    if (!nextQuestion) {
      console.log('[문항조회] 문항을 찾지 못해 기본값을 설정합니다');
      
      // 현재 진행 상태 재확인
      const currentStepCheckResult = await prisma.$queryRaw`
        SELECT anp_step, qu_code, anp_done
        FROM mwd_answer_progress
        WHERE anp_seq = ${anpSeq}
      `;
      
      let defaultQuFilename = 'tnd00001';
      let defaultQuCode = 'tnd00001';
      let defaultStep = 'tnd';
      
      if (Array.isArray(currentStepCheckResult) && currentStepCheckResult.length > 0) {
        const currentQuCode = currentStepCheckResult[0].qu_code;
        defaultStep = currentStepCheckResult[0].anp_step || 'tnd';
        
        // 현재 qu_code가 더미 코드(00000)인 경우 실제 첫 번째 문항으로 업데이트
        if (currentQuCode && currentQuCode.includes('00000')) {
          console.log('[문항조회] 더미 qu_code 감지, 실제 첫 번째 문항을 찾습니다:', currentQuCode);
          
          const realFirstQuestionResult = await prisma.$queryRaw`
            SELECT qu.qu_code, qu.qu_filename
            FROM mwd_question qu
            JOIN mwd_question_lang ql ON qu.qu_code = ql.qu_code
            WHERE qu.qu_kind1 = ${defaultStep}
              AND qu.qu_use = 'Y'
              AND ql.lang_code = ${language}
              AND qu.qu_filename NOT LIKE '%Index%'
              AND qu.qu_filename NOT LIKE '%index%'
              AND qu.qu_filename NOT LIKE '%00000%'
            ORDER BY qu.qu_code
            LIMIT 1
          `;
          
          if (Array.isArray(realFirstQuestionResult) && realFirstQuestionResult.length > 0) {
            defaultQuCode = realFirstQuestionResult[0].qu_code;
            defaultQuFilename = realFirstQuestionResult[0].qu_filename;
            
            // mwd_answer_progress 테이블 업데이트
            await prisma.$queryRaw`
              UPDATE mwd_answer_progress 
              SET qu_code = ${defaultQuCode}
              WHERE anp_seq = ${anpSeq}
            `;
            
            console.log('[문항조회] 더미 qu_code를 실제 문항으로 업데이트:', {
              old: currentQuCode,
              new: defaultQuCode,
              filename: defaultQuFilename
            });
          }
        } else if (currentQuCode) {
          // 현재 qu_code의 qu_filename 조회
          const currentQuResult = await prisma.$queryRaw`
            SELECT qu_filename 
            FROM mwd_question 
            WHERE qu_code = ${currentQuCode} AND qu_use = 'Y'
          `;
          
          if (Array.isArray(currentQuResult) && currentQuResult.length > 0) {
            defaultQuFilename = currentQuResult[0].qu_filename;
            defaultQuCode = currentQuCode;
            console.log('[문항조회] 기본값에 현재 qu_code의 qu_filename 사용:', defaultQuFilename);
          }
        }
      }
      
      nextQuestion = {
        qu_filename: defaultQuFilename,
        qu_code: defaultQuCode,
        step: defaultStep,
        prev_step: "",
        qu_action: "/test/savestep",
        prev_code: "",
        qua_type: "-",
        pd_kind: accountStatus.pd_kind || "basic"
      };
      
      console.log('[문항조회] 기본값으로 설정된 nextQuestion:', nextQuestion);
    }

    // 4. 현재 페이지에 표시할 문항과 답변 선택지 조회
    let questionFilename = nextQuestion.qu_filename;
    console.log('[문항조회] 조회할 문항 파일명:', questionFilename);

    // 다국어 테이블이 존재하는지 확인하고, 없으면 기존 방식 사용
    let questionsWithChoices;
    try {
      // 먼저 다국어 테이블을 사용한 쿼리 시도
      // 사고력 진단의 경우 같은 파일명으로 문제를 그룹핑하여 조회
      if (nextQuestion.step === 'thk') {
        questionsWithChoices = await prisma.$queryRaw`
            SELECT
              q.qu_code,
              q.qu_filename,
              q.qu_order,
              ql.qu_text,
              ql.qu_category,
              q.qu_action,
              qc.display_order as an_val,
              COALESCE(qcl.choice_text, 
                CASE 
                  WHEN qc.display_order = 1 THEN '①'
                  WHEN qc.display_order = 2 THEN '②'
                  WHEN qc.display_order = 3 THEN '③'
                  WHEN qc.display_order = 4 THEN '④'
                  WHEN qc.display_order = 5 THEN '⑤'
                  ELSE CONCAT('선택지 ', qc.display_order::text)
                END
              ) as an_text,
              null as an_desc,
              null as an_sub,
              qc.weight as an_wei,
              COALESCE(qcl.choice_image_path, null) as choice_image_path,
              null as qu_image
            FROM
              mwd_question q
            JOIN
              mwd_question_lang ql ON q.qu_code = ql.qu_code
            JOIN
              mwd_question_choice qc ON q.qu_code = qc.qu_code
            LEFT JOIN
              mwd_question_choice_lang qcl ON qc.choice_id = qcl.choice_id AND qcl.lang_code = ${language}
            WHERE
              q.qu_filename = ${questionFilename}
              AND q.qu_use = 'Y'
              AND ql.lang_code = ${language}
            ORDER BY
              q.qu_code ASC,
              qc.display_order ASC
        `;
      } else {
        // 성향진단 등 다른 단계는 기존 로직 유지
        questionsWithChoices = await prisma.$queryRaw`
            SELECT
              q.qu_code,
              q.qu_filename,
              q.qu_order,
              ql.qu_text,
              ql.qu_category,
              q.qu_action,
              qc.display_order as an_val,
              CASE 
                WHEN qc.display_order = 1 THEN '매우 그렇다'
                WHEN qc.display_order = 2 THEN '그렇다'
                WHEN qc.display_order = 3 THEN '약간 그렇다'
                WHEN qc.display_order = 4 THEN '별로 그렇지 않다'
                WHEN qc.display_order = 5 THEN '그렇지 않다'
                WHEN qc.display_order = 6 THEN '전혀 그렇지 않다'
                ELSE '선택지'
              END as an_text,
              null as an_desc,
              null as an_sub,
              qc.weight as an_wei,
              null as choice_image_path,
              null as qu_image
            FROM
              mwd_question q
            JOIN
              mwd_question_lang ql ON q.qu_code = ql.qu_code
            JOIN
              mwd_question_choice qc ON q.qu_code = qc.qu_code
            WHERE
              q.qu_filename = ${questionFilename}
              AND q.qu_use = 'Y'
              AND ql.lang_code = ${language}
            ORDER BY
              q.qu_code ASC,
              qc.display_order ASC
        `;
      }
      
      // 결과가 없으면 단계별로 문항 조회
      if (!Array.isArray(questionsWithChoices) || questionsWithChoices.length === 0) {
        console.log('[문항조회] 파일명으로 문항을 찾지 못했습니다. 단계별로 조회합니다.');
        // 현재 진행 중인 단계 확인
        const currentStepResult = await prisma.$queryRaw`
          SELECT anp_step, qu_code
          FROM mwd_answer_progress
          WHERE anp_seq = ${anpSeq}
        `;
        
        const currentStep = Array.isArray(currentStepResult) && currentStepResult.length > 0 
          ? currentStepResult[0].anp_step 
          : nextQuestion.step;
          
        console.log('[문항조회] 현재 진행 단계:', currentStep, '다음 문항 단계:', nextQuestion.step);
        
        // nextQuestion의 step도 현재 단계로 업데이트
        if (currentStep !== nextQuestion.step) {
          console.log(`[문항조회] nextQuestion.step을 ${nextQuestion.step}에서 ${currentStep}으로 업데이트`);
          nextQuestion.step = currentStep;
          nextQuestion.qu_code = `${currentStep}00000`;
          nextQuestion.qu_filename = `${currentStep}00000`;
        }
        
        // Index 파일이거나 문항이 없으면 첫 번째 실제 문항 파일명 찾기
        if (questionFilename.includes('Index') || questionFilename.includes('index') || questionFilename.includes('00000')) {
          console.log('[문항조회] Index 파일명이므로 첫 번째 실제 문항을 찾습니다.');
          
          const firstRealQuestionResult = await prisma.$queryRaw`
            SELECT DISTINCT q.qu_filename
            FROM mwd_question q
            JOIN mwd_question_lang ql ON q.qu_code = ql.qu_code
            WHERE q.qu_kind1 = ${currentStep}
              AND q.qu_use = 'Y'
              AND ql.lang_code = ${language}
              AND q.qu_filename NOT LIKE '%Index%'
              AND q.qu_filename NOT LIKE '%index%'
              AND q.qu_filename NOT LIKE '%00000%'
            ORDER BY q.qu_filename
            LIMIT 1
          `;
          
          if (Array.isArray(firstRealQuestionResult) && firstRealQuestionResult.length > 0) {
            const realQuFilename = firstRealQuestionResult[0].qu_filename;
            console.log('[문항조회] 첫 번째 실제 문항 파일명:', realQuFilename);
            
            // nextQuestion과 questionFilename 업데이트
            nextQuestion.qu_filename = realQuFilename;
            nextQuestion.qu_code = realQuFilename;
            questionFilename = realQuFilename;
            
            // mwd_answer_progress 테이블도 업데이트
            await prisma.$queryRaw`
              UPDATE mwd_answer_progress 
              SET qu_code = ${realQuFilename}
              WHERE anp_seq = ${anpSeq}
            `;
            console.log('[문항조회] mwd_answer_progress 테이블 업데이트 완료:', realQuFilename);
          }
        }
        
        // 사고력 진단의 경우 같은 파일명의 문제들을 그룹핑하여 조회
        if (currentStep === 'thk') {
          questionsWithChoices = await prisma.$queryRaw`
            SELECT
              q.qu_code,
              q.qu_filename,
              q.qu_order,
              ql.qu_text,
              ql.qu_category,
              q.qu_action,
              qc.display_order as an_val,
              COALESCE(qcl.choice_text, 
                CASE 
                  WHEN qc.display_order = 1 THEN '①'
                  WHEN qc.display_order = 2 THEN '②'
                  WHEN qc.display_order = 3 THEN '③'
                  WHEN qc.display_order = 4 THEN '④'
                  WHEN qc.display_order = 5 THEN '⑤'
                  ELSE CONCAT('선택지 ', qc.display_order::text)
                END
              ) as an_text,
              null as an_desc,
              null as an_sub,
              qc.weight as an_wei,
              qcl.choice_image_path,
              null as qu_image
            FROM
              mwd_question q
            JOIN
              mwd_question_lang ql ON q.qu_code = ql.qu_code
            JOIN
              mwd_question_choice qc ON q.qu_code = qc.qu_code
            LEFT JOIN
              mwd_question_choice_lang qcl ON qc.choice_id = qcl.choice_id AND qcl.lang_code = ${language}
            WHERE
              q.qu_filename = ${questionFilename}
              AND q.qu_use = 'Y'
              AND ql.lang_code = ${language}
            ORDER BY
              q.qu_code ASC,
              qc.display_order ASC
          `;
        } else {
          // 성향진단 등 다른 단계는 특정 파일명의 문제만 조회
          questionsWithChoices = await prisma.$queryRaw`
            SELECT
              q.qu_code,
              q.qu_filename,
              q.qu_order,
              ql.qu_text,
              ql.qu_category,
              q.qu_action,
              qc.display_order as an_val,
              COALESCE(qcl.choice_text, 
                CASE 
                  WHEN ${currentStep} = 'tnd' THEN
                    CASE 
                      WHEN qc.display_order = 1 THEN '매우 그렇다'
                      WHEN qc.display_order = 2 THEN '그렇다'
                      WHEN qc.display_order = 3 THEN '약간 그렇다'
                      WHEN qc.display_order = 4 THEN '별로 그렇지 않다'
                      WHEN qc.display_order = 5 THEN '그렇지 않다'
                      WHEN qc.display_order = 6 THEN '전혀 그렇지 않다'
                      ELSE '선택지'
                    END
                  ELSE 
                    CASE 
                      WHEN qc.display_order = 1 THEN '선택 1'
                      WHEN qc.display_order = 2 THEN '선택 2'
                      WHEN qc.display_order = 3 THEN '선택 3'
                      WHEN qc.display_order = 4 THEN '선택 4'
                      WHEN qc.display_order = 5 THEN '선택 5'
                      ELSE CONCAT('선택 ', qc.display_order::text)
                    END
                END
              ) as an_text,
              null as an_desc,
              null as an_sub,
              qc.weight as an_wei,
              qcl.choice_image_path,
              null as qu_image
            FROM
              mwd_question q
            JOIN
              mwd_question_lang ql ON q.qu_code = ql.qu_code
            JOIN
              mwd_question_choice qc ON q.qu_code = qc.qu_code
            LEFT JOIN
              mwd_question_choice_lang qcl ON qc.choice_id = qcl.choice_id AND qcl.lang_code = ${language}
            WHERE
              q.qu_filename = ${questionFilename}
              AND q.qu_use = 'Y'
              AND ql.lang_code = ${language}
            ORDER BY
              q.qu_code ASC,
              qc.display_order ASC
          `;
        }
      }
    } catch (error) {
      console.error('다국어 테이블 조회 실패, 기존 방식으로 전환:', error);
      
      // 기존 방식으로 문항 조회
      questionsWithChoices = await prisma.$queryRaw`
        SELECT
          q.qu_code,
          q.qu_filename,
          q.qu_order,
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
        WHERE q.qu_kind1 = ${nextQuestion.step}
          AND q.qu_use = 'Y'
          AND q.qu_filename NOT LIKE '%Index%'
          AND q.qu_filename NOT LIKE '%index%'
        
        UNION ALL
        
        SELECT
          q.qu_code,
          q.qu_filename,
          q.qu_order,
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
        WHERE q.qu_kind1 = ${nextQuestion.step}
          AND q.qu_use = 'Y'
          AND q.qu_filename NOT LIKE '%Index%'
          AND q.qu_filename NOT LIKE '%index%'
        
        UNION ALL
        
        SELECT
          q.qu_code,
          q.qu_filename,
          q.qu_order,
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
        WHERE q.qu_kind1 = ${nextQuestion.step}
          AND q.qu_use = 'Y'
          AND q.qu_filename NOT LIKE '%Index%'
          AND q.qu_filename NOT LIKE '%index%'
        
        UNION ALL
        
        SELECT
          q.qu_code,
          q.qu_filename,
          q.qu_order,
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
        WHERE q.qu_kind1 = ${nextQuestion.step}
          AND q.qu_use = 'Y'
          AND q.qu_filename NOT LIKE '%Index%'
          AND q.qu_filename NOT LIKE '%index%'
        
        UNION ALL
        
        SELECT
          q.qu_code,
          q.qu_filename,
          q.qu_order,
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
        WHERE q.qu_kind1 = ${nextQuestion.step}
          AND q.qu_use = 'Y'
          AND q.qu_filename NOT LIKE '%Index%'
          AND q.qu_filename NOT LIKE '%index%'
        
        UNION ALL
        
        SELECT
          q.qu_code,
          q.qu_filename,
          q.qu_order,
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
        WHERE q.qu_kind1 = ${nextQuestion.step}
          AND q.qu_use = 'Y'
          AND q.qu_filename NOT LIKE '%Index%'
          AND q.qu_filename NOT LIKE '%index%'
        
        ORDER BY qu_order ASC, an_val ASC
        LIMIT 60
      `;
    }

    console.log('[문항조회] 문항 조회 결과 개수:', Array.isArray(questionsWithChoices) ? questionsWithChoices.length : 0);
    if (Array.isArray(questionsWithChoices) && questionsWithChoices.length > 0) {
      console.log('[문항조회] 문항 조회 결과 샘플:', questionsWithChoices.slice(0, 1));
    } else {
      console.log('[문항조회] 문항 조회 결과: 데이터 없음');
    }

    // 문항과 선택지를 문항별로 그룹화
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
      choice_image_path?: string;
      qu_image?: string;
    }

    interface Question {
      qu_code: string;
      qu_filename: string;
      qu_order: number;
      qu_text: string;
      qu_category: string;
      qu_action: string;
      qu_image?: string;
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
            qu_image: row.qu_image,
            qu_images: row.qu_image ? [row.qu_image] : [],
            choices: []
          });
          questions.push(questionMap.get(row.qu_code)!);
        }
        
        const question = questionMap.get(row.qu_code)!;
        
        // 이미지가 있고 이미 추가되지 않은 경우 추가
        if (row.qu_image && !question.qu_images?.includes(row.qu_image)) {
          question.qu_images = question.qu_images || [];
          question.qu_images.push(row.qu_image);
        }
        
        question.choices.push({
          an_val: row.an_val,
          an_text: row.an_text,
          an_desc: row.an_desc,
          an_sub: row.an_sub,
          an_wei: row.an_wei,
          choice_image_path: row.choice_image_path
        });
      });
    }

    // 현재 단계의 진행률 정보만 조회
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
    `;

    // 진행률 정보 추출
    let completedPages = 0;
    let totalQuestions = 0;
    let currentStep = nextQuestion?.step || 'tnd';
    
    if (Array.isArray(progressInfoResult) && progressInfoResult.length > 0) {
      const progressInfo = progressInfoResult[0];
      completedPages = Number(progressInfo.acnt) || 0;
      totalQuestions = Number(progressInfo.tcnt) || 0;
      currentStep = progressInfo.step || currentStep;
    }

    // console.log(`진행률 정보: ${completedPages}/${totalQuestions} (${currentStep} 단계)`);

    // 단계 검증 및 수정: 성향 진단이 완료되지 않았는데 다른 단계에 있는 경우 수정
    if (currentStep !== 'tnd') {
      // 성향 진단 완료 여부 확인
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
      `;

      if (Array.isArray(tndProgressResult) && tndProgressResult.length > 0) {
        const tndProgress = tndProgressResult[0];
        const tndCompleted = Number(tndProgress.tnd_completed) || 0;
        const tndTotal = Number(tndProgress.tnd_total) || 0;
        
        // console.log(`성향 진단 진행 상황: ${tndCompleted}/${tndTotal}`);
        
        // 성향 진단이 완료되지 않았는데 다른 단계에 있는 경우 성향 진단으로 되돌리기
        if (tndCompleted < tndTotal) {
          console.log('[문항조회] 성향 진단이 완료되지 않아 tnd 단계로 되돌립니다');
          
          await prisma.$queryRaw`
            UPDATE mwd_answer_progress 
            SET qu_code = 'tnd00000', 
                anp_step = 'tnd' 
            WHERE anp_seq = ${anpSeq}::integer
          `;
          
          // 다시 성향 진단 문항 조회
          nextQuestion = {
            ...nextQuestion,
            step: 'tnd',
            qu_code: 'tnd00000'
          };
          
          // 진행률 정보도 성향 진단으로 업데이트
          completedPages = tndCompleted;
          totalQuestions = tndTotal;
          currentStep = 'tnd';
          
          console.log('[문항조회] 성향 진단 단계로 복원 완료');
        }
      }
    }

    // 응답 데이터 구성
    const responseData = {
      anp_seq: anpSeq,
      pd_kind: accountStatus.pd_kind || "basic",
      ...nextQuestion,
      questions: questions,
      completed_pages: completedPages,
      total_questions: totalQuestions,
      current_number: completedPages + 1,
      // 디버깅 정보 추가
      debug_info: {
        nextQuestion_original: nextQuestionResult,
        questions_count: questions.length,
        current_step: currentStep,
        anp_seq: anpSeq
      }
    };

    console.log('[문항조회] 최종 응답 데이터:', {
      step: responseData.step,
      questions_count: responseData.questions.length,
      qu_filename: responseData.qu_filename,
      completed_pages: responseData.completed_pages,
      total_questions: responseData.total_questions
    });
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('테스트 시작 API 오류:', error);
    return NextResponse.json(
      { error: '테스트 정보를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 