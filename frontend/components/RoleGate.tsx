// frontend/components/RoleGate.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "developer" | "regulator" | "supervisor";

type Props = {
  /** 이 페이지에 접근을 허용할 역할 목록 */
  allow: Role[];
  /** 허용 시 렌더링할 실제 내용 */
  children: ReactNode;
  /** 권한 없을 때 이동할 경로 (기본: /login) */
  redirectTo?: string;
  /** 권한 없을 때 보여줄 대체 UI (설정 시 redirect 대신 렌더) */
  fallback?: ReactNode;
  /** 프리뷰 허용 여부 (?as=developer 등) 기본: true */
  enablePreviewParam?: boolean;
  /** 프리뷰용 쿼리 파라미터 이름 기본: "as" */
  previewParamName?: string;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const found = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split("=")[1]) : null;
}

export default function RoleGate({
  allow,
  children,
  redirectTo = "/login",
  fallback,
  enablePreviewParam = true,
  previewParamName = "as",
}: Props) {
  const router = useRouter();
  const search = useSearchParams();

  const [ready, setReady] = useState(false);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);

  // 1) 프리뷰 파라미터 (?as=developer) 우선
  const previewRole = useMemo(() => {
    if (!enablePreviewParam) return null;
    const v = search.get(previewParamName);
    if (!v) return null;
    const low = v.toLowerCase();
    return (["developer", "regulator", "supervisor"].includes(low)
      ? low
      : null) as Role | null;
  }, [search, enablePreviewParam, previewParamName]);

  // 2) 쿠키 → 3) localStorage 순으로 역할 확인
  useEffect(() => {
    let role: Role | null = null;

    if (previewRole) {
      role = previewRole;
    } else {
      const cookieRole = getCookie("role");
      if (
        cookieRole &&
        ["developer", "regulator", "supervisor"].includes(cookieRole)
      ) {
        role = cookieRole as Role;
      } else if (typeof window !== "undefined") {
        const ls = localStorage.getItem("role");
        if (ls && ["developer", "regulator", "supervisor"].includes(ls)) {
          role = ls as Role;
        }
      }
    }

    const ok = !!role && allow.includes(role as Role);
    setIsAllowed(ok);
    setReady(true);

    // 권한 없고 fallback 미지정이면 리다이렉트
    if (!ok && !fallback) {
      router.replace(redirectTo);
    }
  }, [allow, previewRole, redirectTo, fallback, router]);

  if (!ready) {
    return (
      <div className="p-6 text-sm text-gray-600">권한 확인 중…</div>
    );
  }

  if (!isAllowed) {
    return (
      fallback ?? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="text-lg font-semibold">접근 권한이 없습니다.</div>
          <p className="mt-2 text-sm text-gray-600">
            로그인 후 다시 시도하세요.
          </p>
          <a href={redirectTo} className="mt-3 rounded-xl border px-4 py-2">
            로그인으로 이동
          </a>
        </div>
      )
    );
  }

  return <>{children}</>;
}
