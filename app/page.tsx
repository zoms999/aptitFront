import LoginForm from "@/components/LoginForm";
import Header from "@/components/Header";

export default function Home() {
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
              <span>© 2025 Aptit. All rights reserved.</span>
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