"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function LoginPage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrMsg, setQrMsg] = useState("");

  async function handleQrLogin(role: string) {
    setQrMsg("QR 초대장 생성 중...");
    try {
      const res = await fetch(
        `http://localhost:8000/api/login/request/${role}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("초대장 생성 실패");

      const data = await res.json();
      setQrUrl(data.invitation_url);
      setQrMsg("스마트 월렛에서 QR을 스캔하세요!");
    } catch (err) {
      console.error(err);
      setQrMsg("❌ QR 생성 실패");
    }
  }

  const [did, setDid] = useState("");
  const [agent, setAgent] = useState("developer");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  async function handleDidLogin() {
    if (!did.trim()) return;
    setLoading(true);
    setStatusMsg("로그인 시작...");

    try {
      const res = await fetch("http://localhost:8000/api/login/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connection_id: did.trim(),
          agent: agent,
        }),
      });

      if (!res.ok) {
        setStatusMsg("❌ 로그인 실패");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("jwt", data.token);

      let seconds = 2;
      setStatusMsg(
        `✅ 로그인 성공! DID: ${data.connection_id} (${seconds}초 후 이동)`
      );

      const interval = setInterval(() => {
        seconds -= 1;
        setStatusMsg(
          `✅ 로그인 성공! DID: ${data.connection_id} (${seconds}초 후 이동)`
        );
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        const rolePath = (data.role || "").toLowerCase().trim();
        window.location.href = `/dashboard/${rolePath}`;
      }, 200);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 오류 발생");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50">
      <div className="mt-20 flex w-full max-w-5xl flex-row gap-8 rounded-2xl border bg-white p-10 shadow-lg">
        {/* 좌측: QR 로그인 */}
        <div className="flex w-1/2 flex-col items-center">
          <h2 className="mb-4 text-2xl font-bold">QR 코드 로그인</h2>

          <div className="flex gap-2">
            <button
              onClick={() => handleQrLogin("developer")}
              className="rounded-xl bg-gray-400 px-6 py-3 text-white hover:opacity-90 disabled:opacity-50"
            >
              Developer QR
            </button>
            <button
              onClick={() => handleQrLogin("regulator")}
              className="rounded-xl bg-gray-400 px-6 py-3 text-white hover:opacity-90 disabled:opacity-50"
            >
              Regulator QR
            </button>
            <button
              onClick={() => handleQrLogin("supervisor")}
              className="rounded-xl bg-gray-400 px-6 py-3 text-white hover:opacity-90 disabled:opacity-50"
            >
              Supervisor QR
            </button>
          </div>

          {qrUrl && (
            <div className="mt-6 flex flex-col items-center">
              <QRCodeCanvas value={qrUrl} size={220} />
              <p className="mt-4 break-all rounded-lg border bg-gray-100 p-2 text-xs text-gray-700">
                {qrUrl}
              </p>
            </div>
          )}

          {qrMsg && <p className="mt-4 text-sm text-gray-600">{qrMsg}</p>}
        </div>

        {/* 우측: DID 로그인 */}
        <div className="flex w-1/2 flex-col">
          <h2 className="mb-4 text-2xl font-bold">DID 로그인</h2>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="예) connection_id 입력"
            value={did}
            onChange={(e) => setDid(e.target.value)}
          />

          <select
            className="mt-3 w-full rounded-lg border px-3 py-2"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
          >
            <option value="developer">Developer</option>
            <option value="regulator">Regulator</option>
            <option value="supervisor">Supervisor</option>
          </select>

          <button
            onClick={handleDidLogin}
            disabled={loading || !did.trim()}
            className="mt-5 rounded-xl bg-black px-6 py-3 text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "DID로 로그인"}
          </button>
          {statusMsg && <p className="mt-4 text-sm">{statusMsg}</p>}
        </div>
      </div>
    </div>
  );
}
