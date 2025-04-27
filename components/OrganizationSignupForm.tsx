"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DaumPostcode from 'react-daum-postcode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 폼 데이터 타입 정의
interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  gender: string;
  birthdate: string;
  phone: string;
  additionalPhone: string;
  email: string;
  zipcode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  additionalAddress: string;
  academicGroup: string;
  schoolName: string;
  major: string;
  grade: string;
  jobGroup: string;
  companyName: string;
  jobDescription: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
  sessionCode: string;
  instituteSeq: string;
  turnSeq: string;
}

// 에러 타입 정의
interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  gender?: string;
  birthdate?: string;
  phone?: string;
  email?: string;
  zipcode?: string;
  academicGroup?: string;
  jobGroup?: string;
  agreeTerms?: string;
  agreePrivacy?: string;
  sessionCode?: string;
}

// 학업군 타입 정의
interface Group {
  value: string;
  label: string;
}

const OrganizationSignupForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    gender: '',
    birthdate: '',
    phone: '',
    additionalPhone: '',
    email: '',
    zipcode: '',
    roadAddress: '',
    jibunAddress: '',
    detailAddress: '',
    additionalAddress: '',
    academicGroup: '',
    schoolName: '',
    major: '',
    grade: '',
    jobGroup: '',
    companyName: '',
    jobDescription: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
    sessionCode: '',
    instituteSeq: '',
    turnSeq: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPostcode, setShowPostcode] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeCheckMessage, setCodeCheckMessage] = useState('');

  // 데이터 목록
  const academicGroups: Group[] = [
    { value: 'URE0001', label: '초등학교' },
    { value: 'URE0002', label: '중학교' },
    { value: 'URE0003', label: '고등학교' },
    { value: 'URE0004', label: '고등학교 졸업' },
    { value: 'URE0005', label: '대학 재학중' },
    { value: 'URE0006', label: '대학 중퇴' },
    { value: 'URE0007', label: '대학 수료' },
    { value: 'URE0008', label: '대학 졸업' },
    { value: 'URE0009', label: '대학교 재학중' },
    { value: 'URE0010', label: '대학교 중퇴' },
    { value: 'URE0011', label: '대학교 수료' },
    { value: 'URE0012', label: '대학교 졸업' },
    { value: 'URE0013', label: '대학원 재학' },
    { value: 'URE0014', label: '대학원 중퇴' },
    { value: 'URE0015', label: '대학원 수료' },
    { value: 'URE0016', label: '석사' },
    { value: 'URE0017', label: '박사' }
  ];
  
  const jobGroups: Group[] = [
    { value: 'URJ0001', label: '학생' },
    { value: 'URJ0002', label: '회사원' },
    { value: 'URJ0003', label: '전문직' },
    { value: 'URJ0004', label: '사업가' },
    { value: 'URJ0005', label: '공무원' },
    { value: 'URJ0006', label: '무직' },
    { value: 'URJ0007', label: '기타' }
  ];
  
  const grades: string[] = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '졸업'];

  // 카카오 주소 검색 완료 핸들러
  const handlePostcodeComplete = (data: { zonecode: string; roadAddress: string; jibunAddress?: string; autoJibunAddress?: string }) => {
    setFormData(prev => ({
      ...prev,
      zipcode: data.zonecode,
      roadAddress: data.roadAddress,
      jibunAddress: data.jibunAddress || data.autoJibunAddress || ''
    }));
    setShowPostcode(false);
    toast.success('주소가 입력되었습니다', {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  };

  // 기관 코드 검증 함수
  const verifySessionCode = async () => {
    if (!formData.sessionCode.trim()) {
      setCodeCheckMessage('회차코드를 입력해주세요.');
      setCodeVerified(false);
      toast.error('회차코드를 입력해주세요', {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      // 로딩 토스트 표시
      const loadingToast = toast.loading('회차코드 확인 중...', {
        position: "top-center"
      });

      // 1. 기관 및 차수 정보 조회 (유효성검사)
      // SELECT ins.ins_name, tur.ins_seq, tur.tur_seq, tur.tur_use
      // FROM mwd_institute ins, mwd_institute_turn tur
      // WHERE ins.ins_seq = tur.ins_seq
      //   AND tur_code = $1;
      const response = await fetch('/api/verify-session-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.sessionCode }),
      });

      // 로딩 토스트 제거
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.valid) {
        toast.success('유효한 회차코드입니다', {
          position: "top-center",
          autoClose: 2000,
        });
        setCodeCheckMessage(`${data.instituteName} - 유효한 회차코드입니다.`);
        setCodeVerified(true);
        // 기관 및 차수 정보 저장
        setFormData(prev => ({
          ...prev,
          instituteSeq: data.insSeq,
          turnSeq: data.turSeq
        }));
        setErrors(prev => ({ ...prev, sessionCode: undefined }));
      } else {
        toast.error('소속기관을 확인할 수 없는 회차코드입니다', {
          position: "top-center", 
          autoClose: 3000,
        });
        setCodeCheckMessage('소속기관 미확인');
        setCodeVerified(false);
        setErrors(prev => ({ ...prev, sessionCode: '유효하지 않은 회차코드입니다.' }));
      }
    } catch (error) {
      const errorMessage = error as Error;
      toast.error(`확인 중 오류 발생: ${errorMessage.message || '알 수 없는 오류'}`, {
        position: "top-center",
        autoClose: 3000,
      });
      setCodeCheckMessage(`회차코드 확인 중 오류가 발생했습니다`);
      setCodeVerified(false);
      setErrors(prev => ({ ...prev, sessionCode: '회차코드 확인 중 오류가 발생했습니다.' }));
    }
  };

  // 아이디 중복 검사
  const checkUsername = async () => {
    if (!formData.username) {
      toast.error('아이디를 입력해주세요', {
        position: "top-center",
        autoClose: 3000,
      });
      setUsernameCheckMessage('아이디를 입력해주세요.');
      setUsernameChecked(false);
      return;
    }

    if (formData.username.length < 6 || !/^[a-zA-Z0-9]+$/.test(formData.username)) {
      toast.error('아이디는 6자 이상, 영문과 숫자만 사용 가능합니다', {
        position: "top-center",
        autoClose: 3000,
      });
      setUsernameCheckMessage('아이디는 6자 이상, 영문과 숫자만 사용 가능합니다.');
      setUsernameChecked(false);
      return;
    }

    try {
      // 토스트 메시지로 로딩 상태 표시
      const loadingToast = toast.loading('아이디 확인 중...', {
        position: "top-center"
      });

      // 2. 계정 사용 여부 확인 (중복검사)
      // SELECT ac_use FROM mwd_account WHERE ac_id = lower($1);
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: formData.username.toLowerCase() }),
      });

      // 로딩 토스트 업데이트
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.available) {
        toast.success('사용 가능한 아이디입니다', {
          position: "top-center",
          autoClose: 2000,
        });
        setUsernameCheckMessage('사용 가능한 아이디입니다.');
        setUsernameChecked(true);
      } else {
        toast.error('이미 사용 중인 아이디입니다', {
          position: "top-center", 
          autoClose: 3000,
        });
        setUsernameCheckMessage('이미 사용 중인 아이디입니다.');
        setUsernameChecked(false);
      }
    } catch (error) {
      const errorMessage = error as Error;
      toast.error(`확인 중 오류 발생: ${errorMessage.message || '알 수 없는 오류'}`, {
        position: "top-center",
        autoClose: 3000,
      });
      setUsernameCheckMessage(`아이디 확인 중 오류가 발생했습니다`);
      setUsernameChecked(false);
    }
  };

  // 입력 필드 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 진행 상태 표시 컴포넌트
  const ProgressBar = () => {
    const steps = ['기관 확인', '기본 정보', '주소 정보', '학업/직업 정보', '약관 동의'];
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`text-xs font-medium ${
                index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300" 
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  // 다음 단계로 이동 함수
  const nextStep = () => {
    let canProceed = true;
    const newErrors: FormErrors = {};
    
    // 단계별 유효성 검사
    if (currentStep === 1) {
      // 기관 코드 검사
      if (!codeVerified) {
        newErrors.sessionCode = '기관 회차코드 확인이 필요합니다.';
        canProceed = false;
      }
    } else if (currentStep === 2) {
      // 기본 정보 검사
      if (!usernameChecked) {
        newErrors.username = '아이디 중복 확인을 해주세요.';
        canProceed = false;
      }
      if (formData.password.length < 6 || !/^[a-zA-Z0-9]+$/.test(formData.password)) {
        newErrors.password = '비밀번호는 6자 이상, 영문과 숫자만 사용 가능합니다.';
        canProceed = false;
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        canProceed = false;
      }
      if (!formData.name.trim()) {
        newErrors.name = '이름을 입력해주세요.';
        canProceed = false;
      }
      if (!formData.gender) {
        newErrors.gender = '성별을 선택해주세요.';
        canProceed = false;
      }
      if (!formData.birthdate) {
        newErrors.birthdate = '생년월일을 입력해주세요.';
        canProceed = false;
      }
      if (!formData.phone || !/^\d+$/.test(formData.phone)) {
        newErrors.phone = '휴대전화는 숫자만 입력 가능합니다.';
        canProceed = false;
      }
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = '유효한 이메일 주소를 입력해주세요.';
        canProceed = false;
      }
    } else if (currentStep === 3) {
      // 주소 정보 검사
      if (!formData.zipcode || !formData.roadAddress) {
        newErrors.zipcode = '주소를 입력해주세요.';
        canProceed = false;
      }
    } else if (currentStep === 4) {
      // 학업/직업 정보 검사
      if (!formData.academicGroup) {
        newErrors.academicGroup = '학업군을 선택해주세요.';
        canProceed = false;
      }
      if (!formData.jobGroup) {
        newErrors.jobGroup = '직업군을 선택해주세요.';
        canProceed = false;
      }
    }
    
    setErrors(newErrors);
    
    if (canProceed) {
      setCurrentStep(prev => prev + 1);
      // 단계 이동 시 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // 토스트 메시지로 안내
      toast.success('다음 단계로 이동합니다', {
        position: "top-center",
        autoClose: 1500,
      });
    } else {
      toast.error('필수 정보를 모두 입력해주세요', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };
  
  // 이전 단계로 이동 함수
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    // 단계 이동 시 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      toast.error('필수 약관에 동의해주세요', {
        position: "top-center",
        autoClose: 3000,
      });
      setErrors(prev => ({ 
        ...prev, 
        agreeTerms: !formData.agreeTerms ? '이용약관에 동의해주세요.' : undefined,
        agreePrivacy: !formData.agreePrivacy ? '개인정보 처리방침에 동의해주세요.' : undefined
      }));
      return;
    }
    
    if (validateForm()) {
      try {
        setIsSubmitting(true);
        // 로딩 토스트 표시
        const loadingToast = toast.loading('회원가입 처리 중...', {
          position: "top-center"
        });
        
        // 전체 폼 데이터 준비
        const signupData = {
          // 개인 정보
          email: formData.email,
          name: formData.name,
          birthdate: formData.birthdate,
          gender: formData.gender,
          phone: formData.phone,
          additionalPhone: formData.additionalPhone,
          zipcode: formData.zipcode,
          roadAddress: formData.roadAddress,
          jibunAddress: formData.jibunAddress,
          detailAddress: formData.detailAddress,
          additionalAddress: formData.additionalAddress,
          academicGroup: formData.academicGroup,
          schoolName: formData.schoolName,
          major: formData.major,
          grade: formData.grade,
          jobGroup: formData.jobGroup,
          companyName: formData.companyName,
          jobDescription: formData.jobDescription,
          
          // 계정 정보
          username: formData.username.toLowerCase(),
          password: formData.password,
          agreeTerms: formData.agreeTerms,
          agreePrivacy: formData.agreePrivacy,
          agreeMarketing: formData.agreeMarketing,
          
          // 기관 정보
          instituteSeq: formData.instituteSeq,
          turnSeq: formData.turnSeq,
          
          // 유형
          type: 'organization'
        };

        // API 호출
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupData),
        });

        const data = await response.json();

        // 로딩 토스트 제거
        toast.dismiss(loadingToast);

        if (data.success) {
          console.log('회원가입 성공:', data);
          
          // 성공 토스트 메시지 표시
          toast.success('기관 회원가입이 완료되었습니다! 결제 페이지로 이동합니다.', {
            position: "top-center",
            autoClose: 2000,
          });
          
          // 잠시 후 결제 페이지로 이동
          setTimeout(() => {
            router.push(`/payment?acGid=${data.acGid}`);
          }, 2000);
        } else {
          // 에러 메시지 표시
          console.error('회원가입 실패:', data.message, data.error);
          toast.error(data.message || '회원가입에 실패했습니다', {
            position: "top-center",
            autoClose: 3000,
          });
          setErrors({
            username: data.message + (data.error ? ` (${data.error})` : '')
          });
        }
      } catch (error) {
        console.error('회원가입 오류:', error);
        toast.error('회원가입 처리 중 오류가 발생했습니다', {
          position: "top-center",
          autoClose: 3000,
        });
        setErrors({
          username: '회원가입 요청 중 오류가 발생했습니다.'
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // 유효성 검사 실패 시 토스트 메시지
      toast.error('입력 정보를 확인해주세요', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  // 전체 폼 유효성 검사
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // 기본 정보 검증
    if (!usernameChecked) {
      newErrors.username = '아이디 중복 확인을 해주세요.';
    }
    
    if (formData.password.length < 6 || !/^[a-zA-Z0-9]+$/.test(formData.password)) {
      newErrors.password = '비밀번호는 6자 이상, 영문과 숫자만 사용 가능합니다.';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요.';
    }
    
    if (!formData.birthdate) {
      newErrors.birthdate = '생년월일을 입력해주세요.';
    }
    
    if (!formData.phone || !/^\d+$/.test(formData.phone)) {
      newErrors.phone = '휴대전화는 숫자만 입력 가능합니다.';
    }
    
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }
    
    if (!formData.zipcode || !formData.roadAddress) {
      newErrors.zipcode = '주소를 입력해주세요.';
    }
    
    if (!formData.academicGroup) {
      newErrors.academicGroup = '학업군을 선택해주세요.';
    }
    
    if (!formData.jobGroup) {
      newErrors.jobGroup = '직업군을 선택해주세요.';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '이용약관에 동의해주세요.';
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = '개인정보 처리방침에 동의해주세요.';
    }
    
    if (!codeVerified) {
      newErrors.sessionCode = '기관 회차코드 확인이 필요합니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{ 
          fontFamily: 'sans-serif',
          borderRadius: '8px',
          fontSize: '14px'
        }}
      />

      <ProgressBar />
      
      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* 단계 1: 기관 확인 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">기관 확인</h3>
            
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col space-y-2">
                <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700">
                  소속 기관에서 발급받으신 회차코드를 입력하여 주십시오. <span className="text-red-600">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="sessionCode"
                    name="sessionCode"
                    value={formData.sessionCode}
                    onChange={handleChange}
                    className={`flex-1 px-3 py-2 border ${errors.sessionCode ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={verifySessionCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    유효성 검사
                  </button>
                </div>
                {codeCheckMessage && (
                  <p className={`mt-1 text-sm ${codeVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {codeCheckMessage}
                  </p>
                )}
                {errors.sessionCode && <p className="mt-1 text-sm text-red-600">{errors.sessionCode}</p>}
              </div>
            </div>
          </div>
        )}

        {/* 단계 2: 기본 정보 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">기본 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 아이디 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  아이디 <span className="text-red-600">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="6자 이상, 영문과 숫자만 사용가능"
                  />
                  <button
                    type="button"
                    onClick={checkUsername}
                    className="mt-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap transition-colors"
                  >
                    중복확인
                  </button>
                </div>
                {usernameCheckMessage && <p className={`mt-1 text-sm ${usernameChecked ? 'text-green-600' : 'text-red-600'}`}>{usernameCheckMessage}</p>}
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>
              
              {/* 이름 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              {/* 비밀번호 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="6자 이상, 영문과 숫자만 사용가능"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
              
              {/* 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인 <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
              
              {/* 성별 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성별 <span className="text-red-600">*</span>
                </label>
                <div className="mt-1 flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">남성</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">여성</span>
                  </label>
                </div>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>
              
              {/* 생년월일 */}
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                  생년월일 <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.birthdate && <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>}
              </div>
              
              {/* 휴대전화 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  휴대전화 <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="'-' 없이 숫자만 입력"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
              
              {/* 추가 연락처 */}
              <div>
                <label htmlFor="additionalPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  추가 연락처
                </label>
                <input
                  type="tel"
                  id="additionalPhone"
                  name="additionalPhone"
                  value={formData.additionalPhone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="'-' 없이 숫자만 입력"
                />
              </div>
              
              {/* 이메일 */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 주소 <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이메일 수신이 안되면, 아이디 또는 비밀번호 찾기가 불가능 합니다"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>
          </div>
        )}

        {/* 단계 3: 주소 정보 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">주소 정보</h3>
            <p className="text-sm text-gray-600 mb-4">결과지가 우편으로 발송되오니, 정확히 입력하여 주시기 바랍니다.</p>
            
            <div className="space-y-6">
              {/* 우편번호 및 주소 검색 */}
              <div>
                <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
                  우편번호 <span className="text-red-600">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="zipcode"
                    name="zipcode"
                    value={formData.zipcode}
                    readOnly
                    className="mt-1 block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPostcode(true)}
                    className="mt-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap transition-colors"
                  >
                    주소찾기
                  </button>
                </div>
                {errors.zipcode && <p className="mt-1 text-sm text-red-600">{errors.zipcode}</p>}
              </div>
              
              {/* 도로명 주소 */}
              <div>
                <label htmlFor="roadAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  도로명 주소 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="roadAddress"
                  name="roadAddress"
                  value={formData.roadAddress}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
              
              {/* 지번 주소 */}
              <div>
                <label htmlFor="jibunAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  지번 주소
                </label>
                <input
                  type="text"
                  id="jibunAddress"
                  name="jibunAddress"
                  value={formData.jibunAddress}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
              
              {/* 상세주소 */}
              <div>
                <label htmlFor="detailAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  상세주소
                </label>
                <input
                  type="text"
                  id="detailAddress"
                  name="detailAddress"
                  value={formData.detailAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="상세주소를 입력해주세요"
                />
              </div>
              
              {/* 추가주소 */}
              <div>
                <label htmlFor="additionalAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  추가주소
                </label>
                <input
                  type="text"
                  id="additionalAddress"
                  name="additionalAddress"
                  value={formData.additionalAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="추가 정보를 입력해주세요 (동, 호수 등)"
                />
              </div>
            </div>

            {/* 주소 검색 모달 */}
            {showPostcode && (
              <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium">주소 검색</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowPostcode(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <DaumPostcode
                      onComplete={handlePostcodeComplete}
                      style={{ height: 400 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 단계 4: 학업/직업 정보 */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">현재 (최종) 학력 & 현재 직업 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 학업군 */}
              <div>
                <label htmlFor="academicGroup" className="block text-sm font-medium text-gray-700 mb-1">
                  학업군 <span className="text-red-600">*</span>
                </label>
                <select
                  id="academicGroup"
                  name="academicGroup"
                  value={formData.academicGroup}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">--- 선택 ---</option>
                  {academicGroups.map(group => (
                    <option key={group.value} value={group.value}>{group.label}</option>
                  ))}
                </select>
                {errors.academicGroup && <p className="mt-1 text-sm text-red-600">{errors.academicGroup}</p>}
              </div>
              
              {/* 직업군 */}
              <div>
                <label htmlFor="jobGroup" className="block text-sm font-medium text-gray-700 mb-1">
                  직업군 <span className="text-red-600">*</span>
                </label>
                <select
                  id="jobGroup"
                  name="jobGroup"
                  value={formData.jobGroup}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">--- 선택 ---</option>
                  {jobGroups.map(group => (
                    <option key={group.value} value={group.value}>{group.label}</option>
                  ))}
                </select>
                {errors.jobGroup && <p className="mt-1 text-sm text-red-600">{errors.jobGroup}</p>}
              </div>
              
              {/* 학교명 */}
              <div>
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                  학교명
                </label>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* 직장명 */}
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  직장명
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* 전공 */}
              <div>
                <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
                  전공
                </label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* 학년 */}
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                  학년
                </label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택해주세요</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              
              {/* 하는 일 */}
              <div className="md:col-span-2">
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  하는 일(업무에 대한 간단 서술)
                </label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  rows={3}
                  value={formData.jobDescription}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 단계 5: 약관 동의 */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">약관 및 개인정보 활용 동의</h3>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="agreeTerms" className="font-medium text-gray-700">
                    이용약관에 동의합니다. <span className="text-red-600">*</span>
                  </label>
                  <div className="mt-3 text-sm">
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 underline transition-colors"
                      onClick={() => toast.info('이용약관 상세 내용은 준비 중입니다', {
                        position: "top-center"
                      })}
                    >
                      이용약관 보기
                    </button>
                  </div>
                  {errors.agreeTerms && <p className="mt-1 text-sm text-red-600">{errors.agreeTerms}</p>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreePrivacy"
                    name="agreePrivacy"
                    type="checkbox"
                    checked={formData.agreePrivacy}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="agreePrivacy" className="font-medium text-gray-700">
                    개인정보 수집, 이용에 동의합니다. <span className="text-red-600">*</span>
                  </label>
                  <p className="text-gray-500 mt-1">개인정보는 회원 관리, 서비스 제공 및 개선을 위해 사용됩니다.</p>
                  <div className="mt-3 text-sm">
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 underline transition-colors"
                      onClick={() => toast.info('개인정보 처리방침 상세 내용은 준비 중입니다', {
                        position: "top-center"
                      })}
                    >
                      개인정보 처리방침 보기
                    </button>
                  </div>
                  {errors.agreePrivacy && <p className="mt-1 text-sm text-red-600">{errors.agreePrivacy}</p>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeMarketing"
                    name="agreeMarketing"
                    type="checkbox"
                    checked={formData.agreeMarketing}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="agreeMarketing" className="font-medium text-gray-700">
                    알림 수신에 동의합니다. (선택)
                  </label>
                  <p className="text-gray-500 mt-1">서비스 업데이트, 이벤트 및 프로모션 정보를 받아보실 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              이전
            </button>
          )}
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className={`ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${currentStep === 1 && !codeVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={currentStep === 1 && !codeVerified}
            >
              다음
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리중...' : '가입하기'}
            </button>
          )}
        </div>
      </form>
    </>
  );
};

export default OrganizationSignupForm;