import prisma from '../../db/index';

// 성향 진단 결과 계산
export async function calculatePersonalityResults(anp_seq: number) {
  console.log('📊 [성향진단 결과] 계산 시작 - anp_seq:', anp_seq);
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. 기존 성향진단 점수 데이터 삭제
      await tx.$queryRaw`
        DELETE FROM mwd_score1 
        WHERE anp_seq = ${anp_seq}::integer 
        AND sc1_step = 'tnd'
      `;
      
      // 2. 성향진단 점수 계산 및 저장
      await tx.$queryRaw`
        INSERT INTO mwd_score1 
        (anp_seq, sc1_step, qua_code, sc1_score, sc1_rate, sc1_rank, sc1_qcnt) 
        SELECT 
          ${anp_seq}::integer AS anpseq, 
          'tnd' AS tnd, 
          qua_code, 
          score, 
          rate, 
          row_number() OVER (ORDER BY rate DESC, fcnt DESC, ocnt), 
          cnt 
        FROM (
          SELECT 
            qa.qua_code, 
            sum(an.an_wei) AS score, 
            round(cast(sum(an.an_wei) AS numeric)/cast(qa.qua_totalscore AS numeric),3) AS rate, 
            count(*) AS cnt, 
            cast(sum(CASE WHEN an.an_wei = 5 THEN 1 ELSE 0 END) AS numeric) AS fcnt, 
            cast(sum(CASE WHEN an.an_wei = 1 THEN 1 ELSE 0 END) AS numeric) AS ocnt 
          FROM 
            mwd_answer an, 
            mwd_question qu, 
            mwd_question_attr qa 
          WHERE 
            an.anp_seq = ${anp_seq}::integer 
            AND qu.qu_code = an.qu_code 
            AND qu.qu_qusyn = 'Y' 
            AND qu.qu_use = 'Y' 
            AND qu.qu_kind1 = 'tnd' 
            AND qa.qua_code = qu.qu_kind2 
            AND an.an_ex > 0 
            AND an.an_progress > 0 
          GROUP BY 
            qa.qua_code, qa.qua_totalscore
        ) AS t1
      `;
      
      // 3. 상위 성향 3개를 mwd_resval에 저장
      await tx.$queryRaw`
        DELETE FROM mwd_resval WHERE anp_seq = ${anp_seq}::integer
      `;
      
      await tx.$queryRaw`
        INSERT INTO mwd_resval (anp_seq, rv_tnd1, rv_tnd2, rv_tnd3)
        SELECT 
          ${anp_seq}::integer,
          max(case when rk = 1 then qua_code end) as rv_tnd1,
          max(case when rk = 2 then qua_code end) as rv_tnd2,
          max(case when rk = 3 then qua_code end) as rv_tnd3
        FROM (
          SELECT qua_code, sc1_rank as rk
          FROM mwd_score1 
          WHERE anp_seq = ${anp_seq}::integer AND sc1_step = 'tnd' AND sc1_rank <= 3
          ORDER BY sc1_rank
        ) t
      `;
      
      // 4. 성향 기반 직업 추천
      await tx.$queryRaw`
        DELETE FROM mwd_resjob WHERE anp_seq = ${anp_seq}::integer AND rej_kind = 'tnd'
      `;
      
      await tx.$queryRaw`
        INSERT INTO mwd_resjob (anp_seq, rej_code, rej_kind, rej_rank)
        SELECT 
          ${anp_seq}::integer,
          jo_code,
          'tnd' as rej_kind,
          row_number() OVER (ORDER BY score DESC) as rej_rank
        FROM (
          SELECT 
            tjm.jo_code,
            sum(sc1.sc1_score) as score
          FROM mwd_score1 sc1
          JOIN mwd_tendency_job_map tjm ON (tjm.tjm_code1 = sc1.qua_code OR tjm.tjm_code2 = sc1.qua_code OR tjm.tjm_code3 = sc1.qua_code)
          WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'tnd'
          GROUP BY tjm.jo_code
          ORDER BY score DESC
          LIMIT 20
        ) t
      `;
      
      // 5. 성향 기반 직무 추천
      await tx.$queryRaw`
        DELETE FROM mwd_resduty WHERE anp_seq = ${anp_seq}::integer AND red_kind = 'tnd'
      `;
      
      await tx.$queryRaw`
        INSERT INTO mwd_resduty (anp_seq, red_code, red_kind, red_rank)
        SELECT 
          ${anp_seq}::integer,
          du_code,
          'tnd' as red_kind,
          row_number() OVER (ORDER BY score DESC) as red_rank
        FROM (
          SELECT 
            tdm.du_code,
            sum(sc1.sc1_score) as score
          FROM mwd_score1 sc1
          JOIN mwd_tendency_duty_map tdm ON (tdm.tdm_code1 = sc1.qua_code OR tdm.tdm_code2 = sc1.qua_code)
          WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'tnd'
          GROUP BY tdm.du_code
          ORDER BY score DESC
          LIMIT 20
        ) t
      `;
    });
    
    console.log('✅ [성향진단 결과] 계산 완료');
    
  } catch (error) {
    console.error('❌ [성향진단 결과] 계산 중 오류:', error);
    throw error;
  }
}

// 사고력 진단 결과 계산
export async function calculateThinkingResults(anp_seq: number) {
  console.log('📊 [사고력진단 결과] 계산 시작 - anp_seq:', anp_seq);
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. 기존 사고력진단 점수 데이터 삭제
      await tx.$queryRaw`
        DELETE FROM mwd_score1 
        WHERE anp_seq = ${anp_seq}::integer 
        AND sc1_step = 'thk'
      `;
      
      // 2. 사고력진단 점수 계산 및 저장
      await tx.$queryRaw`
        INSERT INTO mwd_score1 
        (anp_seq, sc1_step, qua_code, sc1_score, sc1_rate, sc1_rank, sc1_qcnt) 
        SELECT 
          ${anp_seq}::integer AS anpseq, 
          'thk' AS thk, 
          COALESCE(qa.qua_code, qu.qu_kind2) AS qua_code,
          COALESCE(sum(an.an_wei), 0) AS score, 
          CASE 
            WHEN COALESCE(qa.qua_totalscore, 1) = 0 THEN 0
            ELSE round(cast(COALESCE(sum(an.an_wei), 0) AS numeric)/cast(COALESCE(qa.qua_totalscore, 1) AS numeric),3)
          END AS rate, 
          row_number() OVER (ORDER BY 
            CASE 
              WHEN COALESCE(qa.qua_totalscore, 1) = 0 THEN 0
              ELSE round(cast(COALESCE(sum(an.an_wei), 0) AS numeric)/cast(COALESCE(qa.qua_totalscore, 1) AS numeric),3)
            END DESC, 
            count(*) DESC
          ) AS rank,
          count(*) AS cnt
        FROM 
          mwd_answer an
          JOIN mwd_question qu ON qu.qu_code = an.qu_code 
          LEFT JOIN mwd_question_attr qa ON qa.qua_code = qu.qu_kind2
        WHERE 
          an.anp_seq = ${anp_seq}::integer 
          AND qu.qu_qusyn = 'Y' 
          AND qu.qu_use = 'Y' 
          AND qu.qu_kind1 = 'thk' 
          AND an.an_ex >= 0 
          AND an.an_progress > 0 
        GROUP BY 
          COALESCE(qa.qua_code, qu.qu_kind2), COALESCE(qa.qua_totalscore, 1)
      `;
      
      // 3. 상위 사고력 2개를 mwd_resval에 저장
      await tx.$queryRaw`
        UPDATE mwd_resval 
        SET 
          rv_thk1 = t.thk1,
          rv_thk2 = t.thk2,
          rv_thktscore = t.thkscore
        FROM (
          SELECT 
            max(case when rk = 1 then qua_code end) as thk1,
            max(case when rk = 2 then qua_code end) as thk2,
            sum(sc1_score) as thkscore
          FROM (
            SELECT qua_code, sc1_score, sc1_rank as rk
            FROM mwd_score1 
            WHERE anp_seq = ${anp_seq}::integer AND sc1_step = 'thk' AND sc1_rank <= 2
            ORDER BY sc1_rank
          ) sub
        ) t
        WHERE anp_seq = ${anp_seq}::integer
      `;
    });
    
    console.log('✅ [사고력진단 결과] 계산 완료');
    
  } catch (error) {
    console.error('❌ [사고력진단 결과] 계산 중 오류:', error);
    throw error;
  }
}

// 선호도 진단 결과 계산
export async function calculatePreferenceResults(anp_seq: number) {
  console.log('📊 [선호도진단 결과] 계산 시작 - anp_seq:', anp_seq);
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. 기존 선호도진단 점수 데이터 삭제
      await tx.$queryRaw`
        DELETE FROM mwd_score1 
        WHERE anp_seq = ${anp_seq}::integer 
        AND sc1_step = 'img'
      `;
      
      // 2. 선호도진단 점수 계산 및 저장
      await tx.$queryRaw`
        INSERT INTO mwd_score1 
        (anp_seq, sc1_step, qua_code, sc1_score, sc1_rate, sc1_rank, sc1_qcnt) 
        SELECT 
          ${anp_seq}::integer AS anpseq, 
          'img' AS img, 
          COALESCE(qa.qua_code, qu.qu_kind3) AS qua_code,
          COALESCE(sum(an.an_wei), 0) AS score, 
          CASE 
            WHEN COALESCE(qa.qua_totalscore, 1) = 0 THEN 0
            ELSE round(cast(COALESCE(sum(an.an_wei), 0) AS numeric)/cast(COALESCE(qa.qua_totalscore, 1) AS numeric),3)
          END AS rate, 
          row_number() OVER (ORDER BY 
            CASE 
              WHEN COALESCE(qa.qua_totalscore, 1) = 0 THEN 0
              ELSE round(cast(COALESCE(sum(an.an_wei), 0) AS numeric)/cast(COALESCE(qa.qua_totalscore, 1) AS numeric),3)
            END DESC, 
            count(*) DESC
          ) AS rank,
          count(*) AS cnt
        FROM 
          mwd_answer an
          JOIN mwd_question qu ON qu.qu_code = an.qu_code 
          LEFT JOIN mwd_question_attr qa ON qa.qua_code = qu.qu_kind3
        WHERE 
          an.anp_seq = ${anp_seq}::integer 
          AND qu.qu_qusyn = 'Y' 
          AND qu.qu_use = 'Y' 
          AND qu.qu_kind1 = 'img' 
          AND an.an_ex >= 0 
          AND an.an_progress > 0 
        GROUP BY 
          COALESCE(qa.qua_code, qu.qu_kind3), COALESCE(qa.qua_totalscore, 1)
      `;
      
      // 3. 선호도 기반 직업 추천
      await tx.$queryRaw`
        DELETE FROM mwd_resjob WHERE anp_seq = ${anp_seq}::integer AND rej_kind = 'img'
      `;
      
      await tx.$queryRaw`
        INSERT INTO mwd_resjob (anp_seq, rej_code, rej_kind, rej_rank)
        SELECT 
          ${anp_seq}::integer,
          jo_code,
          'img' as rej_kind,
          row_number() OVER (ORDER BY score DESC) as rej_rank
        FROM (
          SELECT 
            ijm.jo_code,
            sum(sc1.sc1_score) as score
          FROM mwd_score1 sc1
          JOIN mwd_image_job_map ijm ON ijm.qu_code = (
            SELECT qu_code FROM mwd_question WHERE qu_kind3 = sc1.qua_code AND qu_kind1 = 'img' LIMIT 1
          )
          WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'img'
          GROUP BY ijm.jo_code
          ORDER BY score DESC
          LIMIT 20
        ) t
      `;
    });
    
    console.log('✅ [선호도진단 결과] 계산 완료');
    
  } catch (error) {
    console.error('❌ [선호도진단 결과] 계산 중 오류:', error);
    throw error;
  }
}

// 재능 진단 결과 계산 (각 단계 완료 시 호출)
export async function calculateTalentResults(anp_seq: number) {
  console.log('📊 [재능진단 결과] 계산 시작 - anp_seq:', anp_seq);
  try {
    await prisma.$transaction(async (tx) => {
      // 1. 기존 재능진단 점수 데이터 삭제
      await tx.$queryRaw`
        DELETE FROM mwd_score1 
        WHERE anp_seq = ${anp_seq}::integer 
        AND sc1_step = 'tal'
      `;
      // 2. 재능진단 점수 계산 및 저장 (tnd와 유사하게 가정)
      await tx.$queryRaw`
        INSERT INTO mwd_score1 
        (anp_seq, sc1_step, qua_code, sc1_score, sc1_rate, sc1_rank, sc1_qcnt) 
        SELECT 
          ${anp_seq}::integer AS anpseq, 
          'tal' AS tal, 
          qa.qua_code, 
          sum(an.an_wei) AS score, 
          round(cast(sum(an.an_wei) AS numeric)/cast(qa.qua_totalscore AS numeric),3) AS rate, 
          row_number() OVER (ORDER BY round(cast(sum(an.an_wei) AS numeric)/cast(qa.qua_totalscore AS numeric),3) DESC),
          count(*) as cnt
        FROM 
          mwd_answer an, 
          mwd_question qu, 
          mwd_question_attr qa 
        WHERE 
          an.anp_seq = ${anp_seq}::integer 
          AND qu.qu_code = an.qu_code 
          AND qu.qu_qusyn = 'Y' 
          AND qu.qu_use = 'Y' 
          AND qu.qu_kind1 = 'tal' -- 재능 문항 필터링
          AND qa.qua_code = qu.qu_kind2 
          AND an.an_ex > 0 
          AND an.an_progress > 0 
        GROUP BY 
          qa.qua_code, qa.qua_totalscore
      `;
    });
    console.log('✅ [재능진단 결과] 계산 완료');
  } catch (error) {
    console.error('❌ [재능진단 결과] 계산 중 오류:', error);
    throw error;
  }
}

// 최종 종합 결과 계산 (모든 검사 완료 후 단 한번 호출)
export async function calculateFinalResults(anp_seq: number) {
  console.log('📊 [최종 결과] 계산 시작 - anp_seq:', anp_seq);
  try {
    await prisma.$transaction(async (tx) => {
      // 1. 선호도(img) 점수 계산 (OLD 시스템 방식)
      console.log('🔄 [1단계] 선호도 점수 계산 시작');
      
      // 기존 선호도 점수 삭제
      await tx.$queryRaw`
        DELETE FROM mwd_score1 WHERE anp_seq = ${anp_seq}::integer AND sc1_step = 'img'
      `;
      
      // 새로운 선호도 점수 계산 및 삽입
      await tx.$queryRaw`
        INSERT INTO mwd_score1 (anp_seq, sc1_step, qua_code, sc1_score, sc1_rate, sc1_rank, sc1_resrate, sc1_qcnt)
        SELECT ${anp_seq}::integer, 'img', qua_code, score, rate, 
               row_number() OVER (ORDER BY rate DESC, tots DESC), 
               round(cast(cnt as numeric)/cast(tcnt as numeric),3) as resrate, tcnt
        FROM (
          SELECT
            qa.qua_code,
            sum(an.an_wei) as score,
            CASE
              WHEN qa.qua_code = 'img21000' THEN round(cast(sum(an.an_wei) as numeric)/cast(qa.qua_totalscore as numeric),3) * 1.4
              ELSE round(cast(sum(an.an_wei) as numeric)/cast(qa.qua_totalscore as numeric),3)
            END as rate,
            qa.qua_totalscore as tots,
            count(*) as tcnt,
            sum(CASE WHEN an.an_wei > 0 THEN 1 ELSE 0 END) as cnt
          FROM mwd_answer an, mwd_question qu, mwd_question_attr qa
          WHERE an.anp_seq = ${anp_seq}::integer
            AND qu.qu_code = an.qu_code AND qu.qu_qusyn = 'Y' AND qu.qu_use = 'Y' AND an.an_ex > 0
            AND qu.qu_kind1 = 'img' AND qa.qua_code = qu.qu_kind3
          GROUP BY qa.qua_code, qa.qua_totalscore
          ORDER BY qa.qua_code
        ) as t2
      `;
      
      console.log('✅ [1단계] 선호도 점수 계산 완료');
      
      // 2. 결과 요약 테이블 초기화 및 생성
      console.log('🔄 [2단계] 결과 요약 테이블 생성 시작');
      
      // 기존 요약 정보 전체 삭제
      await tx.$queryRaw`
        DELETE FROM mwd_resval WHERE anp_seq = ${anp_seq}::integer
      `;
      
      // 1) 상위 성향(tnd) 코드 저장
      await tx.$queryRaw`
        INSERT INTO mwd_resval (anp_seq, rv_tnd1, rv_tnd2, rv_tnd3)
        SELECT ${anp_seq}::integer,
          min(CASE WHEN rk=1 THEN qua_code END) as tnd1,
          min(CASE WHEN rk=2 THEN qua_code END) as tnd2,
          min(CASE WHEN rk=3 THEN qua_code END) as tnd3
        FROM (
          SELECT qua_code, row_number() OVER(ORDER BY sc1_rank) as rk
          FROM mwd_score1
          WHERE anp_seq = ${anp_seq}::integer AND sc1_step = 'tnd' AND sc1_rank <= 5
          LIMIT 5
        ) tnd
      `;
      
      // 2) 상위 사고력(thk) 코드 및 점수 업데이트
      await tx.$queryRaw`
        UPDATE mwd_resval
        SET rv_thk1 = t.thk1, rv_thk2 = t.thk2, rv_thktscore = t.thkscore
        FROM (
          SELECT
            min(CASE WHEN rk=1 THEN qua_code END) as thk1,
            min(CASE WHEN rk=2 THEN qua_code END) as thk2,
            min(thkscore) as thkscore
          FROM (
            SELECT thk1.qua_code, thk1.rk, thk2.thkscore
            FROM (
              SELECT qua_code, row_number() OVER(ORDER BY sc1_rank) as rk
              FROM mwd_score1
              WHERE anp_seq = ${anp_seq}::integer AND sc1_step = 'thk' AND sc1_rank <= 2 
              LIMIT 2
            ) thk1,
            (
              SELECT round(cast(sum(sc1.sc1_score) as numeric)/cast(sum(qa.qua_totalscore) as numeric),2)*100 as thkscore
              FROM mwd_question_attr qa, mwd_score1 sc1
              WHERE qa.qua_code = sc1.qua_code AND sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'thk'
            ) thk2
          ) thk
        ) t
        WHERE anp_seq = ${anp_seq}::integer
      `;
      
      // 3) 상위 재능(tal) 코드 업데이트
      await tx.$queryRaw`
        UPDATE mwd_resval
        SET rv_tal1 = t.tal1, rv_tal2 = t.tal2, rv_tal3 = t.tal3, rv_tal4 = t.tal4, rv_tal5 = t.tal5, rv_tal6 = t.tal6, rv_tal7 = t.tal7
        FROM (
          SELECT
            min(CASE WHEN rk=1 THEN qua_code END) as tal1,
            min(CASE WHEN rk=2 THEN qua_code END) as tal2,
            min(CASE WHEN rk=3 THEN qua_code END) as tal3,
            min(CASE WHEN rk=4 THEN qua_code END) as tal4,
            min(CASE WHEN rk=5 THEN qua_code END) as tal5,
            min(CASE WHEN rk=6 THEN qua_code END) as tal6,
            min(CASE WHEN rk=7 THEN qua_code END) as tal7
          FROM (
            SELECT qua_code, row_number() OVER(ORDER BY sc1_rank) as rk
            FROM mwd_score1
            WHERE anp_seq = ${anp_seq}::integer AND sc1_step = 'tal' AND sc1_rank <= 5
            LIMIT 5
          ) tal
        ) t
        WHERE anp_seq = ${anp_seq}::integer
      `;
      
      // 4) 이미지 응답률 업데이트
      await tx.$queryRaw`
        UPDATE mwd_resval
        SET rv_imgresrate = t.imgresrate, rv_imgtcnt = t.tcnt, rv_imgrcnt = t.cnt
        FROM (
          SELECT
            round(cast(c.cnt as numeric)/cast(t.tcnt as numeric),3) as imgresrate,
            t.tcnt,
            c.cnt
          FROM (
            SELECT count(*) as tcnt FROM mwd_question WHERE qu_kind1 = 'img' AND qu_use = 'Y' AND qu_qusyn = 'Y'
          ) t,
          (
            SELECT count(*) as cnt FROM mwd_answer WHERE anp_seq = ${anp_seq}::integer AND qu_code LIKE 'img%' AND an_ex = 1
          ) c
        ) t
        WHERE anp_seq = ${anp_seq}::integer
      `;
      
      console.log('✅ [2단계] 결과 요약 테이블 생성 완료');
      
      // 3. 추천 직업 및 직무 생성
      console.log('🔄 [3단계] 추천 직업 및 직무 생성 시작');
      
      // 기존 추천 직업 정보 전체 삭제
      await tx.$queryRaw`
        DELETE FROM mwd_resjob WHERE anp_seq = ${anp_seq}::integer
      `;
      
      // 1) 성향 기반 추천 직업(rtnd) 생성
      await tx.$queryRaw`
        INSERT INTO mwd_resjob (anp_seq, rej_kind, rej_code, rej_rank, rej_cnt)
        SELECT ${anp_seq}::integer, 'rtnd', jo_code, row_number() OVER(ORDER BY rk, cnt DESC), cnt
        FROM (
          SELECT jo_code, count(*) cnt, min(rk) as rk
          FROM (
            SELECT jm.jo_code, 1 as rk, row_number() OVER() as rk2
            FROM mwd_resval rv, mwd_tendency_job_map jm
            WHERE rv.anp_seq = ${anp_seq}::integer AND jm.tjm_code1 = rv.rv_tnd1
            UNION
            SELECT jm.jo_code, 2 as rk, row_number() OVER() as rk2
            FROM mwd_resval rv, mwd_tendency_job_map jm
            WHERE rv.anp_seq = ${anp_seq}::integer AND jm.tjm_code2 = rv.rv_tnd2
          ) a
          GROUP BY jo_code
        ) t
      `;
      
      // 2) 재능 기반 추천 직업(rtal) 생성
      await tx.$queryRaw`
        INSERT INTO mwd_resjob (anp_seq, rej_kind, rej_code, rej_rank, rej_cnt)
        SELECT ${anp_seq}::integer, 'rtal', jo_code, row_number() OVER(ORDER BY rk, cnt DESC), cnt
        FROM (
          SELECT jo_code, count(*) cnt, min(rk) as rk
          FROM (
            SELECT jo_code, 1 as rk FROM mwd_talent_job_map jm, mwd_resval rv WHERE rv.anp_seq = ${anp_seq}::integer AND jm.tjm_code1 = rv.rv_tal1
            UNION SELECT jo_code, 2 as rk FROM mwd_talent_job_map jm, mwd_resval rv WHERE rv.anp_seq = ${anp_seq}::integer AND jm.tjm_code2 = rv.rv_tal2
            UNION SELECT jo_code, 3 as rk FROM mwd_talent_job_map jm, mwd_resval rv WHERE rv.anp_seq = ${anp_seq}::integer AND jm.tjm_code3 = rv.rv_tal3
            UNION SELECT jo_code, 4 as rk FROM mwd_talent_job_map jm, mwd_resval rv WHERE rv.anp_seq = ${anp_seq}::integer AND jm.tjm_code4 = rv.rv_tal4
          ) a
          GROUP BY jo_code
        ) t
      `;
      
      // 3) 선호도 기반 추천 직업(rimg) 생성
      await tx.$queryRaw`
        INSERT INTO mwd_resjob (anp_seq, rej_kind, rej_code, rej_rank, rej_quacode)
        SELECT ${anp_seq}::integer, 'rimg'||cast(sc1_rank as text), jo_code, row_number() OVER(PARTITION BY sc1_rank), qu_kind2
        FROM (
          SELECT sc1_rank, jm.qu_code, qu_kind2, jm.jo_code, row_number() OVER(PARTITION BY sc1_rank ORDER BY an_wei DESC) rk
          FROM (
            SELECT sc1.sc1_rank, qu.qu_kind2, qu.qu_code, an.an_wei
            FROM mwd_score1 sc1, mwd_question qu, mwd_answer an
            WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'img' AND sc1.sc1_rank <= 3 AND qu.qu_kind3 = sc1.qua_code
              AND qu.qu_use = 'Y' AND qu.qu_qusyn = 'Y' AND an.anp_seq = sc1.anp_seq AND an.qu_code = qu.qu_code AND an.an_ex = 1
            ORDER BY sc1.sc1_rank, an.an_wei DESC
          ) img, mwd_image_job_map jm
          WHERE jm.qu_code = img.qu_code
        ) t
        WHERE rk <= 5
      `;
      
      // 4) 최종 종합 추천 직업(rbest) 생성
      await tx.$queryRaw`
        INSERT INTO mwd_resjob (anp_seq, rej_kind, rej_code, rej_rank, rej_cnt)
        SELECT ${anp_seq}::integer, 'rbest', rej_code, rk, cnt
        FROM (
          SELECT rej_code, sum(rej_cnt) cnt, row_number() OVER(ORDER BY sum(rej_cnt) DESC) as rk
          FROM mwd_resjob
          WHERE anp_seq = ${anp_seq}::integer AND rej_kind IN ('rtnd','rtal')
          GROUP BY rej_code
        ) t
        WHERE rk <= 10
      `;
      
      // 5) 추천 직무 생성 (성향 기반)
      await tx.$queryRaw`
        DELETE FROM mwd_resduty WHERE anp_seq = ${anp_seq}::integer
      `;
      
      await tx.$queryRaw`
        INSERT INTO mwd_resduty (anp_seq, red_kind, red_code, red_rank, red_cnt)
        SELECT ${anp_seq}::integer, 'rtnd', du_code, row_number() OVER(ORDER BY rk, cnt DESC), cnt
        FROM (
          SELECT du_code, count(*) as cnt, min(rk) as rk
          FROM (
            SELECT sc1.sc1_rank rk, sc1.qua_code, dm.du_code FROM mwd_score1 sc1, mwd_tendency_duty_map dm
            WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'tnd' AND dm.tdm_code1 = sc1.qua_code AND sc1.sc1_rank = 1
            UNION
            SELECT sc1.sc1_rank, sc1.qua_code, dm.du_code FROM mwd_score1 sc1, mwd_tendency_duty_map dm
            WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'tnd' AND dm.tdm_code2 = sc1.qua_code AND sc1.sc1_rank = 2
            UNION
            SELECT sc1.sc1_rank, sc1.qua_code, dm.du_code FROM mwd_score1 sc1, mwd_tendency_duty_map dm
            WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'tnd' AND dm.tdm_code3 = sc1.qua_code AND sc1.sc1_rank = 3
            UNION
            SELECT sc1.sc1_rank, sc1.qua_code, dm.du_code FROM mwd_score1 sc1, mwd_tendency_duty_map dm
            WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'tnd' AND dm.tdm_code4 = sc1.qua_code AND sc1.sc1_rank = 4
            UNION
            SELECT sc1.sc1_rank, sc1.qua_code, dm.du_code FROM mwd_score1 sc1, mwd_tendency_duty_map dm
            WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'tnd' AND dm.tdm_code5 = sc1.qua_code AND sc1.sc1_rank = 5
          ) a
          GROUP BY du_code
        ) t
      `;
      
      console.log('✅ [3단계] 추천 직업 및 직무 생성 완료');
      
      console.log('✅ [최종 결과] 모든 계산 완료');
      
    });
    console.log('✅ [최종 결과] 모든 계산 완료 - anp_seq:', anp_seq);
  } catch (error) {
    console.error('❌ [최종 결과] 계산 중 오류:', error);
    throw error;
  }
}
