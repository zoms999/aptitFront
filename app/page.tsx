"use client";

import LoginForm from "@/components/LoginForm";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // URL에 redirected=true 파라미터가 있으면 리다이렉트 중단
    const urlParams = new URLSearchParams(window.location.search);
    const redirected = urlParams.get('redirected');
    const reason = urlParams.get('reason');
    
    if (redirected === 'true') {
      console.log("이미 리다이렉트되었으므로 추가 리다이렉트 중단", { reason });
      
      // 계정 정보 문제가 있는 경우 세션 상태를 확인하고 필요시 로그인 페이지로 이동
      if (status === "authenticated" && reason) {
        if (reason === 'incomplete_session' || reason === 'account_not_found') {
          console.log("세션 또는 계정 문제가 감지되어 로그아웃 처리가 필요합니다");
          // 여기서는 자동 로그아웃을 하지 않고 사용자가 로그인 화면에서 처리하도록 함
        }
      }
      return;
    }
    
    // 세션에 문제가 없는 인증된 사용자만 대시보드로 리다이렉트
    if (status === "authenticated" && session?.user && 'id' in session.user) {
      console.log("인증된 사용자 - 대시보드로 리다이렉트", session);
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // 로딩 중이거나 인증되지 않은 경우에만 로그인 화면 표시
  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-md space-y-8">
            <p className="text-center text-gray-600 dark:text-gray-400">로딩 중...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          <LoginForm />
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="mb-4 md:mb-0">
              <span>© 2025 한국진로적성센터. All rights reserved.</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">이용약관</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">개인정보처리방침</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">고객센터</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 