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

export default function ThinkingTestEntry({ testData, ...props }: TemplateProps) {
  switch (testData.qu_template_type) {
    case 'MULTI_SURVEY':
      return <MultiSurveyTemplate {...props} testData={testData} />;
    case 'TIMED_IMAGE_SEQUENCE':
      return <TimedImageSequenceTemplate {...props} testData={testData} />;
    case 'TIMED_CREATIVITY':
      return <TimedCreativityTemplate {...props} testData={testData} />;
    case 'TIMED_MEMORY_TEST':
      return <TimedMemoryTestTemplate {...props} testData={testData} />;
    case 'PASSAGE_COMPREHENSION':
      return <PassageComprehensionTemplate {...props} testData={testData} />;
    case 'IMAGE_AS_CHOICE':
      return <ImageAsChoiceTemplate {...props} testData={testData} />;
    case 'PURE_TEXT_LOGIC':
      return <PureTextLogicTemplate {...props} testData={testData} />;
    case 'SIMPLE_IMAGE_CHOICE':
      return <SimpleImageChoiceTemplate {...props} testData={testData} />;
    case 'PURE_TEXT_QUESTION':
    default:
      return <PureTextQuestionTemplate {...props} testData={testData} />;
  }
} 