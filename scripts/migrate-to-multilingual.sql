-- 다국어 지원을 위한 데이터 마이그레이션 스크립트
-- 기존 mwd_question 테이블의 텍스트 데이터를 새로운 다국어 테이블로 이전

-- 1. 새로운 테이블들 생성 (Prisma로 이미 생성되었다면 스킵)

-- 2. 기존 질문 데이터를 mwd_question_lang으로 이전
INSERT INTO mwd_question_lang (qu_code, lang_code, qu_text, qu_explain, qu_category)
SELECT 
    qu_code,
    'ko-KR' as lang_code,
    qu_text,
    qu_explain,
    qu_category
FROM mwd_question_temp  -- 기존 테이블을 백업한 테이블명
WHERE qu_text IS NOT NULL;

-- 3. 기존 선택지 데이터를 새로운 구조로 이전
-- 먼저 mwd_question_choice에 기본 데이터 삽입
INSERT INTO mwd_question_choice (qu_code, display_order, weight, an_val, an_use)
SELECT DISTINCT
    qu_code,
    ROW_NUMBER() OVER (PARTITION BY qu_code ORDER BY an_val) as display_order,
    an_wei as weight,
    an_val,
    an_use
FROM mwd_question_choice_temp  -- 기존 선택지 테이블을 백업한 테이블명
WHERE an_use = 'Y';

-- 4. 선택지 텍스트를 mwd_question_choice_lang으로 이전
INSERT INTO mwd_question_choice_lang (choice_id, lang_code, choice_text, choice_desc, choice_sub)
SELECT 
    qc.choice_id,
    'ko-KR' as lang_code,
    qct.an_text as choice_text,
    qct.an_desc as choice_desc,
    qct.an_sub as choice_sub
FROM mwd_question_choice qc
JOIN mwd_question_choice_temp qct ON qc.qu_code = qct.qu_code AND qc.an_val = qct.an_val
WHERE qct.an_text IS NOT NULL;

-- 5. 영어 번역 데이터 추가 (예시)
-- 실제 번역 데이터가 있다면 여기에 추가
/*
INSERT INTO mwd_question_lang (qu_code, lang_code, qu_text, qu_explain, qu_category)
VALUES 
    ('tnd00001', 'en-US', 'I often feel anxious about the future.', 'Personality assessment question', 'Tendency'),
    ('tnd00002', 'en-US', 'I prefer working alone rather than in groups.', 'Personality assessment question', 'Tendency');

INSERT INTO mwd_question_choice_lang (choice_id, lang_code, choice_text)
SELECT 
    qc.choice_id,
    'en-US' as lang_code,
    CASE qc.an_val
        WHEN 1 THEN 'Strongly Agree'
        WHEN 2 THEN 'Agree'
        WHEN 3 THEN 'Somewhat Agree'
        WHEN 4 THEN 'Somewhat Disagree'
        WHEN 5 THEN 'Disagree'
        WHEN 6 THEN 'Strongly Disagree'
    END as choice_text
FROM mwd_question_choice qc
WHERE qc.qu_code LIKE 'tnd%';
*/

-- 6. 데이터 무결성 검증
SELECT 
    'Questions without Korean translation' as check_type,
    COUNT(*) as count
FROM mwd_question q
LEFT JOIN mwd_question_lang ql ON q.qu_code = ql.qu_code AND ql.lang_code = 'ko-KR'
WHERE ql.qu_code IS NULL

UNION ALL

SELECT 
    'Choices without Korean translation' as check_type,
    COUNT(*) as count
FROM mwd_question_choice qc
LEFT JOIN mwd_question_choice_lang qcl ON qc.choice_id = qcl.choice_id AND qcl.lang_code = 'ko-KR'
WHERE qcl.choice_id IS NULL;

-- 7. 기존 컬럼 제거 (주의: 데이터 검증 후 실행)
-- ALTER TABLE mwd_question DROP COLUMN qu_text;
-- ALTER TABLE mwd_question DROP COLUMN qu_explain;
-- ALTER TABLE mwd_question DROP COLUMN qu_category; 