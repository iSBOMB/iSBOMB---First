// components/logout.ts
"use client";

export function logout() {
  // 데모용: 클라이언트 쿠키/스토리지 정리
  document.cookie = "role=; Max-Age=0; path=/";
  localStorage.removeItem("role");
  localStorage.removeItem("token");
  window.location.href = "/";
}
