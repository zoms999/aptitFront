import React from 'react';
import { useRouter } from 'next/navigation';
import { DocumentTextIcon, PlusCircleIcon, PencilSquareIcon, DocumentChartBarIcon } from './icons';
import { Test } from '../types';

interface TestsTableProps {
  tests: Test[];
  onPayment: () => void;
}

const TestsTable: React.FC<TestsTableProps> = ({ tests, onPayment }) => {
  const router = useRouter();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in-delay-3">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
          <DocumentTextIcon className="w-5 h-5 text-white" />
        </div>
        검사 목록
      </h2>
      
      {tests.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <DocumentTextIcon className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">검사 내역이 없습니다</h3>
          <p className="text-gray-500 text-lg mb-4">새로운 검사를 시작해보세요!</p>
          <button
            onClick={onPayment}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            새 검사 시작하기
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50/90 to-gray-100/90 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">번호</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">검사명</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">시작일</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">종료일</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">유효일자</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">결과</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-gray-200/50">
                {tests.map((test, index) => (
                  <tr key={test.cr_seq} className={`${index % 2 === 0 ? 'bg-white/60' : 'bg-gray-50/60'} hover:bg-blue-50/60 transition-all duration-200 hover:shadow-sm`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{test.num}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{test.pd_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.startdate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.enddate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.expiredate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {test.done === 'R' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm">
                          <div className="w-2 h-2 bg-gray-500 rounded-full mr-2 animate-pulse"></div>
                          준비됨
                        </span>
                      ) : test.done === 'I' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 shadow-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                          진행중
                        </span>
                      ) : test.done === 'E' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-800 shadow-sm">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                          완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 shadow-sm">
                          <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                          상태없음
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {test.done === 'R' ? (
                        <button
                          onClick={() => router.push(`/test/${test.cr_seq}`)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <PencilSquareIcon className="w-4 h-4 mr-1" />
                          검사 시작
                        </button>
                      ) : test.done === 'I' ? (
                        <button
                          onClick={() => router.push(`/test/${test.cr_seq}/start`)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xs font-bold rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <PencilSquareIcon className="w-4 h-4 mr-1" />
                          계속하기
                        </button>
                      ) : test.done === 'E' && (test.rview === 'Y' || test.rview === 'P') ? (
                        <button
                          onClick={() => router.push(`/test-result/${test.cr_seq}`)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <DocumentChartBarIcon className="w-4 h-4 mr-1" />
                          결과보기
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">결과 없음</span>
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

export default TestsTable;