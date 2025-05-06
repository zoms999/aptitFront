"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// 결제 성공 페이지 내용 컴포넌트
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 결제 데이터 추출
  const imp_uid = searchParams.get('imp_uid');
  const merchant_uid = searchParams.get('merchant_uid');
  const paid_amount = searchParams.get('paid_amount');
  const status = searchParams.get('status');
  const success = searchParams.get('success') === 'true';
  const error_msg = searchParams.get('error_msg') || '';
  
  // 필수 파라미터가 없으면 메인으로 리다이렉트
  if (!imp_uid || !merchant_uid) {
    redirect('/');
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          {success ? (
            <>
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-800">결제가 완료되었습니다!</h2>
              <p className="mt-2 text-gray-600">감사합니다. 아래에서 결제 정보를 확인할 수 있습니다.</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-800">결제에 실패했습니다</h2>
              <p className="mt-2 text-gray-600">{error_msg || '결제 중 오류가 발생했습니다. 다시 시도해주세요.'}</p>
            </>
          )}
        </div>
        
        {/* 결제 정보 표시 */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">주문번호</span>
            <span className="font-medium">{merchant_uid}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">결제번호</span>
            <span className="font-medium">{imp_uid}</span>
          </div>
          {paid_amount && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">결제금액</span>
              <span className="font-medium">{Number(paid_amount).toLocaleString()}원</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-gray-600">결제상태</span>
            <span className={`font-medium ${success ? 'text-green-600' : 'text-red-600'}`}>
              {success ? '결제완료' : '결제실패'}
            </span>
          </div>
        </div>
        
        {/* 버튼 영역 */}
        <div className="mt-8 space-y-3">
          <Link href="/dashboard" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200">
            대시보드로 이동
          </Link>
          <Link href="/" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition duration-200">
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

// Suspense 경계로 감싼 페이지 컴포넌트
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 