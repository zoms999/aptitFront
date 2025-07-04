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

// 최종 종합 결과 계산
export async function calculateFinalResults(anp_seq: number) {
  console.log('📊 [최종 결과] 계산 시작 - anp_seq:', anp_seq);
  
  try {
    await prisma.$transaction(async (tx) => {
      // 종합 직업 추천 (성향 + 선호도 가중합)
      await tx.$queryRaw`
        DELETE FROM mwd_resjob WHERE anp_seq = ${anp_seq}::integer AND rej_kind = 'total'
      `;
      
      await tx.$queryRaw`
        INSERT INTO mwd_resjob (anp_seq, rej_code, rej_kind, rej_rank)
        SELECT 
          ${anp_seq}::integer,
          jo_code,
          'total' as rej_kind,
          row_number() OVER (ORDER BY total_score DESC) as rej_rank
        FROM (
          SELECT 
            COALESCE(tnd.jo_code, img.jo_code) as jo_code,
            COALESCE(tnd.tnd_score * 0.6, 0) + COALESCE(img.img_score * 0.4, 0) as total_score
          FROM (
            SELECT jo_code, sum(sc1_score) as tnd_score
            FROM mwd_score1 sc1
            JOIN mwd_tendency_job_map tjm ON (tjm.tjm_code1 = sc1.qua_code OR tjm.tjm_code2 = sc1.qua_code OR tjm.tjm_code3 = sc1.qua_code)
            WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'tnd'
            GROUP BY jo_code
          ) tnd
          FULL OUTER JOIN (
            SELECT jo_code, sum(sc1_score) as img_score
            FROM mwd_score1 sc1
            JOIN mwd_image_job_map ijm ON ijm.qu_code = (
              SELECT qu_code FROM mwd_question WHERE qu_kind3 = sc1.qua_code AND qu_kind1 = 'img' LIMIT 1
            )
            WHERE sc1.anp_seq = ${anp_seq}::integer AND sc1.sc1_step = 'img'
            GROUP BY jo_code
          ) img ON tnd.jo_code = img.jo_code
          ORDER BY total_score DESC
          LIMIT 10
        ) t
      `;
    });
    
    console.log('✅ [최종 결과] 계산 완료');
    
  } catch (error) {
    console.error('❌ [최종 결과] 계산 중 오류:', error);
    throw error;
  }
}
