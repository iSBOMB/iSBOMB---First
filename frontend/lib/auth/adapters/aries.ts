// 변경 전: async start(): Promise<LoginResult> { ... }
// 변경 후: 선택 인자 추가(실제로는 안 써도 됨)
import type { AuthAdapter, LoginResult } from "../types";

export class AriesAdapter implements AuthAdapter {
  constructor(
    private backend = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:8000"
  ) {}

  async start(_nextPath?: string): Promise<LoginResult> {
    const connId =
      typeof window !== "undefined" ? localStorage.getItem("conn_id") : null;
    if (!connId) throw new Error("connection_id가 필요합니다.");

    const r = await fetch(`${this.backend}/login/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connection_id: connId }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.detail || "로그인 실패");

    const { role, token } = j as { role: LoginResult["role"]; token?: string };

    if (typeof document !== "undefined") {
      document.cookie = `role=${role}; path=/; SameSite=Lax`;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("role", role);
      if (token) localStorage.setItem("token", token);
    }
    return { role, token };
  }
}
