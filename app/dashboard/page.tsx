import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">대시보드</h1>
          <p className="text-muted-foreground">환영합니다! 성공적으로 로그인되었습니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-card rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4">적성 검사 시작하기</h2>
            <p className="text-muted-foreground mb-4">
              적성 검사를 통해 자신의 강점과 적합한 직업을 알아보세요.
            </p>
            <Link
              href="/aptitude-test"
              className="block w-full py-2 px-4 text-center rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              검사 시작
            </Link>
          </div>

          <div className="p-6 bg-card rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4">이전 검사 결과</h2>
            <p className="text-muted-foreground mb-4">
              이전에 진행했던 적성 검사 결과를 확인하세요.
            </p>
            <Link
              href="/results"
              className="block w-full py-2 px-4 text-center rounded-md bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90"
            >
              결과 보기
            </Link>
          </div>

          <div className="p-6 bg-card rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4">내 정보</h2>
            <p className="text-muted-foreground mb-4">
              개인 정보 및 계정 설정을 관리합니다.
            </p>
            <Link
              href="/profile"
              className="block w-full py-2 px-4 text-center rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/90"
            >
              프로필 관리
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 