import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    // 요청 데이터 로깅
    console.log('회원가입 요청 시작');
    
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
      agreeMarketing
    } = await request.json();

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
      { field: 'agreeTerms', value: agreeTerms, message: '이용약관에 동의해주세요.' }
    ];

    for (const field of requiredFields) {
      if (!field.value) {
        return NextResponse.json(
          { success: false, message: field.message },
          { status: 400 }
        );
      }
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

    console.log('1. 계정 사용 여부 조회 시작');
    // 1. 계정 사용 여부 조회
    try {
      const existingAccount = await db.$queryRaw`
        SELECT ac_use FROM mwd_account WHERE ac_id = ${username.toLowerCase()}
      `;

      if (existingAccount.length > 0) {
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

    console.log('3. 사용자(person) 정보 삽입 시작');
    // 3. 사용자(person) 정보 삽입
    let peSeq;
    try {
      const personResult = await db.$queryRaw`
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
      // 쿼리 로깅
      console.log('계정 정보 삽입 쿼리 파라미터:', {
        username: username.toLowerCase(),
        peSeq,
        agreeTerms,
        agreePrivacy,
        agreeMarketing: agreeMarketing || false
      });
      
      // Boolean 값을 'Y'/'N' 문자로 변환
      const termsUse = agreeTerms ? 'Y' : 'N';
      const termsPerson = agreePrivacy ? 'Y' : 'N';
      const termsEvent = agreeMarketing ? 'Y' : 'N';
      
      console.log('변환된 약관 동의 값:', { termsUse, termsPerson, termsEvent });
      
      const accountResult = await db.$queryRaw`
        INSERT INTO mwd_account (
          ac_id, ac_pw, ac_use, ac_insert_date, ac_leave_date, 
          ac_gid, ins_seq, pe_seq, ac_expire_date,
          ac_terms_use, ac_terms_person, ac_terms_event
        ) VALUES (
          ${username.toLowerCase()}, CRYPT(${password}, GEN_SALT('bf')), 'Y', 
          now(), now(), (SELECT uuid_generate_v4()), 
          -1, ${peSeq}, (SELECT now() + interval '1 month'),
          ${termsUse}, ${termsPerson}, ${termsEvent}
        ) RETURNING ac_gid
      `;

      acGid = accountResult[0].ac_gid;
    } catch (error) {
      console.error('계정 정보 삽입 오류:', error);
      // 쿼리 오류 상세 로깅
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
      } else {
        console.error('알 수 없는 오류 타입:', error);
      }
      throw new Error(`계정 정보 삽입 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    console.log('5. 로그인 기록 삽입 시작');
    // 5. 로그인 기록 삽입
    try {
      // 로그인 기록 쿼리 로깅
      console.log('로그인 기록 삽입 쿼리 파라미터:', {
        userAgent: userAgent || 'Unknown',
        acGid
      });
      
      await db.$queryRaw`
        INSERT INTO mwd_log_login_account (
          login_date, user_agent, ac_gid
        ) VALUES (
          now(), ${userAgent || 'Unknown'}, ${acGid}
        )
      `;
    } catch (error) {
      console.error('로그인 기록 삽입 오류:', error);
      // 로그 오류는 치명적이지 않으므로 계속 진행
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
      }
    }

    console.log('6. 계정 액션 기록 삽입 시작');
    // 6. 계정 액션 기록 삽입
    try {
      // 계정 액션 기록 쿼리 로깅
      console.log('계정 액션 기록 삽입 쿼리 파라미터:', {
        actionType: 'JOIN',
        actionReason: '개인',
        actionResult: 'SUCCESS',
        acGid
      });
      
      await db.$queryRaw`
        INSERT INTO mwd_log_account (
          action_date, action_type, action_reason, action_result, action_func, ac_gid, mg_seq
        ) VALUES (
          now(), 'JOIN', '개인', 'SUCCESS', 'WEB', ${acGid}, -1
        )
      `;
    } catch (error) {
      console.error('계정 액션 기록 삽입 오류:', error);
      // 액션 로그 오류는 치명적이지 않으므로 계속 진행
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
      }
    }

    console.log('회원가입 완료');
    return NextResponse.json({ 
      success: true, 
      message: '회원가입이 완료되었습니다.', 
      userId: username,
      acGid
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '회원가입 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 