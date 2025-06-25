"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { loadPaymentWidget, ANONYMOUS } from '@tosspayments/payment-widget-sdk';
import { nanoid } from 'nanoid';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';

// 로딩 컴포넌트 직접 구현
const Loading = () => (
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">결제 정보를 불러오는 중</h2>
        <p className="text-gray-600 text-lg">잠시만 기다려주세요...</p>
      </div>
    </div>
  </div>
);

// 토스페이먼츠 클라이언트 키
const clientKey = 'test_gck_yZqmkKeP8gWKkB7n6KZx8bQRxB9l';

// 타입 정의
interface PaymentMethodsOptions {
  value: number;
}

interface WidgetOptions {
  variantKey: string;
}

interface SelectedPaymentMethod {
  method: string;
  [key: string]: unknown;
}

interface PaymentRequestOptions {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  failUrl: string;
}

interface PaymentWidgetInstance {
  renderPaymentMethods: (
    selector: string, 
    options: PaymentMethodsOptions, 
    widgetOptions?: WidgetOptions
  ) => PaymentMethodsWidgetInstance;
  renderAgreement: (selector: string, options?: WidgetOptions) => void;
  requestPayment: (paymentOptions: PaymentRequestOptions) => Promise<unknown>;
}

interface PaymentMethodsWidgetInstance {
  getSelectedPaymentMethod: () => Promise<SelectedPaymentMethod>;
}

// 상품 타입 정의
interface Product {
  pd_num: number;
  pd_price: number;
  pd_dc: number;
  pd_name: string;
  pd_type: string;
  pd_quota: string;
  pd_virtual_expire_at: number;
  pd_use: string;
  pd_kind: string;
}

// 결제 페이지 내용 컴포넌트
function PaymentContent() {
  const { data: session, status } = useSession();
  const [paymentWidget, setPaymentWidget] = useState<PaymentWidgetInstance | null>(null);
  const [paymentMethodsWidget, setPaymentMethodsWidget] = useState<PaymentMethodsWidgetInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState('');
  const [orderName, setOrderName] = useState('');
  const [amount, setAmount] = useState(0);
  const [acGid, setAcGid] = useState('');
  const [productId, setProductId] = useState('');
  const [productType, setProductType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // 인증 상태 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('로그인이 필요한 서비스입니다');
      router.push('/login?callbackUrl=/payment');
    }
  }, [status, router]);

  // 상품 목록 가져오기
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error('상품 목록을 가져오는데 실패했습니다');
        }
        
        const data = await response.json();
        setProducts(data);
        
        // URL 파라미터로 전달된 cr_seq 확인
        const crSeq = searchParams.get('cr_seq');
        if (crSeq) {
          fetchPaymentInfo(crSeq);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('상품 목록 조회 오류:', error);
        toast.error('상품 목록을 불러오는데 실패했습니다');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [status, searchParams]);

  // 상품 선택 처리
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    
    // 가독성 있는 주문번호 생성
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = today.getHours().toString().padStart(2, '0') + 
                    today.getMinutes().toString().padStart(2, '0');
    const randomStr = nanoid(6).toUpperCase(); // 6자리 대문자 랜덤 문자열
    
    const orderId = `ORD-${dateStr}${timeStr}-${randomStr}`;
    setOrderId(orderId);
    
    setOrderName(product.pd_name);
    setAmount(product.pd_price);
    setProductId(product.pd_num.toString());
    setProductType(product.pd_kind);
    
    // 결제 위젯 로드
    if (!paymentWidget) {
      loadPaymentWidgetAsync();
    }
  };

  // URL 파라미터에서 정보 읽기
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    try {
      if (session?.user && 'id' in session.user) {
        setAcGid(session.user.id as string);
      } else {
        toast.error('사용자 정보를 찾을 수 없습니다');
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('페이지 초기화 오류:', error);
      toast.error('결제 페이지 초기화 중 오류가 발생했습니다');
      router.push('/');
    }
  }, [searchParams, router, session, status]);

  // 결제 정보 가져오기
  const fetchPaymentInfo = async (crSeq: string) => {
    try {
      const response = await fetch(`/api/payment/info?cr_seq=${crSeq}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('결제 정보를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      
      // 가독성 있는 주문번호 생성
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const timeStr = today.getHours().toString().padStart(2, '0') + 
                      today.getMinutes().toString().padStart(2, '0');
      const randomStr = nanoid(6).toUpperCase(); // 6자리 대문자 랜덤 문자열
      
      const orderId = `ORD-${dateStr}${timeStr}-${randomStr}`;
      setOrderId(orderId);
      
      setOrderName(data.orderName || '검사 프로그램');
      setAmount(data.amount || 30000);
      setProductId(data.productId || crSeq);
      setProductType(data.productType || 'basic');
      
      // 제품 정보를 이용해 selectedProduct 찾기
      const matchedProduct = products.find(p => 
        p.pd_num.toString() === crSeq || 
        p.pd_kind === data.productType
      );
      
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
      }
      
      // 결제 위젯 로드
      loadPaymentWidgetAsync();
    } catch (error) {
      console.error('결제 정보 조회 오류:', error);
      toast.error('결제 정보를 가져오는데 실패했습니다');
      // 오류 시에도 기본 상품 목록은 표시
      setLoading(false);
    }
  };

  // 결제 위젯 로드
  const loadPaymentWidgetAsync = async () => {
    try {
      const loadedWidget = await loadPaymentWidget(clientKey, ANONYMOUS);
      setPaymentWidget(loadedWidget as unknown as PaymentWidgetInstance);
    } catch (error) {
      console.error('결제 위젯 로드 실패:', error);
      toast.error('결제 시스템을 불러오는데 실패했습니다. 페이지를 새로고침 해보세요.');
      setLoading(false);
    }
  };

  // 결제 위젯 초기화
  useEffect(() => {
    if (!paymentWidget || !amount) return;

    // 위젯 렌더링 타이밍 조정을 위한 짧은 지연
    const timer = setTimeout(() => {
      try {
        // 결제 수단 DOM 요소 존재 확인
        const paymentMethodsEl = document.getElementById('payment-methods');
        const agreementEl = document.getElementById('agreement');
        
        if (!paymentMethodsEl || !agreementEl) {
          console.error('결제 위젯을 위한 DOM 요소를 찾을 수 없습니다');
          setLoading(false);
          return;
        }
        
        const paymentMethodsWidgetInstance = paymentWidget.renderPaymentMethods(
          '#payment-methods',
          { value: amount },
          { variantKey: 'DEFAULT' }
        );

        paymentWidget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' });

        setPaymentMethodsWidget(paymentMethodsWidgetInstance);
      } catch (error) {
        console.error('결제 위젯 렌더링 오류:', error);
        toast.error('결제 화면을 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }, 100); // 100ms 지연

    return () => clearTimeout(timer);
  }, [paymentWidget, amount]);

  // 결제 준비 API 호출
  const preparePayment = async () => {
    try {
      const response = await fetch('/api/payment/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          orderName,
          acGid,
          productId,
          productType,
          paymentMethod
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.message || '결제 준비 중 오류가 발생했습니다');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('결제 준비 API 호출 오류:', error);
      toast.error('결제 준비 중 오류가 발생했습니다');
      return false;
    }
  };

  // 결제 처리
  const handlePayment = async () => {
    if (!paymentWidget || !paymentMethodsWidget) {
      toast.error('결제 시스템이 준비되지 않았습니다');
      return;
    }
    
    if (isProcessing) {
      toast.info('결제 요청 처리 중입니다. 잠시만 기다려주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // 결제 수단 선택 확인
      let selectedMethod;
      try {
        selectedMethod = await paymentMethodsWidget.getSelectedPaymentMethod();
        if (!selectedMethod) {
          toast.error('결제 수단을 선택해주세요');
          setIsProcessing(false);
          return;
        }
      } catch (methodError) {
        console.error('결제 수단 확인 오류:', methodError);
        toast.error('결제 수단을 확인할 수 없습니다. 결제 수단을 선택해주세요.');
        setIsProcessing(false);
        return;
      }
      
      // 결제 수단 저장
      setPaymentMethod(selectedMethod.method);
      
      // 결제 정보 유효성 검증
      if (!orderId || !amount || !orderName || !acGid) {
        toast.error('결제 정보가 올바르지 않습니다. 페이지를 새로고침 해주세요.');
        setIsProcessing(false);
        return;
      }
      
      // 결제 준비 API 호출
      try {
        const prepared = await preparePayment();
        if (!prepared) {
          setIsProcessing(false);
          return;
        }
      } catch (prepareError) {
        console.error('결제 준비 API 오류:', prepareError);
        toast.error('결제 준비 과정에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setIsProcessing(false);
        return;
      }

      // 결제 요청
      try {
        await paymentWidget.requestPayment({
          orderId,
          orderName,
          customerName: acGid,
          customerEmail: '',
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
        });
      } catch (paymentError: unknown) {
        console.error('결제 요청 오류:', paymentError);
        
        // 토스페이먼츠 에러 타입 확인
        if (paymentError && typeof paymentError === 'object' && 'code' in paymentError) {
          // 사용자 취소인 경우 (토스페이먼츠 에러 코드)
          if (paymentError.code === 'USER_CANCEL') {
            toast.info('결제가 취소되었습니다.');
            return;
          }
        }
        
        // 일반적인 에러 메시지 표시
        const errorMessage = 
          paymentError && typeof paymentError === 'object' && 'message' in paymentError
            ? String(paymentError.message)
            : '알 수 없는 오류';
            
        toast.error(`결제 요청 중 오류가 발생했습니다: ${errorMessage}`);
      }
    } catch (error) {
      console.error('결제 처리 중 예상치 못한 오류:', error);
      toast.error('결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 페이지 새로고침
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <div className="container mx-auto p-4 max-w-2xl relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">결제하기</h1>
          <p className="text-gray-600 text-lg">ArtyLink 종합 적성 검사 서비스</p>
        </div>
        
        {status === 'loading' || loading ? (
          <Loading />
        ) : (
          <>
            {/* 상품 선택 영역 */}
            {products.length > 0 && !selectedProduct && (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">상품 선택</h2>
                </div>
                <div className="grid gap-4">
                  {products.map((product, index) => (
                    <div 
                      key={product.pd_num}
                      className="group border border-gray-200/50 rounded-2xl p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                      onClick={() => handleSelectProduct(product)}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{product.pd_name}</h3>
                          <div className="flex items-center text-blue-600 font-bold text-2xl">
                            <span>{product.pd_price.toLocaleString()}원</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50/80 rounded-lg p-3">
                          <span className="text-gray-500 block mb-1">유효기간</span>
                          <span className="text-gray-900 font-medium">{product.pd_virtual_expire_at}일</span>
                        </div>
                        <div className="bg-gray-50/80 rounded-lg p-3">
                          <span className="text-gray-500 block mb-1">상품 타입</span>
                          <span className="text-gray-900 font-medium">{product.pd_kind}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 결제 정보 영역 */}
            {selectedProduct && (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">결제 정보</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-all duration-200"
                  >
                    상품 변경
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100/80">
                    <span className="text-gray-600 font-medium">주문명</span>
                    <span className="text-gray-900 font-semibold">{orderName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100/80">
                    <span className="text-gray-600 font-medium">결제금액</span>
                    <span className="text-blue-600 font-bold text-xl">{amount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 font-medium">주문번호</span>
                    <span className="text-gray-700 font-mono text-sm bg-gray-50 px-3 py-1 rounded-lg">{orderId}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 결제 위젯 영역 */}
            {selectedProduct && paymentWidget ? (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">결제 수단 선택</h2>
                </div>
                <div id="payment-methods" className="mb-6"></div>
                <div id="agreement" className="mb-4"></div>
              </div>
            ) : selectedProduct && !paymentWidget ? (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 text-center hover:shadow-3xl transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">결제 시스템 오류</h3>
                <p className="text-gray-700 mb-6">결제 시스템을 불러오는데 실패했습니다.</p>
                <button 
                  onClick={handleRefresh}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  새로고침
                </button>
              </div>
            ) : null}

            {/* 결제 버튼 */}
            {selectedProduct && (
              <div className="text-center">
                <button
                  onClick={handlePayment}
                  disabled={!paymentMethodsWidget || isProcessing}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl ${
                    !paymentMethodsWidget || isProcessing
                      ? 'bg-gray-400 cursor-not-allowed text-gray-100' 
                      : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white transform hover:scale-105'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      결제 처리 중...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      결제하기
                    </span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Suspense 경계로 감싼 페이지 컴포넌트
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <ToastContainer position="top-center" autoClose={3000} />
      <PaymentContent />
    </Suspense>
  );
} 