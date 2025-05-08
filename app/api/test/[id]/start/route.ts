import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '../../../../../lib/db';
import { authOptions } from '../../../../../lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 로그인 세션 확인
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const userId = session.user.id;
    const testId = parseInt(params.id, 10);

    if (isNaN(testId)) {
      return NextResponse.json({ error: '유효하지 않은 테스트 ID입니다' }, { status: 400 });
    }

    console.log(`테스트 시작 API 호출 - 테스트 ID: ${testId}, 사용자: ${userId}`);

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
      // 새 answer_progress 생성
      const newProgressResult = await prisma.$queryRaw`
        INSERT INTO mwd_answer_progress (
            anp_seq, qu_code, anp_step, anp_start_date, anp_done, ac_gid, cr_seq
        )
        SELECT 
            NEXTVAL('anp_seq'),
            CASE WHEN t.pd_kind = 'basic' THEN 'tnd00000' ELSE 'thk00000' END,
            CASE WHEN t.pd_kind = 'basic' THEN 'tnd' ELSE 'thk' END,
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
            AND (CASE WHEN cr.pd_kind = 'basic' THEN qu.qu_kind1 != 'thk' ELSE TRUE END)
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

    console.log('다음 질문 조회 결과:', JSON.stringify(nextQuestionResult, null, 2));

    let nextQuestion = null;
    if (Array.isArray(nextQuestionResult) && nextQuestionResult.length > 0) {
      nextQuestion = nextQuestionResult[0];
    } else {
      // 다음 질문이 없을 경우 기본 값 사용 (디버깅용)
      console.log('다음 질문이 없어 기본 값을 사용합니다');
      nextQuestion = {
        qu_filename: "ftd11020",
        qu_code: "tnd00001",
        step: "tnd",
        prev_step: "",
        qu_action: "/test/savestep",
        prev_code: "",
        qua_type: "-",
        pd_kind: accountStatus.pd_kind || "basic"
      };
    }

    // 4. 현재 페이지에 표시할 문항과 답변 선택지 조회
    const questionFilename = nextQuestion.qu_filename;
    console.log('조회할 문항 파일명:', questionFilename);

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

    console.log('문항 및 선택지 조회 결과:', JSON.stringify(questionsWithChoices, null, 2));

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

    // 응답 데이터 구성
    const responseData = {
      anp_seq: anpSeq,
      pd_kind: accountStatus.pd_kind || "basic",
      ...nextQuestion,
      questions: questions
    };

    console.log('최종 응답 데이터:', JSON.stringify(responseData, null, 2));
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('테스트 시작 API 오류:', error);
    return NextResponse.json(
      { error: '테스트 정보를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 