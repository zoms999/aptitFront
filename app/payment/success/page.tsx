"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// PaymentData 인터페이스 정의
interface PaymentData {
  orderId: string;
  orderName: string;
  totalAmount: number;
  paymentKey: string;
  method: string;
  approvedAt: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const paymentKey = params.get('paymentKey');
        const orderId = params.get('orderId');
        const amount = params.get('amount');

        if (!paymentKey || !orderId || !amount) {
          setError('결제 정보가 올바르지 않습니다.');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '결제 승인에 실패했습니다.');
        }

        const data: PaymentData = await response.json();
        setPaymentData(data);
        setIsLoading(false);
        
        toast.success('결제가 성공적으로 완료되었습니다!', {
          position: "top-center",
          autoClose: 3000,
        });
        
        // 결제 성공 시 대시보드로 리다이렉트
        if (data) {
          router.push('/dashboard');
        }
      } catch (err: unknown) {
        console.error('결제 데이터 가져오기 오류:', err);
        setError(err instanceof Error ? err.message : '결제 데이터를 가져오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <h2 className="text-xl font-medium text-gray-700">결제 승인 중...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="bg-red-100 text-red-700 p-8 rounded-lg max-w-lg w-full text-center">
          <h2 className="text-xl font-bold mb-4">결제 오류</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => router.push('/payment')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            결제 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">결제 완료</h2>
          <p className="text-gray-600 mt-2">결제가 성공적으로 완료되었습니다.</p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">주문번호</dt>
              <dd className="text-sm text-gray-900">{paymentData?.orderId}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">결제금액</dt>
              <dd className="text-sm text-gray-900">{Number(paymentData?.totalAmount).toLocaleString()}원</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">결제수단</dt>
              <dd className="text-sm text-gray-900">{paymentData?.method === 'card' ? '신용카드' : paymentData?.method}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">곧 검사 페이지로 이동합니다...</p>
        </div>
      </div>
    </div>
  );
} 