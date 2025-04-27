"use server";

import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const remember = formData.get("remember") === "on";

  if (!username || !password) {
    return {
      error: "아이디와 비밀번호를 모두 입력해주세요.",
      success: false,
    };
  }

  try {
    // 실제로는 여기서 데이터베이스와 연동하여 사용자 인증을 해야 합니다.
    // 여기서는 예시로 하드코딩된 사용자 정보를 사용합니다.
    if (username === "test" && password === "password") {
      // remember 값이 true인 경우 세션 유지 시간을 늘릴 수 있음
      console.log("Remember me:", remember);
      
      redirect("/dashboard");
    }

    return {
      error: "아이디 또는 비밀번호가 올바르지 않습니다.",
      success: false,
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      error: "로그인 중 오류가 발생했습니다.",
      success: false,
    };
  }
} 