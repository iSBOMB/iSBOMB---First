// frontend/app/dashboard/supervisor/page.tsx
"use client";

import { useState } from "react";
import RoleDashboardLayout from "@/components/RoleDashboardLayout";
import { Section } from "@/components/ui";
import {
  getApprovedSubmissionsForSupervisor,
  recordAdvisoryOnChain,
  reportVulnerabilityOnChain,
  readAdvisories,
  readVulnerabilities,
  getWalletAddress,
} from "@/lib/blockchain";
import { ethers } from "ethers";

// TODO: Replace with your actual contract address or import from config
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

type BroadcastLog = { ts: string; results?: any };

export default function SupervisorPage() {
  const sidebar = [
    { id: "vuln", label: "승인된 AI 문서 수신" },
    { id: "vulnerability", label: "취약점 분석 및 보고" },
    { id: "broadcast", label: "경고 전파 내역" },
  ];

  const [modelId, setModelId] = useState<string>("");
  const [submissions, setSubmissions] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const [advisoryCid, setAdvisoryCid] = useState<string>(""); // 감독자가 올린 advisory의 CID(또는 요약 텍스트)
  const [advisoryScope, setAdvisoryScope] = useState<string>("");
  const [advisoryAction, setAdvisoryAction] = useState<string>("");

  const [vulnCid, setVulnCid] = useState<string>("");
  const [severity, setSeverity] = useState<string>("HIGH");

  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);
  const [advisoriesList, setAdvisoriesList] = useState<any[]>([]);
  const [vulnerabilitiesList, setVulnerabilitiesList] = useState<any[]>([]);

  // 1) 승인된 모델의 제출문서 가져오기 (supervisor 권한으로 호출)
  async function handleLoadApprovedSubmissions() {
    if (!modelId) return alert("모델 ID를 입력하세요.");
    try {
      setStatusMsg("🔐 메타마스크 연결 및 제출문서 조회 중...");
      const arr = await getApprovedSubmissionsForSupervisor(Number(modelId));
      setSubmissions(arr);
      setStatusMsg(`✅ 제출문서 ${arr.length}개 조회됨`);
    } catch (err: any) {
      console.error(err);
      const msg = (err?.data?.message || err?.error?.message || err?.message) ?? String(err);
      if (msg.includes("Model not approved")) {
        setStatusMsg("⚠️ 해당 모델은 아직 규제기관 승인 상태가 아닙니다.");
      } else if (msg.includes("Not authorized")) {
        setStatusMsg("⚠️ 권한이 없습니다. 감독자 계정으로 로그인하거나 owner가 addSupervisor 해야 합니다.");
      } else {
        setStatusMsg(`⚠️ 조회 실패: ${msg}`);
      }
    }
  }

  // 2) Supervisor -> Advisory 온체인 등록
  async function handleSaveAdvisory() {
    if (!modelId) return alert("모델 ID를 입력하세요.");
    if (!advisoryCid && !advisoryAction) return alert("권고 요약 또는 CID/Action을 입력하세요.");
    try {
      setStatusMsg("⛓️ 온체인 권고 등록 중...");
      const receipt = await recordAdvisoryOnChain(
        Number(modelId),
        advisoryCid || "N/A",
        advisoryScope || "N/A",
        advisoryAction || "N/A"
      );
      setStatusMsg(`✅ 권고 등록 완료 (tx: ${receipt.transactionHash ?? "n/a"})`);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 권고 등록 실패");
    }
  }

  // 3) 취약점 온체인 보고 (owner 권한 필요)
  async function handleReportVuln() {
    if (!modelId) return alert("모델 ID를 입력하세요.");
    if (!vulnCid) return alert("취약점 CID를 입력하세요.");
    try {
      setStatusMsg("⛓️ 취약점 보고 중 (owner 권한 필요)...");
      const r = await reportVulnerabilityOnChain(Number(modelId), vulnCid, severity);
      setStatusMsg(`✅ 취약점 보고 완료 (tx: ${r.transactionHash ?? "n/a"})`);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 취약점 보고 실패 (owner 권한인지 확인하세요)");
    }
  }

  // 4) 로컬(읽기)으로 advisories, vulnerabilities 가져오기 (UI 업데이트용)
  async function handleLoadAdvisoriesAndVulns() {
    if (!modelId) return alert("모델 ID를 입력하세요.");
    try {
      // readAdvisories, readVulnerabilities 는 blockchain.ts 에 정의되어 있음
      // (여기서는 간단히 rpc 호출 - 만약 필요하면 위 함수를 사용)
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545");
      const c = new ethers.Contract(CONTRACT_ADDRESS, (await import("@/data/AIBOMRegistry.json")).default.abi, provider);
      const advs = await c.getAdvisories(Number(modelId));
      const vulns = await c.getVulnerabilities(Number(modelId));
      setAdvisoriesList(advs ?? []);
      setVulnerabilitiesList(vulns ?? []);
      setStatusMsg("✅ 조회완료");
    } catch (err) {
      console.error(err);
      setStatusMsg("⚠️ 추가 데이터 조회 실패");
    }
  }

  // 5) Broadcast (모의)
  async function handleBroadcast() {
    if (!advisoryCid) return alert("먼저 권고를 등록하세요 (또는 CID 입력).");
    const log: BroadcastLog = {
      ts: new Date().toLocaleString(),
      results: { advisoryCid, recipients: ["Developer"], status: "Sent (mock)" },
    };
    setBroadcastLogs((p) => [log, ...p]);
    setStatusMsg("📡 전파(모의) 완료");
  }

  return (
    <RoleDashboardLayout roleTitle="Supervisor" sidebar={sidebar}>
      {/**/}

      <Section id="vuln" title="승인된 AI 문서 수신" desc="규제기관이 APPROVED 처리한 모델의 제출문서(CID)를 조회합니다.">
        <div className="flex gap-2 mb-2">
          <input className="rounded-lg border px-3 py-2 w-48" placeholder="Model ID" value={modelId} onChange={(e) => setModelId(e.target.value)} />
          <button className="rounded-lg border px-3 py-2 bg-gray-100" onClick={handleLoadApprovedSubmissions}>제출문서 조회</button>
          <button className="rounded-lg border px-3 py-2" onClick={handleLoadAdvisoriesAndVulns}>관련 권고/취약점 조회</button>
        </div>

        <div className="text-sm text-gray-600">{statusMsg}</div>

        <div className="mt-2">
          {submissions.length === 0 && <div className="text-sm text-gray-500">조회된 제출문서가 없습니다.</div>}
          {submissions.map((c, i) => (
            <div key={i} className="py-1 border-t">
              <div className="font-mono text-xs break-all">{c}</div>
              <a className="text-sm text-blue-600" href={`https://ipfs.io/ipfs/${c}`} target="_blank" rel="noreferrer">Open on IPFS</a>
            </div>
          ))}
        </div>
      </Section>

      <Section id="vulnerability" title="취약점 분석 및 보고" desc="문서/취약점 발견 시 온체인 보고 및 권고 작성">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="rounded-lg border px-3 py-2" placeholder="모델 ID (또는 Model version)" value={modelId} onChange={(e) => setModelId(e.target.value)} />
          <input className="rounded-lg border px-3 py-2" placeholder="발견된 취약점 CID (or description)" value={vulnCid} onChange={(e) => setVulnCid(e.target.value)} />
          <select className="rounded-lg border px-3 py-2" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="rounded-lg border px-3 py-2" onClick={handleReportVuln}>온체인 취약점 보고 (owner 필요)</button>
          <button className="rounded-lg border px-3 py-2" onClick={handleLoadAdvisoriesAndVulns}>권고/취약점 새로고침</button>
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium mb-2">보안 권고 (Supervisor)</div>
          <input className="rounded border px-2 py-1 text-sm w-full" placeholder="권고 문서 CID (또는 요약)" value={advisoryCid} onChange={(e) => setAdvisoryCid(e.target.value)} />
          <input className="rounded border px-2 py-1 text-sm w-full mt-2" placeholder="Scope (예: v1.3.x)" value={advisoryScope} onChange={(e) => setAdvisoryScope(e.target.value)} />
          <input className="rounded border px-2 py-1 text-sm w-full mt-2" placeholder="Action (예: 패치 권고)" value={advisoryAction} onChange={(e) => setAdvisoryAction(e.target.value)} />

          <div className="flex gap-2 mt-3">
            <button className="rounded-lg border px-3 py-2" onClick={handleSaveAdvisory}>Save Advisory (On-chain)</button>
            <button className="rounded-lg border px-3 py-2" onClick={handleBroadcast}>Broadcast Advisory (mock)</button>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium">온체인에 기록된 권고</div>
            {advisoriesList.length === 0 && <div className="text-sm text-gray-500">권고가 없습니다.</div>}
            {advisoriesList.map((a: any, i: number) => (
              <div key={i} className="py-1 border-t text-xs">
                CID/요약: {a.cid ?? "-"} — scope: {a.scope ?? "-"} — action: {a.action ?? "-"} — by: {a.reporter ?? "-"}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium">온체인에 기록된 취약점</div>
            {vulnerabilitiesList.length === 0 && <div className="text-sm text-gray-500">기록 없음</div>}
            {vulnerabilitiesList.map((v: any, i: number) => (
              <div key={i} className="py-1 border-t text-xs">
                CID: {v.cid ?? "-"} — severity: {v.severity ?? "-"} — active: {String(v.active)} — at: {new Date(Number(v.timestamp) * 1000).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="broadcast" title="경고 전파 내역" desc="전송 결과 로그 (모의)">
        <div>
          {broadcastLogs.length === 0 && <div className="text-sm text-gray-500">전파 로그 없음</div>}
          {broadcastLogs.map((b, i) => (
            <div key={i} className="py-2 border-t">
              <div className="text-xs text-gray-500">{b.ts}</div>
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(b.results, null, 2)}</pre>
            </div>
          ))}
        </div>
      </Section>
    </RoleDashboardLayout>
  );
}
