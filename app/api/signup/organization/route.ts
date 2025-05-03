import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db/prisma';

// 응답 타입 정의
interface InstituteInfo {
  ins_seq: number;
  tur_seq: number;
  tur_use: string;
  tur_req_sum: number;
  tur_use_sum: number;
}

interface AccountInfo {
  ac_use: string;
}

export async function POST(request: NextRequest) {
  try {
    // 요청 데이터 로깅
    console.log('기관 회원가입 요청 시작');
    
    const {
      username,
      password,
      name,
      gender,
      birthdate,
      phone,
      additionalPhone,
      email,
      zipcode,
      roadAddress,
      jibunAddress,
      detailAddress,
      additionalAddress,
      academicGroup,
      schoolName,
      major,
      grade,
      jobGroup,
      companyName,
      jobDescription,
      userAgent,
      agreeTerms,
      agreePrivacy,
      agreeMarketing,
      instituteSeq: requestInstituteSeq,
      turnSeq: requestTurnSeq
    } = await request.json();

    // 쿠키에서 기관 정보 가져오기
    const instituteSeqCookie = request.cookies.get('institute_seq');
    const turnSeqCookie = request.cookies.get('turn_seq');
    
    // 요청 데이터와 쿠키 데이터 중 하나 선택
    const instituteSeq = requestInstituteSeq || (instituteSeqCookie ? parseInt(instituteSeqCookie.value) : null);
    const turnSeq = requestTurnSeq || (turnSeqCookie ? parseInt(turnSeqCookie.value) : null);
    
    // 모든 쿠키 로깅
    const allCookies = request.cookies.getAll();
    console.log('모든 쿠키:', allCookies.map(cookie => `${cookie.name}=${cookie.value}`));
    
    // 기관 정보 로깅
    console.log('기관 정보:', { 
      instituteSeq, 
      turnSeq, 
      requestInstituteSeq, 
      requestTurnSeq,
      instituteSeqCookie: instituteSeqCookie?.value,
      turnSeqCookie: turnSeqCookie?.value,
      headers: {
        cookie: request.headers.get('cookie')
      }
    });

    // 필수 필드 검증
    const requiredFields = [
      { field: 'username', value: username, message: '아이디를 입력해주세요.' },
      { field: 'password', value: password, message: '비밀번호를 입력해주세요.' },
      { field: 'name', value: name, message: '이름을 입력해주세요.' },
      { field: 'gender', value: gender, message: '성별을 선택해주세요.' },
      { field: 'birthdate', value: birthdate, message: '생년월일을 입력해주세요.' },
      { field: 'phone', value: phone, message: '휴대폰 번호를 입력해주세요.' },
      { field: 'email', value: email, message: '이메일을 입력해주세요.' },
      { field: 'zipcode', value: zipcode, message: '우편번호를 입력해주세요.' },
      { field: 'roadAddress', value: roadAddress, message: '주소를 입력해주세요.' },
      { field: 'academicGroup', value: academicGroup, message: '학업군을 선택해주세요.' },
      { field: 'jobGroup', value: jobGroup, message: '직업군을 선택해주세요.' },
      { field: 'agreeTerms', value: agreeTerms, message: '이용약관에 동의해주세요.' },
      { field: 'agreePrivacy', value: agreePrivacy, message: '개인정보 처리방침에 동의해주세요.' }
      // instituteSeq와 turnSeq는 쿠키에서 가져올 수 있으므로 여기서 검증하지 않음
    ];

    for (const field of requiredFields) {
      // Boolean 타입 필드는 false 값이 유효한 값이므로 undefined/null만 체크
      if (field.field === 'agreeTerms' || field.field === 'agreePrivacy' || field.field === 'agreeMarketing') {
        if (field.value === undefined || field.value === null) {
          return NextResponse.json(
            { success: false, message: field.message },
            { status: 400 }
          );
        }
      } else if (!field.value && field.value !== 0) { // 0은 유효한 숫자 값이므로 허용
        return NextResponse.json(
          { success: false, message: field.message },
          { status: 400 }
        );
      }
    }

    // 기관 정보 검증
    if (!instituteSeq || !turnSeq) {
      return NextResponse.json(
        { 
          success: false, 
          message: '기관 정보가 없습니다. 회차코드를 다시 확인해주세요.',
          instituteSeq,
          turnSeq
        },
        { status: 400 }
      );
    }

    // 약관 동의 여부 확인
    if (!agreeTerms) {
      return NextResponse.json(
        { success: false, message: '이용약관에 동의해주세요.' },
        { status: 400 }
      );
    }

    if (!agreePrivacy) {
      return NextResponse.json(
        { success: false, message: '개인정보 처리방침에 동의해주세요.' },
        { status: 400 }
      );
    }

    // 문자열 필드 길이 검증 및 조정
    // 스키마 길이 제한에 맞게 값을 자르기
    const truncatedValues = {
      name: name?.substring(0, 50),
      phone: phone?.substring(0, 20),
      additionalPhone: (additionalPhone || '')?.substring(0, 20),
      email: email?.substring(0, 100),
      zipcode: zipcode?.substring(0, 20),
      roadAddress: roadAddress?.substring(0, 100),
      jibunAddress: (jibunAddress || '')?.substring(0, 100),
      detailAddress: (detailAddress || '')?.substring(0, 100),
      additionalAddress: (additionalAddress || '')?.substring(0, 100),
      schoolName: (schoolName || '')?.substring(0, 50),
      major: (major || '')?.substring(0, 50),
      grade: (grade || '')?.substring(0, 10),
      companyName: (companyName || '')?.substring(0, 50),
      jobDescription: (jobDescription || '')?.substring(0, 100)
    };

    // 이메일 검증
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { success: false, message: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 전화번호 검증
    if (!/^\d+$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: '휴대폰 번호는 숫자만 입력 가능합니다.' },
        { status: 400 }
      );
    }

    console.log('1. 계정 사용 여부 조회 시작');
    // 1. 계정 사용 여부 조회
    try {
      const existingAccount = await db.$queryRaw<AccountInfo[]>`
        SELECT ac_use FROM mwd_account WHERE ac_id = ${username.toLowerCase()}
      `;

      if (existingAccount && existingAccount.length > 0) {
        return NextResponse.json(
          { success: false, message: '이미 사용 중인 아이디입니다.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('계정 사용 여부 조회 오류:', error);
      throw new Error(`계정 조회 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 생년월일 파싱 (YYYY-MM-DD 형식으로 가정)
    let birthYear = 0, birthMonth = 0, birthDay = 0;
    try {
      const birthParts = birthdate.split('-');
      birthYear = parseInt(birthParts[0]);
      birthMonth = parseInt(birthParts[1]);
      birthDay = parseInt(birthParts[2]);
      
      if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
        throw new Error('생년월일 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('생년월일 파싱 오류:', error);
      return NextResponse.json(
        { success: false, message: '생년월일 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // gender 값을 데이터베이스에 맞게 변환 (male -> M, female -> F)
    const genderValue = gender === 'male' ? 'M' : (gender === 'female' ? 'F' : gender);
    if (genderValue !== 'M' && genderValue !== 'F') {
      return NextResponse.json(
        { success: false, message: '성별 값이 올바르지 않습니다. (M 또는 F로 설정해주세요)' },
        { status: 400 }
      );
    }

    console.log('2. 기관 및 차수 정보 확인 시작');
    // 2. 기관 정보 확인
    console.log('기관 정보 확인 - 입력값:', { instituteSeq, turnSeq, 타입: typeof instituteSeq });
    try {
      const instituteResult = await db.$queryRaw<InstituteInfo[]>`
        SELECT ins_seq, tur_seq, tur_use, tur_req_sum, tur_use_sum
        FROM mwd_institute_turn
        WHERE ins_seq = ${instituteSeq} AND tur_seq = ${turnSeq}
      `;
      
      if (!instituteResult || instituteResult.length === 0) {
        return NextResponse.json(
          { success: false, message: '유효하지 않은 기관 정보입니다.' },
          { status: 400 }
        );
      }
      
      const instituteInfo = instituteResult[0];
      
      if (instituteInfo.tur_use !== 'Y') {
        return NextResponse.json(
          { success: false, message: '사용 중지된 기관 회차입니다.' },
          { status: 400 }
        );
      }
      
      if (instituteInfo.tur_use_sum >= instituteInfo.tur_req_sum) {
        return NextResponse.json(
          { success: false, message: '해당 기관 회차의 신청 가능 인원이 초과되었습니다.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('기관 정보 확인 오류:', error);
      throw new Error(`기관 정보 확인 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    console.log('3. 사용자(person) 정보 삽입 시작');
    // 3. 사용자(person) 정보 삽입
    let peSeq;
    try {
      const personResult = await db.$queryRaw<{pe_seq: number}[]>`
        INSERT INTO mwd_person (
          pe_seq, pe_email, pe_name, pe_birth_year, pe_birth_month, pe_birth_day, pe_sex,
          pe_cellphone, pe_contact, pe_postcode, pe_road_addr, pe_jibun_addr, pe_detail_addr,
          pe_extra_addr, pe_ur_education, pe_school_name, pe_school_major, pe_school_year,
          pe_ur_job, pe_job_name, pe_job_detail
        ) VALUES (
          (SELECT NEXTVAL('pe_seq')), ${truncatedValues.email}, ${truncatedValues.name}, 
          ${birthYear}, ${birthMonth}, ${birthDay}, ${genderValue}, 
          ${truncatedValues.phone}, ${truncatedValues.additionalPhone}, 
          ${truncatedValues.zipcode}, ${truncatedValues.roadAddress}, 
          ${truncatedValues.jibunAddress}, ${truncatedValues.detailAddress},
          ${truncatedValues.additionalAddress}, ${academicGroup}, 
          ${truncatedValues.schoolName}, ${truncatedValues.major}, ${truncatedValues.grade},
          ${jobGroup}, ${truncatedValues.companyName}, ${truncatedValues.jobDescription}
        ) RETURNING pe_seq
      `;

      peSeq = personResult[0].pe_seq;
    } catch (error) {
      console.error('사용자 정보 삽입 오류:', error);
      throw new Error(`사용자 정보 삽입 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    console.log('4. 계정(account) 정보 삽입 시작');
    // 4. 계정(account) 정보 삽입
    let acGid;
    try {
      // Boolean 값을 'Y'/'N' 문자로 변환
      const termsUse = agreeTerms ? 'Y' : 'N';
      const termsPerson = agreePrivacy ? 'Y' : 'N';
      const termsEvent = agreeMarketing ? 'Y' : 'N';
      
      const accountResult = await db.$queryRaw<{ac_gid: string}[]>`
        INSERT INTO mwd_account (
          ac_gid, ac_id, ac_pw, ac_expire_date, ac_insert_date, ac_leave_date, 
          ac_use, ins_seq, pe_seq, 
          ac_terms_use, ac_terms_person, ac_terms_event
        ) VALUES (
          (SELECT uuid_generate_v4()), lower(${username}), CRYPT(${password}, GEN_SALT('bf')), 
          (SELECT now() + interval '1 month'), now(), now(), 
          'Y', ${instituteSeq}, ${peSeq}, 
          ${termsUse}, ${termsPerson}, ${termsEvent}
        ) RETURNING ac_gid
      `;

      acGid = accountResult[0].ac_gid;
    } catch (error) {
      console.error('계정 정보 삽입 오류:', error);
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
      }
      throw new Error(`계정 정보 삽입 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    console.log('5. 로그인 기록 삽입 시작');
    // 5. 로그인 기록 삽입
    try {
      await db.$queryRaw`
        INSERT INTO mwd_log_login_account (
          login_date, user_agent, ac_gid
        ) VALUES (
          now(), ${JSON.stringify(userAgent || { ua: 'Unknown' })}::json, ${acGid}::uuid
        )
      `;
    } catch (error) {
      console.error('로그인 기록 삽입 오류:', error);
      // 로그 오류는 치명적이지 않으므로 계속 진행
    }

    console.log('6. 계정 액션 기록 삽입 시작');
    // 6. 계정 액션 기록 삽입
    try {
      await db.$queryRaw`
        INSERT INTO mwd_log_account (
          action_date, action_type, action_reason, action_result, action_func, ac_gid, mg_seq
        ) VALUES (
          now(), 'I', '기관', 'true', '/account/insert', ${acGid}::uuid, -1
        )
      `;
    } catch (error) {
      console.error('계정 액션 기록 삽입 오류:', error);
      // 액션 로그 오류는 치명적이지 않으므로 계속 진행
    }

    console.log('7. 기관 차수에 회원 등록 시작');
    // 7. 기관 차수에 회원 등록
    try {
      // 차수 사용 수량 업데이트
      await db.$queryRaw`
        UPDATE mwd_institute_turn
        SET tur_use_sum = tur_use_sum + 1
        WHERE tur_use = 'Y'
          AND tur_use_sum < tur_req_sum
          AND ins_seq = ${instituteSeq}
          AND tur_seq = ${turnSeq}
      `;

      // 기관 차수에 회원 등록
      await db.$queryRaw`
        INSERT INTO mwd_institute_member (
          ins_seq, tur_seq, pe_seq, mem_insert_date
        ) VALUES (
          ${instituteSeq}, ${turnSeq}, ${peSeq}, now()
        )
      `;
    } catch (error) {
      console.error('기관 차수에 회원 등록 오류:', error);
      throw new Error(`기관 차수에 회원 등록 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    console.log('8. 선택 결과 저장 시작');
    // 8. 선택 결과 저장
    try {
      await db.$queryRaw`
        INSERT INTO mwd_choice_result (
          ac_gid, cr_seq, cr_pay, cr_duty, cr_study, cr_subject, cr_image,
          pd_kind, pd_price, cr_paymentdate, pd_num, ins_seq, tur_seq
        ) VALUES (
          ${acGid}::uuid, (SELECT NEXTVAL('cr_seq')), 'Y', 'Y', 'Y', 'Y', 'Y',
          'premium', 0, now(), 10010::int2, ${instituteSeq}, ${turnSeq}
        )
      `;
    } catch (error) {
      console.error('선택 결과 저장 오류:', error);
      throw new Error(`선택 결과 저장 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    console.log('기관 회원가입 완료');
    return NextResponse.json({ 
      success: true, 
      message: '기관 회원가입이 완료되었습니다.', 
      userId: username,
      acGid
    });
  } catch (error) {
    console.error('기관 회원가입 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '기관 회원가입 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}