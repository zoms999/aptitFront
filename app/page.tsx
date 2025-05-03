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
    if (status === "authenticated" && session) {
      // 이미 로그인된 사용자는 대시보드로 리다이렉트
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