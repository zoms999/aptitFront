"use client";

import Link from "next/link";

export default function AuthLinks() {
  return (
    <div className="flex justify-center space-x-4 text-sm">
      <Link href="/find-id" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
        아이디 찾기
      </Link>
      <span className="text-gray-400 dark:text-gray-500">|</span>
      <Link href="/reset-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
        비밀번호 찾기
      </Link>
      <span className="text-gray-400 dark:text-gray-500">|</span>
      <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
        회원가입
      </Link>
    </div>
  );
} 