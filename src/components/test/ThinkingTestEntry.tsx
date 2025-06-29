import React from 'react';
import { TemplateProps } from './templates/types';
import MultiSurveyTemplate from './templates/MultiSurveyTemplate';
import TimedImageSequenceTemplate from './templates/TimedImageSequenceTemplate';
import TimedCreativityTemplate from './templates/TimedCreativityTemplate';
import TimedMemoryTestTemplate from './templates/TimedMemoryTestTemplate';
import PassageComprehensionTemplate from './templates/PassageComprehensionTemplate';
import ImageAsChoiceTemplate from './templates/ImageAsChoiceTemplate';
import PureTextLogicTemplate from './templates/PureTextLogicTemplate';
import SimpleImageChoiceTemplate from './templates/SimpleImageChoiceTemplate';
import PureTextQuestionTemplate from './templates/PureTextQuestionTemplate';

export default function ThinkingTestEntry({ testData, selectedAnswers, ...props }: TemplateProps) {
  // 템플릿별 답변 상태 로깅
  React.useEffect(() => {
    if (testData.questions && testData.questions.length > 0) {
      const answeredQuestions = testData.questions.filter(q => selectedAnswers && selectedAnswers[q.qu_code]);
      const unansweredQuestions = testData.questions.filter(q => !selectedAnswers || !selectedAnswers[q.qu_code]);
      
      console.log(`[${testData.qu_template_type}] 답변 상태: ${answeredQuestions.length}/${testData.questions.length}`, {
        answered: answeredQuestions.map(q => q.qu_code),
        unanswered: unansweredQuestions.map(q => q.qu_code)
      });

      // 모든 문항이 답변되지 않은 템플릿 경고
      if (answeredQuestions.length === 0 && testData.questions.length > 0) {
        console.warn(`⚠️ [${testData.qu_template_type}] 템플릿의 모든 문항이 미답변 상태!`, 
          testData.questions.map(q => q.qu_code));
      }
    }
  }, [testData, selectedAnswers]);

  switch (testData.qu_template_type) {
    case 'MULTI_SURVEY':
      return <MultiSurveyTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
    case 'TIMED_IMAGE_SEQUENCE':
      return <TimedImageSequenceTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
    case 'TIMED_CREATIVITY':
      return <TimedCreativityTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
    case 'TIMED_MEMORY_TEST':
      return <TimedMemoryTestTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
    case 'PASSAGE_COMPREHENSION':
      return <PassageComprehensionTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
    case 'IMAGE_AS_CHOICE':
      return <ImageAsChoiceTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
    case 'PURE_TEXT_LOGIC':
      return <PureTextLogicTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
    case 'SIMPLE_IMAGE_CHOICE':
      return <SimpleImageChoiceTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
    case 'PURE_TEXT_QUESTION':
    default:
      return <PureTextQuestionTemplate {...props} testData={testData} selectedAnswers={selectedAnswers} />;
  }
} 