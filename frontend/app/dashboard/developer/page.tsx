"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import RoleGate from "@/components/RoleGate";
import RoleDashboardLayout from "@/components/RoleDashboardLayout";
import { Section } from "@/components/ui";
import { uploadToPinata } from "@/lib/ipfs";
import { getContractWithWallet, getReadOnlyContract } from "@/lib/blockchain";
import { ethers } from "ethers";

type AibomStatus = "Draft" | "Submitted" | "In Review" | "Approved" | "Rejected" | "Unknown";

type Model = {
  modelId: number;
  version: string;
  released: string;
  cid: string;
  aibom: AibomStatus;
  reason?: string;
};

type Draft = {
  id: string;
  updated: string;
  content: string;
};

type AdvisoryView = {
  cid: string;
  scope: string;
  action: string;
  timestamp: number;
  reporter: string;
};

export default function DeveloperPage() {
  const sidebar = [
    { id: "aibom", label: "AIBOM 등록" },
    { id: "docs", label: "인허가 문서 생성" },
    { id: "review", label: "심사 요청/상태" },
  ];

  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [openDraft, setOpenDraft] = useState<Draft | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [advisories, setAdvisories] = useState<Record<number, AdvisoryView[]>>({});

  // load models from chain
  async function loadModels() {
    try {
      const contract = getReadOnlyContract();
      const all: any[] = await contract.getAllAIBOMs();
      const parsed: Model[] = all.map((a: any, idx: number) => ({
        modelId: idx,
        version: `v1.${idx + 1}.0`,
        released: new Date(
          a.timestamp.toNumber ? a.timestamp.toNumber() * 1000 : Number(a.timestamp) * 1000
        )
          .toISOString()
          .split("T")[0],
        cid: a.cid,
        aibom:
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
        reason: a.reviewReason ?? "",
      }));
      setModels(parsed.reverse());
    } catch (err) {
      console.error("loadModels error", err);
    }
  }

  useEffect(() => {
    loadModels();
    const id = setInterval(loadModels, 10000);
    return () => clearInterval(id);
  }, []);

  // IPFS upload for AIBOM file
  async function handleUpload() {
    if (!file) return alert("파일을 선택하세요!");
    try {
      setStatusMsg("📤 IPFS 업로드 중...");
      const uploadedCid = await uploadToPinata(file);
      setCid(uploadedCid);
      setStatusMsg(`✅ IPFS 업로드 완료 (CID: ${uploadedCid})`);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ IPFS 업로드 실패");
    }
  }

  // register on chain
  async function handleRegister() {
    if (!cid) return alert("CID가 없습니다.");
    try {
      setStatusMsg("⛓️ 온체인 등록 중...");
      const contract = await getContractWithWallet();
      const tx = await contract.registerAIBOM(cid);
      await tx.wait();
      setStatusMsg("✅ 온체인 등록 완료!");
      await loadModels();
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 온체인 등록 실패");
    }
  }

  // Generate draft via LLM (backend API) - same as before (backend not in scope)
  async function handleGenerateFromAIBOM() {
    if (!cid) return alert("AIBOM CID가 없습니다.");
    try {
      setStatusMsg("🧠 인허가 문서 생성 중...");
      const res = await fetch("/api/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid }),
      });
      const data = await res.json();
      const content = data?.content ?? `MFDS 인허가 문서 초안\n\nAIBOM CID: ${cid}\n생성일: ${new Date().toISOString()}`;
      const newDraft: Draft = {
        id: `MFDS-${Date.now()}`,
        updated: new Date().toISOString().split("T")[0],
        content,
      };
      setDrafts((p) => [newDraft, ...p]);
      setStatusMsg("✅ 인허가 문서 초안 생성 완료!");
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 인허가 문서 생성 실패");
    }
  }

  // Export draft to PDF (client-side)
  function handleExportPDF(draft: Draft) {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(draft.content, 180);
    doc.text(lines, 10, 10);
    doc.save(`${draft.id}.pdf`);
  }

  // Submit selected PDF to regulator: upload PDF to IPFS then submitReview(modelId, cid)
  async function handleSendPDFToRegulator() {
    if (!pdfFile) return alert("PDF 파일을 선택하세요!");
    if (selectedModel === null) return alert("제출할 모델을 선택하세요!");
    try {
      setStatusMsg("📤 PDF IPFS 업로드 중...");
      const docCid = await uploadToPinata(pdfFile);
      setStatusMsg("⛓️ 온체인 제출 중...");
      const contract = await getContractWithWallet();
      const tx = await contract.submitReview(selectedModel, docCid);
      await tx.wait();
      setStatusMsg(`✅ 규제기관에 제출 완료 (modelId=${selectedModel}, CID=${docCid})`);
      await loadModels();
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 규제기관 제출 실패");
    }
  }

  // fetch advisories for a model (developers can view advisories for their models)
  async function loadAdvisoriesForModel(modelId: number) {
    try {
      const contract = getReadOnlyContract();
      const raw: any[] = await contract.getAdvisories(modelId);
      const parsed: AdvisoryView[] = raw.map((r: any) => ({
        cid: r.cid,
        scope: r.scope,
        action: r.action,
        timestamp: r.timestamp.toNumber ? r.timestamp.toNumber() : Number(r.timestamp),
        reporter: r.reporter,
      }));
      setAdvisories((prev) => ({ ...prev, [modelId]: parsed }));
    } catch (err) {
      console.error("loadAdvisories error", err);
    }
  }

  // preview modal + UI
  return (
    <RoleGate allow={["developer"]}>
      <RoleDashboardLayout roleTitle="Developer" sidebar={sidebar}>
        {/* AIBOM 등록 */}
        <Section id="aibom" title="AI 모델 및 AIBOM 등록" desc="IPFS 업로드 → CID 온체인 기록">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="mt-2 space-x-2">
            <button onClick={handleUpload} className="rounded-lg border px-3 py-1">
              Upload to IPFS
            </button>
            <button onClick={handleRegister} className="rounded-lg border px-3 py-1">
              Register (on-chain)
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-700">{statusMsg}</div>
        </Section>

        {/* 문서 생성 / 제출 */}
        <Section id="docs" title="인허가 문서 생성" desc="LLM 기반 초안 생성 · PDF 제출 · 규제기관 전송">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* left: Generate */}
            <div className="rounded-xl border p-3">
              <div className="text-sm font-medium mb-2">New draft</div>
              <button onClick={handleGenerateFromAIBOM} className="rounded-lg border px-3 py-2 w-full">
                Generate from AIBOM
              </button>
            </div>

            {/* middle: drafts */}
            <div className="rounded-xl border p-3">
              <div className="text-sm font-medium mb-2">Drafts</div>
              {drafts.length === 0 && <div className="text-sm text-gray-500">생성된 초안이 없습니다.</div>}
              {drafts.map((d) => (
                <div key={d.id} className="flex justify-between items-center py-1">
                  <div>
                    <div className="font-medium">{d.id}</div>
                    <div className="text-gray-500 text-xs">Updated {d.updated}</div>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => setOpenDraft(d)} className="rounded-lg border px-3 py-1">
                      Open
                    </button>
                    <button onClick={() => handleExportPDF(d)} className="rounded-lg border px-3 py-1">
                      Export PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* right: send PDF to regulator */}
            <div className="rounded-xl border p-3">
              <div className="text-sm font-medium mb-2">Send to Regulator</div>

              <select
                className="w-full rounded border px-2 py-1 mb-2"
                value={selectedModel ?? ""}
                onChange={(e) => setSelectedModel(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">Select Model</option>
                {models.map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.modelId} — {m.version} ({m.aibom})
                  </option>
                ))}
              </select>

              <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} className="mb-2 w-full text-sm" />

              {/* Send button style as requested: black text, white background */}
              <button
                onClick={handleSendPDFToRegulator}
                className="rounded-lg border border-gray-300 px-3 py-2 bg-white text-black hover:bg-gray-50 transition w-full"
              >
                Send PDF to Regulator
              </button>
            </div>
          </div>
        </Section>

        {/* 심사 요청/상태 */}
        <Section id="review" title="심사 요청/상태" desc="온체인 심사 상태 자동 동기화 (10초 주기)">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">DRAFT → SUBMITTED → IN_REVIEW → APPROVED/REJECTED</div>
            <button onClick={loadModels} className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50">
              🔄 Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Model ID</th>
                  <th className="py-2 pr-4">CID</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4">Advisories</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.modelId} className="border-t">
                    <td className="py-2 pr-4">{m.modelId}</td>
                    <td className="py-2 pr-4 font-mono text-xs break-all">{m.cid}</td>
                    <td className="py-2 pr-4 font-medium">{m.aibom}</td>
                    <td className="py-2 pr-4 text-gray-600">{m.reason && m.reason.length > 0 ? m.reason : "—"}</td>
                    <td className="py-2 pr-4">{m.released}</td>
                    <td className="py-2 pr-4">
                      <button
                        className="rounded-lg border px-3 py-1 text-xs"
                        onClick={() => loadAdvisoriesForModel(m.modelId)}
                      >
                        Load Advisories
                      </button>
                      <div className="text-xs mt-1">
                        {advisories[m.modelId] && advisories[m.modelId].length > 0 ? (
                          advisories[m.modelId].map((a, i) => (
                            <div key={i} className="text-gray-700">
                              <div className="font-mono text-xs">{a.cid}</div>
                              <div className="text-xs">Scope:{a.scope} Action:{a.action}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-xs">No advisories</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* preview modal */}
        {openDraft && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">{openDraft.id}</h2>
                <button onClick={() => setOpenDraft(null)}>✕</button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{openDraft.content}</pre>
            </div>
          </div>
        )}
      </RoleDashboardLayout>
    </RoleGate>
  );
}
