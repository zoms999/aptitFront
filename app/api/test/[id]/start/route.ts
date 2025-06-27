import { NextResponse } from 'next/server';
import {
  checkDatabaseConnection,
  validateUserSession,
  processLanguage,
  getAccountStatus,
  getOrCreateAnpSeq,
  validateCurrentStep
} from '../../../../../lib/test/utils';
import { handlePersonalityTest } from '../../../../../lib/test/services/personality';
import { handleThinkingTest } from '../../../../../lib/test/services/thinking';
import { handlePreferenceTest } from '../../../../../lib/test/services/preference';
import { TestContext } from '../../../../../lib/test/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[메인 라우터] 테스트 시작 API 호출됨');

    // 1. 데이터베이스 연결 확인
    await checkDatabaseConnection();
    console.log('[메인 라우터] 데이터베이스 연결 성공');

    // 2. 사용자 세션 검증
    const userId = await validateUserSession();
    console.log(`[메인 라우터] 사용자 인증 성공: ${userId}`);

    // 3. 언어 설정 처리
    const language = processLanguage(request);
    console.log(`[메인 라우터] 언어 설정: ${language}`);

    // 4. 테스트 ID 검증
    const resolvedParams = await params;
    const testId = parseInt(resolvedParams.id, 10);
    if (isNaN(testId)) {
      return NextResponse.json({ error: '유효하지 않은 테스트 ID입니다' }, { status: 400 });
    }

    // 5. 계정 상태 조회
    const accountStatus = await getAccountStatus(userId);
    console.log(`[메인 라우터] 계정 상태:`, accountStatus);

    // 6. anp_seq 조회 또는 생성
    const anpSeq = await getOrCreateAnpSeq(userId, language);
    console.log(`[메인 라우터] anp_seq: ${anpSeq}`);

    // 7. 현재 단계 검증 및 수정
    const currentStep = await validateCurrentStep(anpSeq);
    console.log(`[메인 라우터] 현재 단계: ${currentStep}`);

    // 8. 테스트 컨텍스트 구성
    const context: TestContext = {
      userId,
      testId,
      language,
      anpSeq,
      accountStatus
    };

    // 9. 테스트 유형별 처리
    let response;
    switch (currentStep) {
      case 'tnd':
        console.log('[메인 라우터] 성향진단 서비스로 라우팅');
        response = await handlePersonalityTest(context);
        break;
      
      case 'thk':
        console.log('[메인 라우터] 사고력진단 서비스로 라우팅');
        response = await handleThinkingTest(context);
        break;
      
      case 'img':
        console.log('[메인 라우터] 선호도진단 서비스로 라우팅');
        response = await handlePreferenceTest(context);
        break;
      
      default:
        console.log(`[메인 라우터] 알 수 없는 단계: ${currentStep}, 성향진단으로 기본 처리`);
        response = await handlePersonalityTest(context);
        break;
    }

    console.log(`[메인 라우터] 응답 준비 완료 - 문항 수: ${response.questions.length}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[메인 라우터] 오류 발생:', error);
    
    return NextResponse.json({
      error: '테스트를 불러오는 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 