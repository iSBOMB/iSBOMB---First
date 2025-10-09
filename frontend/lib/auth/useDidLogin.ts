import { useCallback, useMemo, useState } from "react";
import type { LoginResult, AuthAdapter } from "./types";
import { AriesAdapter } from "./adapters/aries";

export function useDidLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 👇 어댑터를 AuthAdapter로 명시
  const adapter: AuthAdapter = useMemo(
    () => new AriesAdapter(process.env.NEXT_PUBLIC_BACKEND),
    []
  );

  const start = useCallback(
    async (nextPath?: string): Promise<LoginResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await adapter.start(nextPath); // 이제 에러 없음
        return res;
      } catch (e: any) {
        setError(e?.message || "로그인 실패");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [adapter]
  );

  return { start, loading, error };
}
