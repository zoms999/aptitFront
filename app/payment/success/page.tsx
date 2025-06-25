"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// 결제 성공 페이지 내용 컴포넌트
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<{
    success: boolean;
    message: string;
    orderId: string;
    paymentKey: string;
    totalAmount: number;
    method: string;
    receiptUrl?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // URL 파라미터에서 결제 데이터 추출
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  
  // 결제 정보 조회
  useEffect(() => {
    // 필수 파라미터가 없으면 메인으로 리다이렉트
    if (!paymentKey || !orderId || !amount) {
      console.error('필수 결제 파라미터 누락:', { paymentKey, orderId, amount });
      redirect('/');
      return;
    }
    
    // 결제 확인 API 호출
    const confirmPayment = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });
        
        const data = await response.json();
        console.log('결제 확인 응답:', data);
        
        if (response.ok && data.success) {
          setPaymentInfo(data);
        } else {
          console.error('결제 확인 실패:', data.message || '알 수 없는 오류');
        }
      } catch (error) {
        console.error('결제 확인 요청 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    confirmPayment();
  }, [paymentKey, orderId, amount]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* 배경 장식 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-12 relative z-10 hover:shadow-3xl transition-all duration-300">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg animate-pulse">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">결제 정보를 확인 중입니다</h2>
            <p className="text-gray-600 text-lg">잠시만 기다려주세요...</p>
          </div>
        </div>
      </div>
    );
  }
  
  const success = paymentInfo && paymentInfo.success;
  const errorMsg = paymentInfo ? paymentInfo.message : '결제 정보를 확인할 수 없습니다.';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden p-4">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-10 relative z-10 hover:shadow-3xl transition-all duration-300">
        <div className="text-center">
          {success ? (
            <>
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-xl mb-6 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">결제가 완료되었습니다!</h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">감사합니다. 아래에서 결제 정보를 확인할 수 있습니다.</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full shadow-xl mb-6 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-red-600 mb-4">결제에 실패했습니다</h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">{errorMsg || '결제 중 오류가 발생했습니다. 다시 시도해주세요.'}</p>
            </>
          )}
        </div>
        
        {/* 결제 정보 표시 */}
        <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            결제 상세 정보
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">주문번호</span>
              <span className="font-mono text-sm bg-white px-3 py-1 rounded-lg border">{paymentInfo?.orderId || orderId}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">결제키</span>
              <span className="font-mono text-sm bg-white px-3 py-1 rounded-lg border">{paymentInfo?.paymentKey || paymentKey}</span>
            </div>
            {paymentInfo?.totalAmount && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">결제금액</span>
                <span className="font-bold text-xl text-blue-600">{Number(paymentInfo.totalAmount).toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">결제상태</span>
              <span className={`font-bold px-3 py-1 rounded-full text-sm ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {success ? '결제완료' : '결제실패'}
              </span>
            </div>
            {paymentInfo?.method && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">결제수단</span>
                <span className="font-medium text-gray-900">{paymentInfo.method}</span>
              </div>
            )}
            {paymentInfo?.receiptUrl && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">영수증</span>
                <a href={paymentInfo.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-all duration-200">
                  영수증 보기
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* 버튼 영역 */}
        <div className="space-y-4">
          <Link href="/dashboard" className="block w-full text-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              대시보드로 이동
            </span>
          </Link>
          <Link href="/" className="block w-full text-center bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 text-gray-700 py-4 px-6 rounded-2xl font-medium text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              홈으로 이동
            </span>
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