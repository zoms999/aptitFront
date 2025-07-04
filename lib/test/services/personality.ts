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