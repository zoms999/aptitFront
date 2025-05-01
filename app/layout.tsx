import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "../src/providers/SessionProvider";
import { ThemeProvider } from "../src/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "옥타그노시스",
  description: "옥타그노시스 Front Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider defaultTheme="dark">
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
} 