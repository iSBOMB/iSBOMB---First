// components/RoleDashboardLayout.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logout } from "@/components/logout";

type NavItem = { id: string; label: string };

type LayoutProps = {
  roleTitle: string;            // Developer / Regulator / Watchdog
  sidebar: NavItem[];           // 좌측 메뉴
  children: React.ReactNode;    // 메인 콘텐츠
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const found = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split("=")[1]) : null;
}

export default function RoleDashboardLayout({
  roleTitle,
  sidebar,
  children,
}: LayoutProps) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const cookieRole = getCookie("role");
    const lsRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    setRole(cookieRole ?? lsRole);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Left: Brand / Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-base font-semibold hover:opacity-80">
              iSBOMB
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-700">AIBOM {roleTitle} Dashboard</span>
          </div>

          {/* Center: Search (md up) */}
          <div className="hidden md:block w-[28rem]">
            <input
              placeholder="Search models, releases, dossiers…"
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          {/* Right: Role & Logout */}
          <div className="flex items-center gap-3">
            {role && (
              <span className="rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                {role}
              </span>
            )}
            <button
              onClick={logout}
              className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* 2-Column Layout (좌측 메뉴 + 메인) */}
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-6">
        {/* Left Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="sticky top-20">
            <div className="mb-2 text-sm font-medium text-gray-500">Menu</div>
            <nav className="space-y-1">
              {sidebar.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">{children}</main>
      </div>
    </div>
  );
}
