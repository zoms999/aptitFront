"use client";

import { useState } from "react";
import SignupForm from "../../components/SignupForm";
import OrganizationSignupForm from "../../components/OrganizationSignupForm";

export default function SignupPage() {
  const [signupType, setSignupType] = useState<"personal" | "organization">("personal");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">회원가입</h1>
          <p className="mt-2 text-sm text-gray-600">
            계정을 만들고 서비스를 이용해보세요
          </p>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 border-b border-gray-200">
            <button
              className={`py-4 text-center font-medium transition-colors ${
                signupType === "personal"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }`}
              onClick={() => setSignupType("personal")}
            >
              일반 회원가입
            </button>
            <button
              className={`py-4 text-center font-medium transition-colors ${
                signupType === "organization"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }`}
              onClick={() => setSignupType("organization")}
            >
              기관 회원가입
            </button>
          </div>
          
          <div className="p-8">
            {signupType === "personal" ? <SignupForm /> : <OrganizationSignupForm />}
          </div>
        </div>
      </div>
    </div>
  );
} 