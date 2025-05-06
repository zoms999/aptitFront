"use client";

import SignupForm from "../../../components/SignupForm";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PersonalSignupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">개인 회원가입</h1>
          <p className="mt-2 text-sm text-gray-600">
            개인 계정을 만들고 서비스를 이용해보세요
          </p>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 border-b border-gray-200">
            <button
              className="py-4 text-center font-medium transition-colors text-blue-600 border-b-2 border-blue-600"
            >
              일반 회원가입
            </button>
            <button
              className="py-4 text-center font-medium transition-colors text-gray-500 hover:text-blue-600"
              onClick={() => router.push('/signup/organization')}
            >
              기관 회원가입
            </button>
          </div>
          
          <div className="p-8">
            <SignupForm />
          </div>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link 
              href="/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              로그인하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 