import { TestResponse, TestContext, Question } from '../types';
import { getNextQuestion, getCurrentQuFilename, findFirstRealQuestionFilename } from '../queries/common';
import { getPreferenceQuestionsWithLang, getPreferenceQuestionsFallback } from '../queries/preference';
import { getProgressInfo, getCrSeq } from '../utils';

/**
 * 선호도진단 테스트 처리
 */
export async function handlePreferenceTest(context: TestContext): Promise<TestResponse> {
  console.log(`\n=== 선호도진단 테스트 처리 시작 ===`);
  console.log(`사용자 ID: ${context.userId}, anp_seq: ${context.anpSeq}, 언어: ${context.language}`);
  
  // 1. 다음 질문 정보 조회
  const nextQuestion = await getNextQuestion(context.anpSeq);
  console.log('[선호도진단] 다음 질문 정보:', nextQuestion);

  // 2. 현재 진행 중인 qu_filename 조회
  let questionFilename = await getCurrentQuFilename(context.anpSeq);
  console.log(`[선호도진단] 현재 qu_filename: ${questionFilename}`);

  // 3. 선호도진단 시작 시 첫 번째 문항 파일명 찾기
  if (!questionFilename) {
    questionFilename = await findFirstRealQuestionFilename('img', context.language);
    console.log(`[선호도진단] 첫 번째 문항 파일명 찾기 결과: ${questionFilename}`);
  }

  // 4. 문항 조회 (2단계 Fallback)
  let questions: Question[] = [];
  
  if (questionFilename) {
    // 1단계: 다국어 테이블 포함한 정상 쿼리
    console.log(`[선호도진단 1단계] 다국어 테이블 포함 조회 시도 - ${questionFilename}`);
    questions = await getPreferenceQuestionsWithLang(questionFilename, context.language);
    
    if (!questions || questions.length === 0) {
      // 2단계: 기본 테이블만 사용
      console.log(`[선호도진단 2단계] 기본 테이블만 사용한 Fallback - ${questionFilename}`);
      questions = await getPreferenceQuestionsFallback(questionFilename);
    }
  }

  // 5. 문항이 없는 경우 빈 배열 반환
  if (!questions || questions.length === 0) {
    console.log(`[선호도진단] 문항을 찾을 수 없음`);
    questions = [];
  }

  // 6. 진행률 정보 조회
  const progressInfo = await getProgressInfo(context.anpSeq);
  console.log(`[선호도진단] 진행률 정보:`, progressInfo);

  // 7. cr_seq 조회
  const crSeq = await getCrSeq(context.anpSeq);
  console.log(`[선호도진단] cr_seq: ${crSeq}`);

  // 8. 타이머 통계
  const timerQuestions = questions.filter(q => q.qu_time_limit_sec && q.qu_time_limit_sec > 0);
  const noTimerQuestions = questions.filter(q => !q.qu_time_limit_sec || q.qu_time_limit_sec === 0);
  
  console.log(`[선호도진단] 총 ${questions.length}개 문항 중 타이머 ${timerQuestions.length}개, 타이머 없음 ${noTimerQuestions.length}개`);

  // 9. 응답 구성
  const response: TestResponse = {
    anp_seq: context.anpSeq,
    cr_seq: crSeq || undefined,
    pd_kind: context.accountStatus.pd_kind,
    qu_filename: questionFilename || '',
    qu_code: nextQuestion?.qu_code || '',
    step: 'img',
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
      current_step: 'img',
      anp_seq: context.anpSeq
    }
  };

  console.log(`[선호도진단] 응답 준비 완료: ${questions.length}개 문항`);
  return response;
} 