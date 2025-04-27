"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const acGid = searchParams.get('acGid');
  const [paymentInfo] = useState({
    program: '기본 검사 프로그램',
    price: 0
  });
  const [loading, setLoading] = useState(true);
  const [error] = useState('');

  useEffect(() => {
    // acGid가 없으면 회원가입 페이지로 리다이렉트
    if (!acGid) {
      router.push('/signup');
      return;
    }

    // 실제 구현에서는 여기서 회원 정보 및 프로그램 정보를 불러오는 API 호출
    setLoading(false);
  }, [acGid, router]);

  const handlePayment = () => {
    // 결제 처리 로직
    alert('결제가 완료되었습니다. 검사로 이동합니다.');
    router.push('/test');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          <p>{error}</p>
          <button 
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            onClick={() => router.push('/signup')}
          >
            회원가입으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:py-16 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
        결제
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        결제를 진행하여 주십시오.
      </p>
      <p className="mt-2 text-gray-600">
        검사자님께서는 아래 선택하신 프로그램으로 진행됨을 알려드립니다.
      </p>

      <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            결제 정보
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                검사 프로그램
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {paymentInfo.program}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                가격
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {paymentInfo.price.toLocaleString()} 원
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            주의사항 [필독]
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>
              결제 완료 후 선택하신 프로그램에 해당하는 검사가 곧바로 진행됩니다.
            </li>
            <li>
              곧바로 검사를 진행하지 못하실 경우, 결제 후 7일 이내에 실시 하셔야 하며, 7일이 경과되면 소멸됩니다.
            </li>
            <li>
              결제 후 바로 검사가 진행되므로, 결제가 완료된 뒤에는 취소 및 환불이 불가합니다.
            </li>
            <li>
              결제 시 본 프로그램의 특허권, 저작권, 상표권 등의 소유권을 가진 커리어컴퍼니로 결과가 통보됩니다.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handlePayment}
          className="bg-indigo-600 text-white py-3 px-6 rounded-md shadow-sm text-base font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          결제하기
        </button>
      </div>
    </div>
  );
} 