"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import LanguageSelector from "./LanguageSelector";

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <header className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-bold flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-8 h-8 mr-2"
              >
                <path 
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12.5h2v6h-2v-6zm0 7.5h2v2h-2v-2z"
                />
              </svg>
              APTIT
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            <a href="#" className="text-white hover:text-indigo-100 transition-colors">소개</a>
            <a href="#" className="text-white hover:text-indigo-100 transition-colors">적성검사</a>
            <a href="#" className="text-white hover:text-indigo-100 transition-colors">이용안내</a>
            <a href="#" className="text-white hover:text-indigo-100 transition-colors">고객센터</a>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            {status === 'authenticated' ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="text-white hover:text-indigo-100 transition-colors"
                >
                  {session.user?.name || '마이페이지'}
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-white hover:text-indigo-100 transition-colors px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-white hover:text-indigo-100 transition-colors px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800"
              >
                로그인
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <LanguageSelector />
            <button
              type="button"
              className="text-white inline-flex items-center justify-center p-2 rounded-md hover:text-indigo-100 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">메뉴 열기</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a
                href="#"
                className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
              >
                소개
              </a>
              <a
                href="#"
                className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
              >
                적성검사
              </a>
              <a
                href="#"
                className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
              >
                이용안내
              </a>
              <a
                href="#"
                className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
              >
                고객센터
              </a>
              {status === 'authenticated' ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
                  >
                    {session.user?.name || '마이페이지'}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left text-white block px-3 py-2 rounded-md text-base font-medium bg-indigo-700 hover:bg-indigo-800"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-white block px-3 py-2 rounded-md text-base font-medium bg-indigo-700 hover:bg-indigo-800"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 