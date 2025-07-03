"use client";

import { useRouter } from 'next/navigation';
import { Test } from '../types';
import { Icons } from './icons';

interface TestsSectionProps {
  tests: Test[];
  onStartNewTest: () => void;
}

export function TestsSection({ tests, onStartNewTest }: TestsSectionProps) {
  const router = useRouter();

  const getStatusBadge = (done: string) => {
    switch (done) {
      case 'R':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm"><Icons.Loader className="w-2 h-2 mr-2 animate-pulse" />준비됨</span>;
      case 'I':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 shadow-sm"><Icons.PauseCircle className="w-2 h-2 mr-2 animate-pulse" />진행중</span>;
      case 'E':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-800 shadow-sm"><Icons.CheckCircle2 className="w-2 h-2 mr-2" />완료</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 shadow-sm">상태없음</span>;
    }
  };

  const getActionButton = (test: Test) => {
    switch (test.done) {
      case 'R':
        return (
          <button onClick={() => router.push(`/test/${test.cr_seq}`)} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <Icons.PlayCircle className="w-4 h-4 mr-1" />
            검사 시작
          </button>
        );
      case 'I':
        return (
          <button onClick={() => router.push(`/test/${test.cr_seq}/start`)} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xs font-bold rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <Icons.PlayCircle className="w-4 h-4 mr-1" />
            계속하기
          </button>
        );
      case 'E':
        if (test.rview === 'Y' || test.rview === 'P') {
          return (
            <button onClick={() => router.push(`/test-result/${test.cr_seq}`)} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              <Icons.Eye className="w-4 h-4 mr-1" />
              결과보기
            </button>
          );
        }
        return <span className="text-gray-400 text-xs font-medium">결과 없음</span>;
      default:
        return <span className="text-gray-400 text-xs font-medium">결과 없음</span>;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300 animate-fade-in-delay-3">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
          <Icons.ClipboardList className="w-5 h-5 text-white" />
        </div>
        검사 목록
      </h2>
      {tests.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Icons.FileText className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">검사 내역이 없습니다</h3>
          <p className="text-gray-500 text-lg mb-4">새로운 검사를 시작해보세요!</p>
          <button
            onClick={onStartNewTest}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Icons.PlusCircle className="w-5 h-5 mr-2" />
            새 검사 시작하기
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200/50 shadow-lg">
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
                  <tr key={test.cr_seq} className={`${index % 2 === 0 ? 'bg-white/60' : 'bg-gray-50/60'} hover:bg-blue-50/60 transition-all duration-200`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{test.num}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{test.pd_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.startdate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.enddate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.expiredate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(test.done)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getActionButton(test)}</td>
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