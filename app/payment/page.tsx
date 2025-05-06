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
  <div className="flex flex-col items-center justify-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-600">로딩 중...</p>
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
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">결제하기</h1>
      
      {status === 'loading' || loading ? (
        <Loading />
      ) : (
        <>
          {/* 상품 선택 영역 */}
          {products.length > 0 && !selectedProduct && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4">상품 선택</h2>
              <div className="space-y-4">
                {products.map((product) => (
                  <div 
                    key={product.pd_num}
                    className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-lg">{product.pd_name}</span>
                      <span className="font-bold text-blue-600">{product.pd_price.toLocaleString()}원</span>
                    </div>
                    <div className="text-gray-600 text-sm">
                      <p>유효기간: {product.pd_virtual_expire_at}일</p>
                      <p>타입: {product.pd_kind}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 결제 정보 영역 */}
          {selectedProduct && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">결제 정보</h2>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  상품 변경
                </button>
              </div>
              <div className="flex justify-between mb-4">
                <span className="font-semibold">주문명:</span>
                <span>{orderName}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="font-semibold">결제금액:</span>
                <span>{amount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="font-semibold">주문번호:</span>
                <span>{orderId}</span>
              </div>
            </div>
          )}

          {/* 결제 위젯 영역 */}
          {selectedProduct && paymentWidget ? (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4">결제 수단 선택</h2>
              <div id="payment-methods" className="mb-4"></div>
              <div id="agreement" className="mb-4"></div>
            </div>
          ) : selectedProduct && !paymentWidget ? (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 text-center">
              <p className="text-gray-700 mb-4">결제 시스템을 불러오는데 실패했습니다.</p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                새로고침
              </button>
            </div>
          ) : null}

          {/* 결제 버튼 */}
          {selectedProduct && (
            <button
              onClick={handlePayment}
              disabled={!paymentMethodsWidget}
              className={`w-full py-3 rounded-lg font-semibold transition duration-200 ${
                !paymentMethodsWidget 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-100' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              결제하기
            </button>
          )}
        </>
      )}
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