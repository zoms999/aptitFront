import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PersonalSignupForm: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    birthdate: '',
    gender: '',
    phone: '',
    additionalPhone: '',
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
    username: '',
    password: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  // 테스트 데이터 로드 함수
  const loadTestData = () => {
    setFormData({
      email: 'test@example.com',
      name: '테스트 사용자',
      birthdate: '1990-01-01',
      gender: 'male',
      phone: '01012345678',
      additionalPhone: '01087654321',
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
      companyName: '테스트 주식회사',
      jobDescription: '웹 개발자',
      username: 'testuser',
      password: 'test123',
      agreeTerms: true,
      agreePrivacy: true,
      agreeMarketing: true,
    });
    
    toast.success('테스트 데이터가 로드되었습니다!', {
      position: "top-center",
      autoClose: 2000,
    });
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
    try {
      setIsSubmitting(true);
      // 로딩 토스트 표시
      const loadingToastId = toast.loading('회원가입 처리 중...', {
        position: "top-center"
      });
      
      // 사용자 에이전트 정보 가져오기
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown';
      
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
        
        // 브라우저 정보
        userAgent: userAgent,
        
        // 유형
        type: 'personal'
      };

      // 서버에 데이터 전송
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      
      // 로딩 토스트 제거
      toast.dismiss(loadingToastId);

      if (data.success) {
        console.log('회원가입 성공:', data);
        
        // 성공 토스트 메시지 표시
        toast.success('회원가입이 완료되었습니다! 메인페이지로 이동합니다.', {
          position: "top-center",
          autoClose: 2000,
        });
        
        // 즉시 메인페이지로 이동 (payment 페이지로 리다이렉션 방지)
        window.location.href = '/';
        
        // 만약 위 코드가 즉시 실행되지 않을 경우를 대비해 setTimeout으로 백업
        setTimeout(() => {
          router.push('/');
        }, 100);
      } else {
        // 실패 처리
        console.error('회원가입 실패:', data);
        toast.error(data.message || '회원가입에 실패했습니다', {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('회원가입 중 오류:', error);
      toast.error('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.', {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 회원정보 입력 필드 */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">아이디</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">생년월일</label>
          <input
            type="date"
            id="birthdate"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">성별</label>
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
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">휴대전화</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="'-' 없이 숫자만 입력"
            required
          />
        </div>
        
        {/* 약관 동의 체크박스 */}
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
              이용약관에 동의합니다
            </label>
          </div>
        </div>
        
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="agreePrivacy"
              name="agreePrivacy"
              checked={formData.agreePrivacy}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="agreePrivacy" className="ml-2 block text-sm text-gray-900">
              개인정보 처리방침에 동의합니다
            </label>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50"
        >
          {isSubmitting ? '처리 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};

export default PersonalSignupForm; 