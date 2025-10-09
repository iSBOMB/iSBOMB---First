import "../styles/tailwind.css";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "iSBOMB",
  description: "AIBOM-based medical AI compliance portal",
  icons: {
    icon: "/logo.png", 
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {/* 헤더 */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur">
        <Link href="/" className="flex items-center">
        {/* 로고 대신 텍스트 */}
        <span className="text-2xl font-bold tracking-tight">iSBOMB</span>
        </Link>
        <div />
        </header>


        {/* 메인 */}
        <main className="mx-auto w-full max-w-7xl p-4">{children}</main>
      </body>
    </html>
  );
}
