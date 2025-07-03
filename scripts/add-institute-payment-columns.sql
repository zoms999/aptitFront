-- mwd_institute_turn 테이블에 결제 관련 컬럼 추가
-- 기관별 회차 결제 상태 및 미결제 시 검사 허용 여부 관리

-- 컬럼 추가 (이미 존재하는 경우 에러 발생하지만 무시)
DO $$ 
BEGIN 
    -- tur_is_paid 컬럼 추가
    BEGIN
        ALTER TABLE public.mwd_institute_turn 
        ADD COLUMN tur_is_paid char(1) NOT NULL DEFAULT 'N' 
        CHECK (tur_is_paid IN ('Y', 'N'));
    EXCEPTION 
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column tur_is_paid already exists in mwd_institute_turn.';
    END;
    
    -- tur_allow_no_payment 컬럼 추가
    BEGIN
        ALTER TABLE public.mwd_institute_turn 
        ADD COLUMN tur_allow_no_payment char(1) NOT NULL DEFAULT 'N' 
        CHECK (tur_allow_no_payment IN ('Y', 'N'));
    EXCEPTION 
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column tur_allow_no_payment already exists in mwd_institute_turn.';
    END;
END $$;

-- 컬럼에 대한 설명 추가
COMMENT ON COLUMN public.mwd_institute_turn.tur_is_paid IS '회차별 결제 여부 (Y: 결제완료, N: 미결제)';
COMMENT ON COLUMN public.mwd_institute_turn.tur_allow_no_payment IS '미결제 시 검사 허용 여부 (Y: 허용, N: 차단)';

-- 기존 데이터에 대한 기본값 설정 (필요에 따라 조정)
-- 예시: 모든 기존 회차를 미결제로 설정하되, 검사는 허용하도록 설정
UPDATE public.mwd_institute_turn 
SET 
    tur_is_paid = 'N',
    tur_allow_no_payment = 'Y'
WHERE tur_is_paid IS NULL OR tur_allow_no_payment IS NULL;

-- 인덱스 추가 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_mwd_institute_turn_payment 
ON public.mwd_institute_turn (ins_seq, tur_is_paid, tur_allow_no_payment);

-- 확인 쿼리
SELECT 
    ins_seq,
    tur_seq,
    tur_code,
    tur_is_paid,
    tur_allow_no_payment,
    tur_use
FROM public.mwd_institute_turn 
ORDER BY ins_seq, tur_seq; 