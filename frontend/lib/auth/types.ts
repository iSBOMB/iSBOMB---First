// 역할 타입과 로그인 결과, 어댑터 인터페이스 정의

export type Role = "developer" | "regulator" | "supervisor";

export interface LoginResult {
  role: Role;
  token?: string; // 백엔드에서 JWT 등을 주면 여기로
}

export interface AuthAdapter {
  /**
   * 로그인 절차 시작 (버튼 클릭 1번으로 전체 플로우 수행)
   * 성공 시 역할/토큰 반환. 실패 시 에러 throw.
   */
  start(nextPath?: string): Promise<LoginResult>;
}
