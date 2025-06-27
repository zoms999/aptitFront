// 테스트 관련 공통 타입 정의

export interface Choice {
  an_val: number;
  an_text: string;
  an_desc: string | null;
  an_sub: string | null;
  an_wei: number;
  choice_image_path?: string;
}

export interface Question {
  qu_code: string;
  qu_filename: string;
  qu_order: number;
  qu_title?: string;
  qu_passage?: string;
  qu_instruction?: string;
  qu_text: string;
  qu_explain?: string;
  qu_category: string;
  qu_action: string;
  qu_time_limit_sec?: number | null;
  qu_images?: string[];
  choices: Choice[];
}

export interface NextQuestion {
  qu_filename: string;
  qu_code: string;
  step: string;
  prev_step: string;
  qu_action: string;
  prev_code: string;
  qua_type: string;
  pd_kind: string;
}

export interface AccountStatus {
  cr_pay: string;
  pd_kind: string;
  expire: string;
  state: string;
}

export interface ProgressInfo {
  acnt: number;
  tcnt: number;
  step: string;
}

export interface TestResponse {
  anp_seq: number;
  pd_kind: string;
  qu_filename: string;
  qu_code: string;
  step: string;
  prev_step: string;
  qu_action: string;
  prev_code: string;
  qua_type: string;
  questions: Question[];
  completed_pages: number;
  total_questions: number;
  current_number: number;
  debug_info?: {
    nextQuestion_original: NextQuestion[] | null;
    questions_count: number;
    current_step: string;
    anp_seq: number;
  };
}

export type TestStep = 'tnd' | 'thk' | 'img';

export interface TestContext {
  userId: string;
  testId: number;
  language: string;
  anpSeq: number;
  accountStatus: AccountStatus;
} 