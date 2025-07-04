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
}

const SignupForm = () => {
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
    agreeTerms: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPostcode, setShowPostcode] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // 테스트 데이터 로드 함수
  const loadTestData = () => {
    const testData = {
      username: 'testuser',
      password: '111111',
      confirmPassword: '111111',
      name: '테스트 사용자',
      gender: 'male',
      birthdate: '1990-01-01',
      phone: '01012345678',
      additionalPhone: '01087654321',
      email: 'test@example.com',
      zipcode: '06141',
      roadAddress: '서울특별시 강남구 테헤란로 123',
      jibunAddress: '서울특별시 강남구 역삼동 123-45',
      detailAddress: '테스트 빌딩 101호',
      additionalAddress: '(역삼동)',
      academicGroup: 'URE0012',
      schoolName: '테스트대학교',
      major: '컴퓨터공학',
      grade: '4학년',
      jobGroup: 'URJ0002',
      companyName: '테스트 회사',
      jobDescription: '웹 개발자',
      agreeTerms: true
    };
    
    setFormData(testData);
    setUsernameChecked(true);
    setUsernameCheckMessage('사용 가능한 아이디입니다.');
    
    toast.success('테스트 데이터가 로드되었습니다! 이제 다음 단계로 이동하세요.', {
      position: "top-center",
      autoClose: 2000,
    });
  };

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

    try {
      // 토스트 메시지로 로딩 상태 표시
      const loadingToast = toast.loading('아이디 확인 중...', {
        position: "top-center"
      });

      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: formData.username }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 로딩 토스트 업데이트
      toast.dismiss(loadingToast);
      
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
      setUsernameCheckMessage(`아이디 확인 중 오류가 발생했습니다: ${errorMessage.message || errorMessage}`);
      setUsernameChecked(false);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // 아이디 검증
    if (formData.username.length < 6 || !/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = '아이디는 6자 이상, 영문과 숫자만 사용 가능합니다.';
    }
    
    // 비밀번호 검증
    if (formData.password.length < 6 || !/^[a-zA-Z0-9]+$/.test(formData.password)) {
      newErrors.password = '비밀번호는 6자 이상, 영문과 숫자만 사용 가능합니다.';
    }
    
    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    // 성별 검증
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요.';
    }
    
    // 생년월일 검증
    if (!formData.birthdate) {
      newErrors.birthdate = '생년월일을 입력해주세요.';
    }
    
    // 휴대전화 검증
    if (!formData.phone || !/^\d+$/.test(formData.phone)) {
      newErrors.phone = '휴대전화는 숫자만 입력 가능합니다.';
    }
    
    // 이메일 검증
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }
    
    // 주소 검증
    if (!formData.zipcode || !formData.roadAddress) {
      newErrors.zipcode = '주소를 입력해주세요.';
    }
    
    // 학업/직업 정보 검증
    if (!formData.academicGroup) {
      newErrors.academicGroup = '학업군을 선택해주세요.';
    }
    
    if (!formData.jobGroup) {
      newErrors.jobGroup = '직업군을 선택해주세요.';
    }
    
    // 약관 동의 검증
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '약관에 동의해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usernameChecked) {
      toast.error('아이디 중복 확인을 해주세요', {
        position: "top-center",
        autoClose: 3000,
      });
      setErrors(prev => ({ ...prev, username: '아이디 중복 확인을 해주세요.' }));
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
          username: formData.username,
          password: formData.password,
          name: formData.name,
          gender: formData.gender,
          birthdate: formData.birthdate,
          phone: formData.phone,
          additionalPhone: formData.additionalPhone,
          email: formData.email,
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
          userAgent: navigator.userAgent,
          agreeTerms: formData.agreeTerms,
          agreePrivacy: formData.agreeTerms, // 같은 체크박스 사용 (필요시 분리)
          agreeMarketing: formData.agreeTerms // 같은 체크박스 사용 (필요시 분리)
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
          toast.success('회원가입이 완료되었습니다! 메인페이지로 이동합니다.', {
            position: "top-center",
            autoClose: 2000,
          });
          
          // 잠시 후 메인페이지로 이동
          setTimeout(() => {
            window.location.href = '/';
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

  const academicGroups = [
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
  
  const jobGroups = [
    { value: 'URJ0001', label: '학생' },
    { value: 'URJ0002', label: '회사원' },
    { value: 'URJ0003', label: '전문직' },
    { value: 'URJ0004', label: '사업가' },
    { value: 'URJ0005', label: '공무원' },
    { value: 'URJ0006', label: '무직' },
    { value: 'URJ0007', label: '기타' }
  ];
  
  const grades = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '졸업'];

  // 다음 단계로 이동 함수
  const nextStep = () => {
    let canProceed = true;
    const newErrors: FormErrors = {};
    
    // 단계별 유효성 검사
    if (currentStep === 1) {
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
    } else if (currentStep === 2) {
      // 주소 정보 검사
      if (!formData.zipcode || !formData.roadAddress) {
        newErrors.zipcode = '주소를 입력해주세요.';
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

  // 진행 상태 표시 컴포넌트
  const ProgressBar = () => {
    const steps = ['기본 정보', '주소 정보', '학업/직업 정보', '약관 동의'];
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

      {/* 테스트 데이터 로드 버튼 */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={loadTestData}
          className="py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
        >
          테스트 데이터 로드
        </button>
      </div>

      <ProgressBar />
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 단계 1: 기본 정보 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">기본 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 아이디 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <span className="ml-2 text-gray-700 dark:text-gray-300">남성</span>
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
                    <span className="ml-2 text-gray-700 dark:text-gray-300">여성</span>
                  </label>
                </div>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>
              
              {/* 생년월일 */}
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="additionalPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              
              {/* 이메일 주소 */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이메일 주소 <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">이메일 수신이 안되면, 아이디 또는 비밀번호 찾기가 불가능 합니다.</p>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>
          </div>
        )}
        
        {/* 단계 2: 주소 정보 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">주소 정보</h3>
            
            <div>
              <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                우편번호 <span className="text-red-600">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="zipcode"
                  name="zipcode"
                  value={formData.zipcode}
                  readOnly
                  className="mt-1 block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPostcode(!showPostcode)}
                  className="mt-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  주소찾기
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">결과지가 우편으로 발송되오니, 정확히 입력하여 주시기 바랍니다.</p>
              {errors.zipcode && <p className="mt-1 text-sm text-red-600">{errors.zipcode}</p>}
              
              {showPostcode && (
                <div className="mt-2 border border-gray-300 rounded-md p-4">
                  <DaumPostcode onComplete={handlePostcodeComplete} />
                </div>
              )}
              
              {/* 도로명 주소 */}
              <div className="mt-4">
                <label htmlFor="roadAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  도로명 주소
                </label>
                <input
                  type="text"
                  id="roadAddress"
                  name="roadAddress"
                  value={formData.roadAddress}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* 지번 주소 */}
              <div className="mt-4">
                <label htmlFor="jibunAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  지번 주소
                </label>
                <input
                  type="text"
                  id="jibunAddress"
                  name="jibunAddress"
                  value={formData.jibunAddress}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* 상세주소 */}
              <div className="mt-4">
                <label htmlFor="detailAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  상세주소
                </label>
                <input
                  type="text"
                  id="detailAddress"
                  name="detailAddress"
                  value={formData.detailAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* 추가주소 */}
              <div className="mt-4">
                <label htmlFor="additionalAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  추가주소
                </label>
                <input
                  type="text"
                  id="additionalAddress"
                  name="additionalAddress"
                  value={formData.additionalAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* 단계 3: 학력 및 직업 정보 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">현재 (최종) 학력 & 현재 직업 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 학업군 */}
              <div>
                <label htmlFor="academicGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="jobGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="major" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
        
        {/* 단계 4: 약관 동의 */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">약관 및 개인정보 활용 동의</h3>
            
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
                  <label htmlFor="agreeTerms" className="font-medium text-gray-700 dark:text-gray-300">
                    이용약관 및 개인정보 수집·이용에 동의합니다. <span className="text-red-600">*</span>
                  </label>
                  <p className="text-gray-500 mt-1">개인정보는 회원 관리, 서비스 제공 및 개선을 위해 사용됩니다.</p>
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
                    <span className="mx-2">|</span>
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
                  {errors.agreeTerms && <p className="mt-1 text-sm text-red-600">{errors.agreeTerms}</p>}
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
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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

export default SignupForm; 