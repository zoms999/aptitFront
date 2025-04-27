"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthLinks from "./AuthLinks";

type LoginType = "personal" | "organization";

export default function LoginForm() {
  const [loginType, setLoginType] = useState<LoginType>("personal");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (loginType === "organization" && !isCodeVerified) {
      setError("회차코드 유효성 검사를 먼저 진행해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("로그인 시도:", { username, loginType, withSessionCode: loginType === "organization" });
      
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
        loginType,
        sessionCode: loginType === "organization" ? sessionCode : undefined,
      });

      console.log("로그인 결과:", result);

      if (result?.error) {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else if (result?.ok) {
        router.push("/dashboard");
      } else {
        setError("로그인 처리 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("로그인 예외 발생:", err);
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifySessionCode = async () => {
    if (!sessionCode.trim()) {
      setError("회차코드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      console.log("회차코드 검증 요청:", sessionCode);
      
      const response = await fetch("/api/verify-session-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sessionCode }),
      });

      const data = await response.json();
      console.log("회차코드 검증 결과:", data);
      
      if (data.valid) {
        setIsCodeVerified(true);
        setError("");
      } else {
        setIsCodeVerified(false);
        setError(data.message || "유효하지 않은 회차코드입니다.");
      }
    } catch (err) {
      console.error("회차코드 검증 예외 발생:", err);
      setError("회차코드 검증 중 오류가 발생했습니다.");
      setIsCodeVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginTypeChange = (type: LoginType) => {
    setLoginType(type);
    setError("");
    setIsCodeVerified(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="px-12 pt-8 pb-6 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">로그인</h2>
      </div>
      
      <div className="grid grid-cols-2 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`py-4 text-center font-medium transition-colors ${
            loginType === "personal"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          onClick={() => handleLoginTypeChange("personal")}
        >
          일반 로그인
        </button>
        <button
          className={`py-4 text-center font-medium transition-colors ${
            loginType === "organization"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
          onClick={() => handleLoginTypeChange("organization")}
        >
          기관 로그인
        </button>
      </div>
      
      <form className="px-12 py-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
        
        <div className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">아이디</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm bg-white dark:bg-gray-800 transition-all"
              placeholder="아이디를 입력하세요"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm bg-white dark:bg-gray-800 transition-all"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {loginType === "organization" && (
            <div>
              <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">회차코드 유효성 검사를 진행하세요.</label>
              <div className="flex space-x-3">
                <input
                  id="sessionCode"
                  name="sessionCode"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => {
                    setSessionCode(e.target.value);
                    setIsCodeVerified(false);
                  }}
                  className={`block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-white ring-1 ring-inset ${
                    isCodeVerified 
                      ? "ring-green-500 dark:ring-green-400" 
                      : "ring-gray-300 dark:ring-gray-700"
                  } placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm bg-white dark:bg-gray-800 transition-all`}
                  placeholder="발급받으신 코드 입력"
                />
                <button
                  type="button"
                  onClick={verifySessionCode}
                  disabled={isLoading || !sessionCode.trim()}
                  className="whitespace-nowrap px-5 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-700 dark:text-indigo-300 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  유효성 확인
                </button>
              </div>
              {isCodeVerified && (
                <p className="mt-1.5 text-sm text-green-600 dark:text-green-400">
                  유효한 회차코드입니다.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-800"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">로그인 유지</label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">비밀번호 찾기</a>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || (loginType === "organization" && !isCodeVerified)}
          className="w-full flex justify-center items-center rounded-lg bg-indigo-600 py-3.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:outline-indigo-400 transition-all disabled:opacity-70"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          로그인
        </button>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <AuthLinks />
        </div>
      </form>
    </div>
  );
} 