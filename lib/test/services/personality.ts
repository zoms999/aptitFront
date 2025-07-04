import prisma from '../../db';
import { TestResponse, TestContext } from '../types';
import { getNextQuestion, getCurrentQuFilename, updateDummyQuestionCode } from '../queries/common';
import { 
  getPersonalityQuestionsWithLang, 
  getPersonalityQuestionsFallback, 
  getAllPersonalityQuestions 
} from '../queries/personality';
import { getProgressInfo, getCrSeq } from '../utils';

/**
 * 성향진단 테스트 처리
 */
export async function handlePersonalityTest(context: TestContext): Promise<TestResponse> {
  console.log(`\n=== 성향진단 테스트 처리 시작 ===`);
  console.log(`사용자 ID: ${context.userId}, anp_seq: ${context.anpSeq}, 언어: ${context.language}`);
  
  // 1. 다음 질문 정보 조회
  const nextQuestion = await getNextQuestion(context.anpSeq);
  console.log('[성향진단] 다음 질문 정보:', nextQuestion);

  // 2. 현재 진행 중인 qu_filename 조회
  let questionFilename = await getCurrentQuFilename(context.anpSeq);
  console.log(`[성향진단] 현재 qu_filename: ${questionFilename}`);

  // 3. 더미 코드 처리 (tnd00000 등)
  if (questionFilename && questionFilename.includes('00000')) {
    console.log(`[성향진단] 더미 코드 감지: ${questionFilename}, 실제 첫 번째 문항으로 업데이트 필요`);
    const updateResult = await updateDummyQuestionCode(context.anpSeq, 'tnd', context.language);
    if (updateResult) {
      questionFilename = updateResult.quFilename;
      console.log(`[성향진단] 더미 코드 업데이트 완료: ${questionFilename}`);
    }
  }

  // 4. 문항 조회 (3단계 Fallback)
  let questions;
  
  if (questionFilename) {
    // 1단계: 다국어 테이블 포함한 정상 쿼리
    console.log(`[성향진단 1단계] 다국어 테이블 포함 조회 시도 - ${questionFilename}`);
    questions = await getPersonalityQuestionsWithLang(questionFilename, context.language);
    
    if (!questions || questions.length === 0) {
      // 2단계: 기본 테이블만 사용
      console.log(`[성향진단 2단계] 기본 테이블만 사용한 Fallback - ${questionFilename}`);
      questions = await getPersonalityQuestionsFallback(questionFilename);
    }
  }
  
  if (!questions || questions.length === 0) {
    // 3단계: 성향진단 단계의 모든 문항 조회
    console.log(`[성향진단 3단계] 최종 Fallback - 성향진단 단계의 모든 문항 조회`);
    questions = await getAllPersonalityQuestions();
  }

  // 5. 진행률 정보 조회
  const progressInfo = await getProgressInfo(context.anpSeq);
  console.log(`[성향진단] 진행률 정보:`, progressInfo);

  // 6. cr_seq 조회
  const crSeq = await getCrSeq(context.anpSeq);
  console.log(`[성향진단] cr_seq: ${crSeq}`);

  // 7. 타이머 통계
  const timerQuestions = questions.filter(q => q.qu_time_limit_sec && q.qu_time_limit_sec > 0);
  const noTimerQuestions = questions.filter(q => !q.qu_time_limit_sec || q.qu_time_limit_sec === 0);
  
  console.log(`[성향진단] 총 ${questions.length}개 문항 중 타이머 ${timerQuestions.length}개, 타이머 없음 ${noTimerQuestions.length}개`);

  // 8. 응답 구성
  const response: TestResponse = {
    anp_seq: context.anpSeq,
    cr_seq: crSeq || undefined,
    pd_kind: context.accountStatus.pd_kind,
    qu_filename: questionFilename || '',
    qu_code: nextQuestion?.qu_code || '',
    step: 'tnd',
    prev_step: nextQuestion?.prev_step || '',
    qu_action: nextQuestion?.qu_action || '/test/savestep',
    prev_code: nextQuestion?.prev_code || '',
    qua_type: nextQuestion?.qua_type || '-',
    questions: questions,
    completed_pages: progressInfo.completed,
    total_questions: progressInfo.total || questions.length,
    current_number: progressInfo.completed + 1,
    debug_info: {
      nextQuestion_original: nextQuestion ? [nextQuestion] : null,
      questions_count: questions.length,
      current_step: 'tnd',
      anp_seq: context.anpSeq
    }
  };

  console.log(`[성향진단] 응답 준비 완료: ${questions.length}개 문항`);
  return response;
} 
interface TendencyResult {
  tnd1: string;
  tnd2: string;
}

interface TendencyRank {
  rank: number;
  tendency_name: string;
}

interface TendencyExplain {
  rank: number;
  tendency_name: string;
  explanation: string;
}

/**
 * 성향진단 결과 데이터 조회
 */
export async function getPersonalityAnalysisResult(anp_seq: number) {
  console.log(`[getPersonalityAnalysisResult] 성향진단 결과 조회 시작: anp_seq=${anp_seq}`);

  try {
    // 1. 주 성향 및 부 성향 조회
    console.log(`[getPersonalityAnalysisResult] Step 1: 주/부 성향 조회 중...`);
    const tendencyResult = await prisma.$queryRaw<TendencyResult[]>`
      select max(case when rk = 1 then tnd end) as tnd1, max(case when rk = 2 then tnd end) as tnd2
        from (
          select replace(qa.qua_name,'형','') as tnd, 1 as rk
          from mwd_resval rv, mwd_question_attr qa
          where rv.anp_seq = ${anp_seq} and qa.qua_code = rv.rv_tnd1
          union
          select replace(qa.qua_name,'형','') as tnd, 2 as rk
          from mwd_resval rv, mwd_question_attr qa
          where rv.anp_seq = ${anp_seq} and qa.qua_code = rv.rv_tnd2
        ) t
    `;
    console.log(`[getPersonalityAnalysisResult] 주/부 성향 조회 결과:`, tendencyResult);

    // 1-1. mwd_resval 테이블 확인
    const resvalCheck = await prisma.$queryRaw`
      SELECT anp_seq, rv_tnd1, rv_tnd2 
      FROM mwd_resval 
      WHERE anp_seq = ${anp_seq}
    `;
    console.log(`[getPersonalityAnalysisResult] mwd_resval 확인:`, resvalCheck);

    // 2. 상위/하위 성향 순위 조회
    console.log(`[getPersonalityAnalysisResult] Step 2: 성향 순위 조회 중...`);
    const tendencyRank = await prisma.$queryRaw<TendencyRank[]>`
      SELECT
        ts_rank as "rank",
        ts_tendency as "tendency_name"
      FROM mwd_tendency_score
      WHERE anp_seq = ${anp_seq}
      ORDER BY ts_rank
    `;
    console.log(`[getPersonalityAnalysisResult] 성향 순위 조회 결과:`, tendencyRank);

    // 3. 성향 설명 조회
    console.log(`[getPersonalityAnalysisResult] Step 3: 성향 설명 조회 중...`);
    const tendencyExplain = await prisma.$queryRaw<TendencyExplain[]>`
      SELECT
        te_rank as "rank",
        te_tendency as "tendency_name",
        te_explanation as "explanation"
      FROM mwd_tendency_explain
      WHERE anp_seq = ${anp_seq}
      ORDER BY te_rank
    `;
    console.log(`[getPersonalityAnalysisResult] 성향 설명 조회 결과:`, tendencyExplain);

    const topTendencies = tendencyRank.filter((t: TendencyRank) => t.rank <= 5);
    const bottomTendencies = tendencyRank.filter((t: TendencyRank) => t.rank > 5); // 예시: 5 초과를 하위로 가정

    const result = {
      tendency: tendencyResult[0] || { tnd1: 'N/A', tnd2: 'N/A' },
      topTendencies,
      bottomTendencies,
      topTendencyExplains: tendencyExplain.filter((e: TendencyExplain) => topTendencies.some((t: TendencyRank) => t.rank === e.rank)),
      bottomTendencyExplains: tendencyExplain.filter((e: TendencyExplain) => bottomTendencies.some((t: TendencyRank) => t.rank === e.rank)),
    };

    console.log(`[getPersonalityAnalysisResult] 최종 결과:`, result);
    return result;

  } catch (error) {
    console.error(`[getPersonalityAnalysisResult] 오류 발생:`, error);
    throw error;
  }
}
interface DetailedPersonalityResult {
  qu_explain: string;
  rank: number;
}

export async function getDetailedPersonalityResult(anp_seq: number) {
  return await prisma.$queryRaw<DetailedPersonalityResult[]>`
    select qu.qu_explain, sc1.sc1_rank as rank
      from mwd_answer an, mwd_question qu,
      (select qua_code, sc1_rank from mwd_score1 sc1
       where anp_seq = ${anp_seq} and sc1_step='tnd' and sc1_rank <= 3) sc1
      where an.anp_seq = ${anp_seq}
      and qu.qu_code = an.qu_code and qu.qu_use = 'Y'
      and qu.qu_qusyn = 'Y' and qu.qu_kind1 = 'tnd'
      and an.an_wei >= 4 and qu.qu_kind2 = sc1.qua_code
      order by sc1.sc1_rank, an.an_wei desc
  `;
}