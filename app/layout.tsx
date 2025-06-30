import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "../src/providers/SessionProvider";
import { ThemeProvider } from "../src/providers/ThemeProvider";
import { nanumSquareNeoVariable } from "../lib/fonts";

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
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${nanumSquareNeoVariable.variable} font-sans`}>
        <SessionProvider>
          <ThemeProvider defaultTheme="dark">
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
} 