"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 토스페이먼츠 결제 실패 코드 및 메시지
  const code = searchParams.get('code') || '알 수 없는 오류 코드';
  const message = searchParams.get('message') || '결제 중 오류가 발생했습니다.';
  const orderId = searchParams.get('orderId') || '';

  useEffect(() => {
    // 실패 로그 저장
    const logPaymentFailure = async () => {
      try {
        await fetch('/api/payment/fail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            message,
            orderId
          }),
        });
      } catch (err) {
        console.error('결제 실패 로그 저장 오류:', err);
      }
    };

    logPaymentFailure();
    
    // 결제 실패 알림
    toast.error('결제에 실패했습니다.', {
      position: "top-center",
      autoClose: 3000,
    });
  }, [code, message, orderId]);

  // 결제 페이지로 돌아가기
  const goBackToPayment = () => {
    router.push('/payment');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">결제 실패</h2>
          <p className="text-gray-600 mt-2">결제 처리 중 오류가 발생했습니다.</p>
        </div>

        <div className="bg-red-50 p-4 rounded-md mb-6">
          <div className="mb-2">
            <span className="font-medium text-red-700">오류 코드:</span>
            <span className="ml-2 text-red-600">{code}</span>
          </div>
          <div>
            <span className="font-medium text-red-700">오류 메시지:</span>
            <span className="ml-2 text-red-600">{message}</span>
          </div>
          {orderId && (
            <div className="mt-2">
              <span className="font-medium text-red-700">주문번호:</span>
              <span className="ml-2 text-red-600">{orderId}</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={goBackToPayment}
            className="bg-indigo-600 text-white py-2 px-6 rounded-md shadow-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            결제 다시 시도하기
          </button>
        </div>
      </div>
    </div>
  );
} 