'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-lg font-semibold mb-4">한국진로적성센터</h2>
            <p className="text-sm text-gray-300 mb-2">역량 & 적성검사 전문 플랫폼</p>
            <p className="text-sm text-gray-300">© {currentYear} 한국진로적성센터. All rights reserved.</p>
          </div>

          {/* 서비스 링크 */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-gray-300 hover:text-white">상품 안내</Link>
              </li>
              <li>
                <Link href="/price" className="text-sm text-gray-300 hover:text-white">가격 정책</Link>
              </li>
              <li>
                <Link href="/demo" className="text-sm text-gray-300 hover:text-white">체험하기</Link>
              </li>
            </ul>
          </div>

          {/* 지원 링크 */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">고객지원</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/support" className="text-sm text-gray-300 hover:text-white">고객센터</Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-300 hover:text-white">자주 묻는 질문</Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-300 hover:text-white">문의하기</Link>
              </li>
            </ul>
          </div>

          {/* 법적 정보 */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">법적 정보</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-gray-300 hover:text-white">이용약관</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-300 hover:text-white">개인정보처리방침</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center md:text-left">
          <p className="text-xs text-gray-400">
            사업자등록번호: 138-90-72168 | 대표이사 박에스더 외 1명 | 주소: 서울 강서구 마곡서로 152 두산더랜드타워 B동 4층
          </p>
          <p className="text-xs text-gray-400 mt-1">
          ☏ 02-523-7523 | 이메일: support@aptit.co.kr
          </p>
        </div>
      </div>
    </footer>
  );
} 