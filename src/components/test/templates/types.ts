// 공통 타입 정의
export interface Choice {
  an_val: number;
  an_text: string;
  an_desc: string | null;
  an_wei: number;
  choice_image_path?: string;
}

export interface Question {
  qu_code: string;
  qu_title?: string;
  qu_passage?: string;
  qu_instruction?: string;
  qu_text: string;
  qu_explain?: string;
  qu_order: number;
  qu_images?: string[];
  qu_time_limit_sec?: number | null;
  qu_template_type?: string;
  choices: Choice[];
}

export interface TestData {
  qu_template_type: string;
  questions: Question[];
  [key: string]: unknown;
}

export interface TemplateProps {
  testData: TestData;
  selectedAnswers: Record<string, number>;
  onSelectChoice: (questionCode: string, choiceValue: number, choiceWeight: number) => void;
  [key: string]: unknown;
}

export interface TimerState {
  timeLeft: number;
  isActive: boolean;
  isCompleted: boolean;
  totalTime: number;
} 