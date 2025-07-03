export interface AccountStatus {
  cr_pay: string;
  pd_kind: string;
  expire: string;
  state: string;
}

export interface Test {
  num: number;
  cr_seq: number;
  cr_pay: string;
  pd_name: string;
  anp_seq: number;
  startdate: string;
  enddate: string;
  done: string;
  rview: string;
  expiredate: string;
}

export interface InstituteInfo {
  ins_seq: number;
  ins_name: string;
  tur_seq: number;
  tur_code: string;
  tur_req_sum: number;
  tur_use_sum: number;
  tur_is_paid: string;
  tur_allow_no_payment: string;
}

export interface TestStatus {
  hasTest: boolean;
  testCount: number;
  completedCount: number;
  latestTestStatus: string;
  latestCrSeq: string | null;
}

export interface Member {
  pe_seq: number;
  pe_name: string;
  pe_email: string;
  pe_sex: string;
  pe_cellphone: string;
  join_date: string;
  ac_id: string | null;
  testStatus?: TestStatus;
}

export interface DashboardData {
  accountStatus: AccountStatus;
  tests: Test[];
  completedTests: number;
  instituteInfo: InstituteInfo;
  members: Member[];
  isOrganization: boolean;
  isOrganizationAdmin: boolean;
  userType: string;
}