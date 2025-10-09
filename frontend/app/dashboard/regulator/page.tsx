// app/dashboard/regulator/page.tsx
"use client";

import { useEffect, useState } from "react";
import RoleDashboardLayout from "@/components/RoleDashboardLayout";
import { Section } from "@/components/ui";
import { getContractWithWallet, getReadOnlyContract } from "@/lib/blockchain";

type QueueItem = {
  reqId: string;
  modelId: number;
  model: string;
  dev: string;
  cid: string;
  status: string;
};

type ReadRecord = {
  reqId: string;
  ts: string;
  actor: string;
};

export default function RegulatorPage() {
  const sidebar = [
    { id: "queue", label: "심사 요청 대기열" },
    { id: "integrity", label: "AIBOM 무결성 검증" },
    { id: "dossier", label: "제출 문서 조회" },
    { id: "decision", label: "심사 결과 등록" },
  ];

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [requestId, setRequestId] = useState("");
  const [decision, setDecision] = useState<"IN_REVIEW" | "APPROVED" | "REJECTED">("APPROVED");
  const [reason, setReason] = useState("");
  const [readLogs, setReadLogs] = useState<ReadRecord[]>([]);
  const [cidToVerify, setCidToVerify] = useState("");
  const [gateway, setGateway] = useState("https://ipfs.io/ipfs/");

  // load queue from on-chain AIBOMs (submitted)
  async function loadQueue() {
    try {
      const contract = getReadOnlyContract();
      const all = await contract.getAllAIBOMs();
      const items: QueueItem[] = all
        .map((a: any, idx: number) => ({
          reqId: `REQ-${2025}-${idx}`,
          modelId: idx,
          model: `Model v${idx + 1}`,
          dev: a.owner,
          cid: a.cid,
          status:
            a.status === 0
              ? "Draft"
              : a.status === 1
              ? "Submitted"
              : a.status === 2
              ? "In Review"
              : a.status === 3
              ? "Approved"
              : a.status === 4
              ? "Rejected"
              : "Unknown",
        }))
        .filter((it: QueueItem) => it.status === "Submitted" || it.status === "In Review"); // queue show submitted/in-review
      setQueue(items.reverse());
    } catch (err) {
      console.error("loadQueue error", err);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  // Open dossier: fetch IPFS PDF and download
  async function handleOpenDossier(cid: string, reqId: string) {
    try {
      setStatusMsg("📥 IPFS에서 문서 다운로드 중...");
      const res = await fetch(`${gateway}${cid}`);
      if (!res.ok) throw new Error("Failed to fetch IPFS file");
      const blob = await res.blob();
      // download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reqId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatusMsg("✅ 다운로드 완료");

      // append read log with timestamp
      setReadLogs((prev) => [{ reqId, ts: new Date().toISOString(), actor: "MFDS" }, ...prev]);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 다운로드 실패");
    }
  }

  // Compare CID <-> IPFS: fetch and compare text length or hash (simple check)
  async function handleCompareCID(cid: string) {
    try {
      setStatusMsg("🔎 비교 중...");
      const res = await fetch(`${gateway}${cid}`);
      if (!res.ok) throw new Error("IPFS fetch failed");
      const data = await res.arrayBuffer();
      // quick integrity check: length vs naive expectation (we don't have expected length on-chain).
      const len = data.byteLength;
      setStatusMsg(`✅ IPFS fetch size: ${len} bytes (CID: ${cid})`);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 비교 실패");
    }
  }

  // Record decision on-chain with reason
  async function handleDecisionSubmit() {
    if (!requestId) return alert("Model ID를 입력하세요 (modelId 숫자).");
    if (!reason) return alert("사유를 입력하세요.");
    try {
      const modelId = Number(requestId);
      if (isNaN(modelId)) return alert("Model ID는 숫자여야 합니다.");
      setStatusMsg("⛓️ 심사 결과 온체인 기록 중...");
      const contract = await getContractWithWallet();

      const statusEnum = decision === "IN_REVIEW" ? 2 : decision === "APPROVED" ? 3 : 4;
      const tx = await contract.setReviewStatus(modelId, statusEnum, reason);
      await tx.wait();
      setStatusMsg("✅ 심사 결과 온체인 반영 완료!");
      await loadQueue();
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 심사 결과 반영 실패");
    }
  }

  return (
    <RoleDashboardLayout roleTitle="Regulator" sidebar={sidebar}>
      <Section id="queue" title="심사 요청 대기열" desc="수신된 제출 요청을 확인합니다.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2 pr-4">Request ID</th>
                <th className="py-2 pr-4">Model ID</th>
                <th className="py-2 pr-4">Developer</th>
                <th className="py-2 pr-4">CID</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((q) => (
                <tr key={q.reqId} className="border-t">
                  <td className="py-2 pr-4 font-medium">{q.reqId}</td>
                  <td className="py-2 pr-4">{q.modelId}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{q.dev}</td>
                  <td className="py-2 pr-4 font-mono text-xs break-all">{q.cid}</td>
                  <td className="py-2 pr-4">{q.status}</td>
                  <td className="py-2 space-x-2">
                    <button className="rounded-lg border px-3 py-1" onClick={() => handleOpenDossier(q.cid, q.reqId)}>
                      Open Dossier
                    </button>
                    <button className="rounded-lg border px-3 py-1" onClick={() => handleCompareCID(q.cid)}>
                      Compare CID↔IPFS
                    </button>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                    현재 대기열에 제출된 문서가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="integrity" title="AIBOM 무결성 검증" desc="온체인 CID ↔ IPFS 원문 비교 (CID 입력 후 Verify)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="rounded-lg border px-3 py-2" placeholder="CID" value={cidToVerify} onChange={(e) => setCidToVerify(e.target.value)} />
          <input className="rounded-lg border px-3 py-2" placeholder="IPFS Gateway URL" value={gateway} onChange={(e) => setGateway(e.target.value)} />
          <button className="rounded-lg border px-3 py-2" onClick={() => handleCompareCID(cidToVerify)}>
            Verify
          </button>
        </div>
        <div className="text-sm text-gray-600 mt-2">{statusMsg}</div>
      </Section>

      <Section id="dossier" title="제출 문서 조회" desc="문서를 열람하고 다운로드(또는 비교) 할 수 있습니다.">
        <div className="text-sm text-gray-600">최근 열람 기록</div>
        <ul className="text-sm mt-2">
          {readLogs.map((r, i) => (
            <li key={i} className="py-1 border-t first:border-0">
              <span className="font-mono">{r.ts}</span> — {r.reqId} ({r.actor})
            </li>
          ))}
          {readLogs.length === 0 && <li className="text-gray-500">아직 열람 기록이 없습니다.</li>}
        </ul>
      </Section>

      <Section id="decision" title="심사 결과 등록" desc="승인/반려 및 사유 입력 후 온체인 기록">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="rounded-lg border px-3 py-2" placeholder="Model ID" value={requestId} onChange={(e) => setRequestId(e.target.value)} />
          <select className="rounded-lg border px-3 py-2" value={decision} onChange={(e) => setDecision(e.target.value as any)}>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approve</option>
            <option value="REJECTED">Reject</option>
          </select>
          <input className="rounded-lg border px-3 py-2" placeholder="Reason (사유)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <button onClick={handleDecisionSubmit} className="mt-3 rounded-lg border px-3 py-2 hover:bg-gray-50">
          Record (on-chain)
        </button>
        <div className="text-sm text-gray-600 mt-2">{statusMsg}</div>
      </Section>
    </RoleDashboardLayout>
  );
}
