"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 실제 컴포넌트 내용
function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL 파라미터에서 오류 정보 추출
  const error_msg = searchParams.get('error_msg') || '결제 중 오류가 발생했습니다.';
  const merchant_uid = searchParams.get('merchant_uid') || '알 수 없음';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">결제에 실패했습니다</h2>
          <p className="mt-2 text-gray-600">{error_msg}</p>
        </div>
        
        {/* 주문 정보 */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">주문번호</span>
            <span className="font-medium">{merchant_uid}</span>
          </div>
        </div>
        
        {/* 버튼 영역 */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => router.push('/payment')}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
          >
            결제 다시 시도하기
          </button>
          <Link href="/" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition duration-200">
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

// Suspense 경계로 감싼 페이지 컴포넌트
export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <PaymentFailContent />
    </Suspense>
  );
} 