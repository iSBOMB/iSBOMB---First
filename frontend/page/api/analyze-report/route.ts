// pages/api/analyze-report.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const PINATA_KEY = process.env.PINATA_API_KEY || "";
const PINATA_SECRET = process.env.PINATA_API_SECRET || "";

// require를 사용해서 CommonJS 모듈간 호환성 문제 회피
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pinataSdk: any = PINATA_KEY && PINATA_SECRET ? require("@pinata/sdk") : null;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: any = require("pdf-parse");

async function fetchIpfsAsBuffer(cid: string): Promise<Buffer> {
  const url = `https://ipfs.io/ipfs/${cid}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`IPFS fetch failed: ${r.status}`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

// 샘플 라이브러리 탐지 (문서 텍스트에서 매우 단순히 찾음)
function detectLibraries(text: string) {
  const out: Array<{ lib: string; version?: string; raw?: string }> = [];
  const lines = text.split(/\n/);
  for (const l of lines) {
    const m = l.match(/(PyTorch|torch|OpenSSL|openssl)[\s\/:]*v?([0-9]+\.[0-9]+\.[0-9]+)/i);
    if (m) out.push({ lib: m[1], version: m[2], raw: l.trim() });
  }
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body as { docCid?: string; modelId?: number };
  const docCid = body?.docCid;
  const modelId = body?.modelId;

  if (!docCid || modelId === undefined) {
    return res.status(400).json({ error: "docCid and modelId are required" });
  }

  try {
    // 1) IPFS에서 pdf 가져오기
    const buf = await fetchIpfsAsBuffer(docCid);

    // 2) pdf -> 텍스트 (pdf-parse 사용)
    const pdfData = await pdfParse(buf);
    const text: string = pdfData?.text ?? "";

    // 3) 단순 라이브러리 탐지
    const detected = detectLibraries(text);

    // 4) (선택) OSV 등 외부 조회 - 예시로 axios 사용 (성능/비용 고려)
    const vulnResults: any[] = [];
    for (const d of detected) {
      try {
        // OSV example (간단)
        const payload = {
          package: { name: d.lib.toLowerCase().includes("torch") ? "torch" : d.lib.toLowerCase().includes("openssl") ? "openssl" : d.lib },
          version: d.version ?? "",
        };
        const osvResp = await axios.post("https://api.osv.dev/v1/query", payload, { timeout: 10000 });
        if (osvResp?.data) vulnResults.push({ lib: d.lib, version: d.version, osv: osvResp.data });
      } catch (e) {
        // ignore external query failure
      }
    }

    // 5) 리포트 객체 생성
    const report = {
      modelId,
      docCid,
      detected,
      vulnResults,
      snippet: text.slice(0, 2000),
      createdAt: new Date().toISOString(),
    };

    // 6) Pinata에 리포트 업로드 (JSON)
    if (!pinataSdk) {
      return res.status(500).json({ error: "Pinata not configured in env" });
    }
    const pinata = pinataSdk(PINATA_KEY, PINATA_SECRET);
    const pinned = await pinata.pinJSONToIPFS(report);
    const vulnCid = pinned?.IpfsHash ?? null;

    return res.status(200).json({ vulnCid, report });
  } catch (err) {
    console.error("analyze-report error:", (err as any)?.message ?? err);
    return res.status(500).json({ error: (err as any)?.message ?? String(err) });
  }
}
