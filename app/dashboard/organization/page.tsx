"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import Header from "@/components/Header";

interface AccountStatus {
  cr_pay: string;
  pd_kind: string;
  expire: string;
  state: string;
}

interface Test {
  num: number;
  cr_seq: number;
  cr_pay: string;
  pd_name: string;
  anp_seq: number;
  startdate: string;
  enddate: string;
  done: string;
  rview: string;
  expiredate: string;
}

interface InstituteInfo {
  ins_seq: number;
  ins_name: string;
  tur_seq: number;
  tur_code: string;
  tur_req_sum: number;
  tur_use_sum: number;
}

interface Member {
  pe_seq: number;
  pe_name: string;
  pe_email: string;
  pe_sex: string;
  pe_cellphone: string;
  join_date: string;
}

interface DashboardData {
  accountStatus: AccountStatus;
  tests: Test[];
  completedTests: number;
  instituteInfo: InstituteInfo;
  members: Member[];
  isOrganization: boolean;
}

export default function OrganizationDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 인증 상태 확인
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching organization dashboard data...');
      
      const response = await fetch('/api/dashboard/organization');
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.error || '데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      console.log('Organization dashboard data received:', data);
      
      // 기관 회원 확인
      if (!data.isOrganization) {
        // 일반 회원인 경우 개인 대시보드로 리다이렉트
        router.push('/dashboard/personal');
        return;
      }
      
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 결제 페이지로 이동
  const handlePayment = () => {
    router.push('/payment');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-500">오류 발생</h1>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { accountStatus, tests, instituteInfo, members } = dashboardData;
  
  // 계정 상태에 따른 표시 정보
  const isPaid = accountStatus.cr_pay === 'Y';
  const isExpired = accountStatus.expire === 'N';
  const expireDate = tests.length > 0 ? tests[0].expiredate : '만료일 없음';

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 헤더 */}
      <Header />
      
      <main className="flex-grow p-4 bg-gray-50">
        <div className="w-full max-w-6xl mx-auto">
          {/* 환영 메시지 및 헤더 */}
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h1 className="mb-2 text-2xl font-bold text-gray-800">
              {instituteInfo?.ins_name || '기관'} 대시보드
            </h1>
            <div className="flex flex-wrap items-center justify-between">
              <p className="text-gray-600">
                기관 회원 대시보드에서 검사 결과와 기관 정보를 확인할 수 있습니다.
              </p>
              <button
                onClick={handlePayment}
                className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 sm:mt-0"
              >
                결제하기
              </button>
            </div>
          </div>

          {/* 기관 정보 카드 */}
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">기관 정보</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-md">
                <h3 className="mb-1 text-sm font-medium text-gray-500">기관명</h3>
                <p className="text-lg font-semibold">{instituteInfo?.ins_name || '-'}</p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="mb-1 text-sm font-medium text-gray-500">회차 정보</h3>
                <p className="text-lg font-semibold">{instituteInfo?.tur_code ? `회차 #${instituteInfo.tur_seq}` : '기본회차'}</p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="mb-1 text-sm font-medium text-gray-500">회차 코드</h3>
                <p className="text-lg font-semibold">{instituteInfo?.tur_code || '-'}</p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="mb-1 text-sm font-medium text-gray-500">신청 인원</h3>
                <p className="text-lg font-semibold">
                  {instituteInfo ? `${instituteInfo.tur_use_sum} / ${instituteInfo.tur_req_sum}명` : '0명'}
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="mb-1 text-sm font-medium text-gray-500">계정 상태</h3>
                <p className={`text-lg font-semibold ${isPaid ? 'text-green-500' : 'text-red-500'}`}>
                  {isPaid ? '결제됨' : '미결제'}
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="mb-1 text-sm font-medium text-gray-500">만료일</h3>
                <p className={`text-lg font-semibold ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
                  {expireDate}
                </p>
              </div>
            </div>
          </div>

          {/* 회원 목록 */}
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">회원 목록</h2>
            
            {members.length === 0 ? (
              <div className="p-4 text-center text-gray-500 border rounded-md">
                등록된 회원이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full mb-4 text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">이름</th>
                      <th className="px-4 py-3">이메일</th>
                      <th className="px-4 py-3">성별</th>
                      <th className="px-4 py-3">연락처</th>
                      <th className="px-4 py-3">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.pe_seq} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{member.pe_name}</td>
                        <td className="px-4 py-3">{member.pe_email}</td>
                        <td className="px-4 py-3">{member.pe_sex === 'M' ? '남성' : '여성'}</td>
                        <td className="px-4 py-3">{member.pe_cellphone}</td>
                        <td className="px-4 py-3">{member.join_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 내 검사 목록 */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">검사 목록</h2>
            
            {tests.length === 0 ? (
              <div className="p-4 text-center text-gray-500 border rounded-md">
                검사 내역이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full mb-4 text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">번호</th>
                      <th className="px-4 py-3">검사명</th>
                      <th className="px-4 py-3">시작일</th>
                      <th className="px-4 py-3">종료일</th>
                      <th className="px-4 py-3">유효일자</th>
                      <th className="px-4 py-3">상태</th>
                      <th className="px-4 py-3">결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((test) => (
                      <tr key={test.cr_seq} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{test.num}</td>
                        <td className="px-4 py-3">{test.pd_name}</td>
                        <td className="px-4 py-3">{test.startdate || '-'}</td>
                        <td className="px-4 py-3">{test.enddate || '-'}</td>
                        <td className="px-4 py-3">{test.expiredate || '-'}</td>
                        <td className="px-4 py-3">
                          {test.done === 'R' ? (
                            <span className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-full">준비됨</span>
                          ) : test.done === 'I' ? (
                            <span className="px-2 py-1 text-xs text-yellow-700 bg-yellow-100 rounded-full">진행중</span>
                          ) : test.done === 'E' ? (
                            <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">완료</span>
                          ) : (
                            <span className="px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded-full">상태없음</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {test.done === 'R' ? (
                            <button
                              onClick={() => router.push(`/test/${test.cr_seq}`)}
                              className="px-3 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                            >
                              검사 시작
                            </button>
                          ) : test.done === 'I' ? (
                            <button
                              onClick={() => router.push(`/test/${test.cr_seq}/start`)}
                              className="px-3 py-1 text-xs text-white bg-yellow-500 rounded hover:bg-yellow-600"
                            >
                              계속하기
                            </button>
                          ) : test.done === 'E' && (test.rview === 'Y' || test.rview === 'P') ? (
                            <button
                              onClick={() => router.push(`/test-result/${test.cr_seq}`)}
                              className="px-3 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
                            >
                              결과보기
                            </button>
                          ) : (
                            <span className="text-gray-400">결과 없음</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* 하단 푸터 */}
      <Footer />
    </div>
  );
} 