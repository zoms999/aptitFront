'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-md">
      <div className="container flex flex-wrap items-center justify-between max-w-7xl p-4 mx-auto">
        {/* 로고 */}
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
          옥타그노시스
          </Link>
        </div>

        {/* 메인 네비게이션 */}
        <nav className="hidden md:flex md:items-center md:space-x-6">
          <Link href="/dashboard" className="font-medium text-gray-700 hover:text-blue-600">
            대시보드
          </Link>
          <Link href="/products" className="font-medium text-gray-700 hover:text-blue-600">
            상품 목록
          </Link>
          <Link href="/support" className="font-medium text-gray-700 hover:text-blue-600">
            고객센터
          </Link>
        </nav>

        {/* 사용자 메뉴 */}
        <div className="flex items-center">
          {session ? (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <span className="text-sm text-gray-600">
                  {session.user?.name || '사용자'} 님
                </span>
              </div>
              <div className="relative group">
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  메뉴
                </button>
                <div className="absolute right-0 z-10 invisible w-48 mt-2 origin-top-right bg-white border rounded-md shadow-lg group-hover:visible">
                  <div className="py-1">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      내 프로필
                    </Link>
                    <Link href="/payment-history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      결제 내역
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                로그인
              </Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                회원가입
              </Link>
            </div>
          )}
          
          {/* 모바일 메뉴 버튼 */}
          <div className="ml-4 md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 text-gray-500 rounded-md hover:text-gray-700 hover:bg-gray-100"
              aria-expanded="false"
            >
              <span className="sr-only">메뉴 열기</span>
              {/* 메뉴 아이콘 (3줄) */}
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 