import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

interface PersonalInfo {
  id: string;
  pname: string;
  birth: string;
  sex: string;
  cellphone: string;
  contact: string;
  email: string;
  education: string;
  school: string;
  syear: string;
  smajor: string;
  job: string;
  age: number;
  pe_job_name: string;
  pe_job_detail: string;
}

interface Tendency {
  tnd1: string;
  tnd2: string;
}

interface TendencyExplain {
  replace: string;
}

interface TendencyItem {
  tendency_name: string;
  rank: number;
  code: string;
}

interface TendencyDetailExplain {
  rank: number;
  tendency_name: string;
  explanation: string;
}

interface TendencyQuestionExplain {
  qu_explain: string;
  rank: number;
}

interface DetailedPersonalityAnalysis {
  qu_explain: string;
  rank: number;
  an_wei: number;
  qua_code: string;
}

interface TalentDetail {
  qua_name: string;
  tscore: number;
  explain: string;
  rank: number;
}

interface ThinkingMain {
  thkm: string;  // 주사고
  thks: string;  // 부사고
  tscore: number; // T점수
}

interface ThinkingScore {
  thk1: number;
  thk2: number;
  thk3: number;
  thk4: number;
  thk5: number;
  thk6: number;
  thk7: number;
  thk8: number;
}

interface ThinkingDetail {
  qua_name: string;
  score: number;
  explain: string;
}

interface SuitableJobsSummary {
  tendency: string;
  tndjob: string;
}

interface SuitableJob {
  jo_name: string;
  jo_outline: string;
  jo_mainbusiness: string;
}

interface SuitableJobMajor {
  jo_name: string;
  major: string;
}

// 이미지 선호 반응 정보
interface ImagePreference {
  tcnt: number;   // 이미지 총 반응 수
  cnt: number;    // 사용자가 선호 반응을 보인 수
  irate: number;  // 선호반응률(%)
}

// 개인용 검사결과 상세 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const inputId = resolvedParams.id;
  
  console.log(`[TEST-RESULT-ID] 입력 ID: ${inputId} 로 검사결과 조회 시작`);
  
  try {
    // inputId가 cr_seq인지 anp_seq인지 확인하고 anp_seq를 얻기
    let anp_seq: string;
    
    // 먼저 anp_seq로 직접 조회 시도
    const anpCheckQuery = `
      SELECT anp_seq FROM mwd_answer_progress WHERE anp_seq = ${inputId}
    `;
    console.log(`[TEST-RESULT-ID] anp_seq 직접 조회 시도: ${anpCheckQuery}`);
    const anpCheck = await db.$queryRawUnsafe(anpCheckQuery) as { anp_seq: number }[];
    
    if (anpCheck.length > 0) {
      // inputId가 이미 anp_seq인 경우
      anp_seq = inputId;
      console.log(`[TEST-RESULT-ID] ${inputId}는 anp_seq로 확인됨`);
    } else {
      // inputId가 cr_seq일 가능성이 높으므로 anp_seq를 조회
      const crToAnpQuery = `
        SELECT anp_seq FROM mwd_answer_progress WHERE cr_seq = ${inputId}
      `;
      console.log(`[TEST-RESULT-ID] cr_seq로 anp_seq 조회: ${crToAnpQuery}`);
      const crToAnp = await db.$queryRawUnsafe(crToAnpQuery) as { anp_seq: number }[];
      
      if (crToAnp.length === 0) {
        return NextResponse.json({
          success: false,
          message: `ID ${inputId}에 해당하는 검사 결과를 찾을 수 없습니다.`
        }, { status: 404 });
      }
      
      anp_seq = crToAnp[0].anp_seq.toString();
      console.log(`[TEST-RESULT-ID] cr_seq ${inputId} -> anp_seq ${anp_seq} 변환 완료`);
    }
    
    const id = anp_seq; // 기존 코드와의 호환성을 위해
    
    console.log(`[TEST-RESULT-ID] anp_seq: ${id} 로 검사결과 조회 시작`);
  
    // 개인 기본 정보 조회
    const personalInfoQuery = `
      select ac.ac_id as id, pe.pe_name as pname,
      pe.pe_birth_year||'-'||pe.pe_birth_month||'-'||pe.pe_birth_day as birth,
      case when pe.pe_sex = 'M' then '남' else '여' end sex,
      pe.pe_cellphone as cellphone,
      pe.pe_contact as contact,
      pe.pe_email as email,
      coalesce(ec.ename,'') as education,
      pe.pe_school_name as school,
      pe.pe_school_year as syear,
      pe.pe_school_major as smajor,
      coalesce(jc.jname,'') as job,
      cast(extract(year from age(cast(lpad(cast(pe_birth_year as text),4,'0')||lpad(cast(pe_birth_month as text),2,'0')||lpad(cast(pe_birth_day as text),2,'0') as date))) as int) as age,
      pe.pe_job_name,
      pe.pe_job_detail
      from mwd_answer_progress ap, mwd_account ac, mwd_person pe
      left outer join (select coc_code ecode, coc_code_name ename from mwd_common_code where coc_group = 'UREDU') ec on pe.pe_ur_education = ec.ecode
      left outer join (select coc_code jcode, coc_code_name jname from mwd_common_code where coc_group = 'URJOB') jc on pe.pe_ur_job = jc.jcode
      where ap.anp_seq = ${id} and ac.ac_gid = ap.ac_gid and pe.pe_seq = ac.pe_seq
    `;
    
    // 성향 정보 조회
    const tendencyQuery = `
      select max(case when rk = 1 then tnd end) as Tnd1, max(case when rk = 2 then tnd end) as Tnd2 
      from (
        select replace(qa.qua_name,'형','') as tnd, 1 as rk 
        from mwd_resval rv, mwd_question_attr qa 
        where rv.anp_seq = ${id} and qa.qua_code = rv.rv_tnd1 
        union
        select replace(qa.qua_name,'형','') as tnd, 2 as rk 
        from mwd_resval rv, mwd_question_attr qa 
        where rv.anp_seq = ${id} and qa.qua_code = rv.rv_tnd2
      ) t
    `;
    
    // 성향 설명 조회 (첫 번째 성향)
    const tendency1ExplainQuery = `
      select replace(qe.que_explain, '당신', '${id}님') 
      from mwd_resval rv, mwd_question_explain qe 
      where rv.anp_seq = ${id} and qe.qua_code = rv.rv_tnd1
    `;
    
    // 성향 설명 조회 (두 번째 성향)
    const tendency2ExplainQuery = `
      select replace(qe.que_explain, '당신', '${id}님') 
      from mwd_resval rv, mwd_question_explain qe 
      where rv.anp_seq = ${id} and qe.qua_code = rv.rv_tnd2
    `;
    
    // 상위 성향 3개 조회
    const topTendencyQuery = `
      select qa.qua_name as tendency_name, sc1.sc1_rank as rank, sc1.qua_code as code
      from mwd_score1 sc1, mwd_question_attr qa
      where sc1.anp_seq = ${id} and sc1.sc1_step='tnd' and sc1.sc1_rank <= 15
      and qa.qua_code = sc1.qua_code
      order by sc1.sc1_rank
    `;
    
    // 하위 성향 3개 조회
    const bottomTendencyQuery = `
      select qa.qua_name as tendency_name, sc1.sc1_rank as rank, sc1.qua_code as code
      from mwd_score1 sc1, mwd_question_attr qa
      where sc1.anp_seq = ${id} and sc1.sc1_step='tnd' 
      and sc1.sc1_rank > (select count(*) from mwd_score1 where anp_seq = ${id} and sc1_step='tnd') - 3
      and qa.qua_code = sc1.qua_code
      order by sc1.sc1_rank desc
    `;
    
    // 성향 질문 설명 조회
    const tendencyQuestionExplainQuery = `
      select qu.qu_explain, sc1.sc1_rank as rank
      from mwd_answer an, mwd_question qu, 
      (select qua_code, sc1_rank from mwd_score1 sc1 
       where anp_seq = ${id} and sc1_step='tnd' and sc1_rank <= 3) sc1
      where an.anp_seq = ${id} 
      and qu.qu_code = an.qu_code and qu.qu_use = 'Y' 
      and qu.qu_qusyn = 'Y' and qu.qu_kind1 = 'tnd' 
      and an.an_wei >= 4 and qu.qu_kind2 = sc1.qua_code
      order by sc1.sc1_rank, an.an_wei desc
    `;

    // 세부성향분석 조회
    const detailedPersonalityAnalysisQuery = `
      select qu.qu_explain, sc1.sc1_rank as rank, an.an_wei, sc1.qua_code
      from mwd_answer an, mwd_question qu,
      (select qua_code, sc1_rank from mwd_score1 sc1
       where anp_seq = ${id} and sc1_step='tnd' and sc1_rank <= 3) sc1
      where an.anp_seq = ${id}
      and qu.qu_code = an.qu_code and qu.qu_use = 'Y'
      and qu.qu_qusyn = 'Y' and qu.qu_kind1 = 'tnd'
      and an.an_wei >= 4 and qu.qu_kind2 = sc1.qua_code
      order by sc1.sc1_rank, an.an_wei desc
    `;
    
    // 상위 성향 상세 설명 조회
    const topTendencyExplainQuery = `
      SELECT 
        sc1.sc1_rank as rank,
        qa.qua_name as tendency_name,
        qe.que_explain as explanation
      FROM 
        mwd_score1 sc1
        JOIN mwd_question_attr qa ON qa.qua_code = sc1.qua_code
        JOIN mwd_question_explain qe ON qe.qua_code = sc1.qua_code AND qe.que_switch = 1
      WHERE 
        sc1.anp_seq = ${id}
        AND sc1.sc1_step = 'tnd'
        AND sc1.sc1_rank <= 15
      ORDER BY 
        sc1.sc1_rank
    `;
    
    // 하위 성향 상세 설명 조회
    const bottomTendencyExplainQuery = `
      SELECT 
        sc1.sc1_rank as rank,
        qa.qua_name as tendency_name,
        qe.que_explain as explanation
      FROM 
        mwd_score1 sc1
        JOIN mwd_question_attr qa ON qa.qua_code = sc1.qua_code
        JOIN mwd_question_explain qe ON qe.qua_code = sc1.qua_code AND qe.que_switch = 1
      WHERE 
        sc1.anp_seq = ${id}
        AND sc1.sc1_step = 'tnd'
        AND sc1.sc1_rank > (select count(*) from mwd_score1 where anp_seq = ${id} and sc1_step='tnd') - 3
      ORDER BY 
        sc1.sc1_rank DESC
    `;
    
    // 사고력 주사고, 부사고 및 T점수 조회
    const thinkingMainQuery = `
      SELECT
        (SELECT qa.qua_name FROM mwd_question_attr qa WHERE qa.qua_code = rv_thk1) AS thkm,
        (SELECT qa.qua_name FROM mwd_question_attr qa WHERE qa.qua_code = rv_thk2) AS thks,
        rv_thktscore AS tscore
      FROM mwd_resval
      WHERE anp_seq = ${id}
    `;
    
    // 사고력 8가지 영역 점수 조회
    const thinkingScoreQuery = `
      SELECT 
        sum(CASE WHEN qua_code = 'thk10000' THEN round(sc1_rate * 100) END) AS thk1,
        sum(CASE WHEN qua_code = 'thk20000' THEN round(sc1_rate * 100) END) AS thk2,
        sum(CASE WHEN qua_code = 'thk30000' THEN round(sc1_rate * 100) END) AS thk3,
        sum(CASE WHEN qua_code = 'thk40000' THEN round(sc1_rate * 100) END) AS thk4,
        sum(CASE WHEN qua_code = 'thk50000' THEN round(sc1_rate * 100) END) AS thk5,
        sum(CASE WHEN qua_code = 'thk60000' THEN round(sc1_rate * 100) END) AS thk6,
        sum(CASE WHEN qua_code = 'thk70000' THEN round(sc1_rate * 100) END) AS thk7,
        sum(CASE WHEN qua_code = 'thk80000' THEN round(sc1_rate * 100) END) AS thk8
      FROM mwd_score1
      WHERE anp_seq = ${id}
      AND sc1_step = 'thk'
    `;
    
    // 사고력 상세 설명 조회
    const thinkingDetailQuery = `
      SELECT 
        qa.qua_name,
        round(sc1.sc1_rate * 100) AS score,
        replace(qe.que_explain, '당신', '${id}님') AS explain
      FROM 
        mwd_score1 sc1,
        mwd_question_attr qa,
        mwd_question_explain qe
      WHERE 
        sc1.anp_seq = ${id}
        AND sc1.sc1_step = 'thk'
        AND qa.qua_code = sc1.qua_code
        AND qe.qua_code = qa.qua_code
        AND qe.que_switch = CASE
          WHEN sc1.sc1_rate * 100 BETWEEN 80 AND 100 THEN 1
          WHEN sc1.sc1_rate * 100 BETWEEN 51 AND 79 THEN 2
          ELSE 3
        END
      ORDER BY sc1.sc1_rank
    `;
    
    // 성향적합직업 요약 정보 조회
    const suitableJobsSummaryQuery = `
      SELECT 
        replace((
          SELECT qua_name 
          FROM mwd_question_attr, mwd_resval 
          WHERE anp_seq = ${id} AND qua_code = rv_tnd1
        ) || (
          SELECT qua_name 
          FROM mwd_question_attr, mwd_resval 
          WHERE anp_seq = ${id} AND qua_code = rv_tnd2
        ), '형', '') || '형' AS tendency,
        string_agg(jo.jo_name, ', ') AS tndjob
      FROM (
        SELECT rej_code 
        FROM mwd_resjob 
        WHERE anp_seq = ${id} 
        AND rej_kind = 'rtnd' 
        AND rej_rank <= 7
      ) j,
      mwd_job jo
      WHERE jo.jo_code = j.rej_code
    `;
    
    // 성향적합직업 상세 정보 조회
    const suitableJobsDetailQuery = `
      SELECT 
        jo.jo_name,
        jo.jo_outline,
        jo.jo_mainbusiness
      FROM mwd_resjob rj, mwd_job jo
      WHERE rj.anp_seq = ${id}
      AND rj.rej_kind = 'rtnd'
      AND jo.jo_code = rj.rej_code
      AND rej_rank <= 7
      ORDER BY rj.rej_rank
    `;
    
    // 성향적합직업별 학과 정보 조회
    const suitableJobMajorsQuery = `
      SELECT 
        jo.jo_name,
        string_agg(ma.ma_name, ', ' ORDER BY ma.ma_name) AS major
      FROM mwd_resjob rj, mwd_job jo, mwd_job_major_map jmm, mwd_major ma
      WHERE rj.anp_seq = ${id}
      AND rj.rej_kind = 'rtnd'
      AND jo.jo_code = rj.rej_code
      AND rej_rank <= 7
      AND jmm.jo_code = rj.rej_code
      AND ma.ma_code = jmm.ma_code
      GROUP BY jo.jo_code, rj.rej_rank
      ORDER BY rj.rej_rank
    `;
    
    // 이미지 선호 반응 정보 조회
    const imagePreferenceQuery = `
      SELECT 
        rv.rv_imgtcnt AS tcnt, 
        rv.rv_imgrcnt AS cnt, 
        rv.rv_imgresrate * 100 AS irate
      FROM mwd_resval rv 
      WHERE rv.anp_seq = ${id}
    `;
    
    // pd_kind 값 조회 쿼리 추가
    const pdKindQuery = `
      SELECT cr.pd_kind
      FROM mwd_answer_progress anp
      JOIN mwd_choice_result cr ON anp.cr_seq = cr.cr_seq
      WHERE anp.anp_seq = ${id}
    `;

    // 역량진단 상위 5개 조회
    const talentListQuery = `
      SELECT
        string_agg(qa.qua_name, ', ' ORDER BY sc1.sc1_rank) AS tal
      FROM
        mwd_question_attr qa
        JOIN mwd_score1 sc1 ON sc1.qua_code = qa.qua_code
      WHERE
        sc1.anp_seq = ${id}
        AND sc1.sc1_step = 'tal'
        AND sc1.sc1_rank <= 5
    `;

    // 역량진단 상세 정보 조회
    const talentDetailsQuery = `
      SELECT
        qa.qua_name,
        ROUND(sc1.sc1_rate * 100) AS tscore,
        REPLACE(qe.que_explain, '당신', '${id}님') AS explain,
        sc1.sc1_rank as rank
      FROM
        mwd_score1 sc1
        JOIN mwd_question_attr qa ON qa.qua_code = sc1.qua_code
        JOIN mwd_question_explain qe ON qe.qua_code = qa.qua_code
      WHERE
        sc1.anp_seq = ${id}
        AND sc1.sc1_step = 'tal'
        AND sc1.sc1_rank <= 60
      ORDER BY
        sc1.sc1_rank
    `;
    

    
    // 쿼리 실행 (SQL 로깅 추가)
    console.log("[SQL] personalInfoQuery:", personalInfoQuery);
    const personalInfo = await db.$queryRawUnsafe(personalInfoQuery) as PersonalInfo[];
    
    console.log("[SQL] tendencyQuery:", tendencyQuery);
    const tendency = await db.$queryRawUnsafe(tendencyQuery) as Tendency[];
    
    console.log("[SQL] tendency1ExplainQuery:", tendency1ExplainQuery);
    const tendency1Explain = await db.$queryRawUnsafe(tendency1ExplainQuery) as TendencyExplain[];
    
    console.log("[SQL] tendency2ExplainQuery:", tendency2ExplainQuery);
    const tendency2Explain = await db.$queryRawUnsafe(tendency2ExplainQuery) as TendencyExplain[];
    
    console.log("[SQL] topTendencyQuery:", topTendencyQuery);
    const topTendencies = await db.$queryRawUnsafe(topTendencyQuery) as TendencyItem[];
    
    console.log("[SQL] bottomTendencyQuery:", bottomTendencyQuery);
    const bottomTendencies = await db.$queryRawUnsafe(bottomTendencyQuery) as TendencyItem[];
    
    console.log("[SQL] tendencyQuestionExplainQuery:", tendencyQuestionExplainQuery);
    const tendencyQuestionExplains = await db.$queryRawUnsafe(tendencyQuestionExplainQuery) as TendencyQuestionExplain[];
    
    console.log("[SQL] detailedPersonalityAnalysisQuery:", detailedPersonalityAnalysisQuery);
    const detailedPersonalityAnalysis = await db.$queryRawUnsafe(detailedPersonalityAnalysisQuery) as DetailedPersonalityAnalysis[];
    
    console.log("[SQL] topTendencyExplainQuery:", topTendencyExplainQuery);
    const topTendencyExplains = await db.$queryRawUnsafe(topTendencyExplainQuery) as TendencyDetailExplain[];
    
    console.log("[SQL] bottomTendencyExplainQuery:", bottomTendencyExplainQuery);
    const bottomTendencyExplains = await db.$queryRawUnsafe(bottomTendencyExplainQuery) as TendencyDetailExplain[];
    
    console.log("[SQL] thinkingMainQuery:", thinkingMainQuery);
    const thinkingMain = await db.$queryRawUnsafe(thinkingMainQuery) as ThinkingMain[];
    
    console.log("[SQL] thinkingScoreQuery:", thinkingScoreQuery);
    const thinkingScore = await db.$queryRawUnsafe(thinkingScoreQuery) as ThinkingScore[];
    
    console.log("[SQL] thinkingDetailQuery:", thinkingDetailQuery);
    const thinkingDetails = await db.$queryRawUnsafe(thinkingDetailQuery) as ThinkingDetail[];
    
    console.log("[SQL] suitableJobsSummaryQuery:", suitableJobsSummaryQuery);
    const suitableJobsSummary = await db.$queryRawUnsafe(suitableJobsSummaryQuery) as SuitableJobsSummary[];
    
    console.log("[SQL] suitableJobsDetailQuery:", suitableJobsDetailQuery);
    const suitableJobsDetail = await db.$queryRawUnsafe(suitableJobsDetailQuery) as SuitableJob[];
    
    console.log("[SQL] suitableJobMajorsQuery:", suitableJobMajorsQuery);
    const suitableJobMajors = await db.$queryRawUnsafe(suitableJobMajorsQuery) as SuitableJobMajor[];
    
    console.log("[SQL] imagePreferenceQuery:", imagePreferenceQuery);
    const imagePreference = await db.$queryRawUnsafe(imagePreferenceQuery) as ImagePreference[];
    
    console.log("[SQL] pdKindQuery:", pdKindQuery);
    const pdKindResult = await db.$queryRawUnsafe(pdKindQuery) as { pd_kind: string }[];

    console.log("[SQL] talentListQuery:", talentListQuery);
    const talentListResult = await db.$queryRawUnsafe(talentListQuery) as { tal: string }[];

    console.log("[SQL] talentDetailsQuery:", talentDetailsQuery);
    const talentDetailsResult = await db.$queryRawUnsafe(talentDetailsQuery) as TalentDetail[];
    
    // 로그 기록 (에러가 나도 응답에 영향을 주지 않도록 try-catch로 처리)
    
  
    return NextResponse.json({
      success: true,
      data: {
        personalInfo: personalInfo[0],
        tendency: tendency[0],
        tendency1Explain: tendency1Explain[0],
        tendency2Explain: tendency2Explain[0],
        topTendencies,
        bottomTendencies,
        tendencyQuestionExplains,
        topTendencyExplains,
        bottomTendencyExplains,
        detailedPersonalityAnalysis,
        thinkingMain: thinkingMain[0],
        thinkingScore: thinkingScore[0],
        thinkingDetails,
        suitableJobsSummary: suitableJobsSummary[0],
        suitableJobsDetail,
        suitableJobMajors,
        imagePreference: imagePreference[0],
        pd_kind: pdKindResult?.[0]?.pd_kind || 'basic', // pd_kind가 없을 경우 기본값으로 'basic' 설정
        talentList: talentListResult?.[0]?.tal || '',
        talentDetails: talentDetailsResult
      }
    });
  } catch (error) {
    console.error('개인용 검사결과 상세 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '개인용 검사결과 상세 정보를 불러오는 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}