// app/page.tsx (또는 해당 파일 경로)
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-start justify-center p-6 pt-20">
      {/* 큰 상자: flex-col 로 바꿔서 내부 맨 아래에 푸터 고정 */}
      <div className="flex h-[600px] w-full max-w-6xl flex-col rounded-2xl border bg-white p-16 shadow-lg">
        {/* 메인 콘텐츠 (좌/우) */}
        <div className="flex flex-1 gap-12">
          {/* LEFT: 로고 크게 */}
          <div className="flex flex-1 items-center justify-center">
            <div className="relative h-[240px] w-[500px]">
              <Image
                src="/logo.png"
                alt="iSBOMB Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* RIGHT: DID 로그인 + 대시보드 */}
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-4xl font-bold">DID 로그인</h1>
            <p className="mt-4 leading-relaxed text-lg text-gray-600">
              DID로 신원을 증명하고 역할(개발사 / 규제기관 / 감독기관)에 맞춘
              전용 대시보드를 사용하세요.
            </p>

            <div className="mt-8">
              <Link
                href="/login"
                className="rounded-2xl bg-black px-8 py-4 text-lg font-semibold text-white hover:opacity-90"
              >
                DID 로그인
              </Link>
            </div>

            <div className="mt-12">
              <div className="text-lg font-semibold">대시보드 미리보기</div>
              <p className="mt-2 text-sm text-gray-500">
                * 프리뷰용: 로그인 우회를 위해 쿠키를 설정합니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    router.push("/dashboard/developer?dev=1&as=developer")
                  }
                  className="rounded-xl border px-6 py-3 text-lg hover:bg-gray-50"
                >
                  개발사(Developer)
                </button>
                <button
                  onClick={() =>
                    router.push("/dashboard/regulator?dev=1&as=regulator")
                  }
                  className="rounded-xl border px-6 py-3 text-lg hover:bg-gray-50"
                >
                  규제기관(Regulator)
                </button>
                <button
                  onClick={() =>
                    router.push("/dashboard/supervisor?dev=1&as=supervisor")
                  }
                  className="rounded-xl border px-6 py-3 text-lg hover:bg-gray-50"
                >
                  감독기관(Watchdog)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터: 로그인 페이지와 동일한 위치/스타일 */}
        <div className="mt-8 text-center text-sm text-gray-400">
          © 2025 iSBOMB • All rights reserved
        </div>
      </div>
    </div>
  );
}
