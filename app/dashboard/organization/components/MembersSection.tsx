"use client";

import { useRouter } from 'next/navigation';
import { Member } from '../types';
import { Icons } from './icons';

interface MembersSectionProps {
  members: Member[];
}

export function MembersSection({ members }: MembersSectionProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'E':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">완료</span>;
      case 'I':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-sm bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800">진행중</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800">준비</span>;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in-delay-2">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
          <Icons.Users className="w-5 h-5 text-white" />
        </div>
        회원 목록
      </h2>
      {members.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Icons.Users2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">등록된 회원이 없습니다</h3>
          <p className="text-gray-500 text-lg">새로운 회원을 등록해보세요!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200/50 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50/90 to-gray-100/90 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">아이디</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">성별</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">연락처</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">가입일</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">검사 상태</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-gray-200/50">
                {members.map((member, index) => (
                  <tr key={member.pe_seq} className={`${index % 2 === 0 ? 'bg-white/60' : 'bg-gray-50/60'} hover:bg-blue-50/60 transition-all duration-200`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{member.pe_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{member.ac_id || '계정없음'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{member.pe_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${member.pe_sex === 'M' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' : 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800'}`}>
                        <div className={`w-2 h-2 ${member.pe_sex === 'M' ? 'bg-blue-500' : 'bg-pink-500'} rounded-full mr-2`}></div>
                        {member.pe_sex === 'M' ? '남성' : '여성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{member.pe_cellphone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{member.join_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {member.testStatus ? (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-sm ${member.testStatus.hasTest ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'}`}>
                              <div className={`w-2 h-2 ${member.testStatus.hasTest ? 'bg-green-500' : 'bg-gray-500'} rounded-full mr-1`}></div>
                              {member.testStatus.hasTest ? '검사있음' : '검사없음'}
                            </span>
                          </div>
                          {member.testStatus.hasTest && (
                            <div className="text-xs text-gray-600">
                              {member.testStatus.completedCount}/{member.testStatus.testCount} 완료
                            </div>
                          )}
                          {member.testStatus.latestTestStatus !== 'none' && (
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(member.testStatus.latestTestStatus)}
                              {member.testStatus.latestTestStatus === 'E' && member.testStatus.latestCrSeq && (
                                <button
                                  onClick={() => router.push(`/test-result/${member.testStatus!.latestCrSeq}`)}
                                  className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                >
                                  <Icons.Eye className="w-3 h-3 mr-1" />
                                  결과보기
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">계정없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}