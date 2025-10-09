// --- 버전/성능/드래프트 (기존) ---
export const versions = [
  { id: 1, version: "v1.4.0", releasedAt: "2025-07-28", trainingData: "CT-Scan 1.2M imgs", framework: "PyTorch 2.4", aibom: "Registered" },
  { id: 2, version: "v1.3.1", releasedAt: "2025-06-12", trainingData: "CT-Scan 980k imgs", framework: "PyTorch 2.3", aibom: "Pending" },
  { id: 3, version: "v1.3.0", releasedAt: "2025-05-01", trainingData: "CT-Scan 900k imgs", framework: "PyTorch 2.3", aibom: "Registered" },
];

export const perfSeries = [
  { month: "Mar", acc: 0.912, time: 47, auroc: 0.934 },
  { month: "Apr", acc: 0.918, time: 45, auroc: 0.938 },
  { month: "May", acc: 0.927, time: 43, auroc: 0.942 },
  { month: "Jun", acc: 0.931, time: 41, auroc: 0.946 },
  { month: "Jul", acc: 0.936, time: 39, auroc: 0.949 },
  { month: "Aug", acc: 0.941, time: 38, auroc: 0.953 },
];

export const recentDrafts = [
  { id: "MFDS-2025-08-01-001", regulator: "MFDS", status: "Draft", updatedAt: "2025-08-01" },
  { id: "FDA-510k-2025-07-20-003", regulator: "FDA", status: "Ready to review", updatedAt: "2025-07-20" },
  { id: "MFDS-2025-06-30-002", regulator: "MFDS", status: "Submitted", updatedAt: "2025-06-30" },
];

// --- 역할별 기본 모델 (감독기관 프리뷰용) ---
export const defaultModelByRole = {
  supervisor: "LungVision v1.4.0",
};

// --- SBOM (모델→컴포넌트 배열) ---
export const sboms: Record<string, { ecosystem: string; name: string; version: string }[]> = {
  "LungVision v1.4.0": [
    { ecosystem: "PyPI", name: "torch", version: "2.3.0" },
    { ecosystem: "PyPI", name: "numpy", version: "1.26.0" },
    { ecosystem: "npm", name: "lodash", version: "4.17.20" },
  ],
  "CT-Lesion v1.3.1": [
    { ecosystem: "PyPI", name: "tensorflow", version: "2.6.0" },
    { ecosystem: "PyPI", name: "pandas", version: "2.2.2" },
  ],
};

// --- 취약점 인덱스 (eco:name@version → CVE들) ---
export const vulnIndex: Record<
  string,
  { cve: string; level: "Critical" | "High" | "Medium" | "Low"; score?: number }[]
> = {
  "PyPI:torch@2.3.0": [{ cve: "CVE-2025-XXXX", level: "Critical", score: 9.1 }],
  "npm:lodash@4.17.20": [{ cve: "CVE-2021-23337", level: "High", score: 7.4 }],
  "PyPI:tensorflow@2.6.0": [{ cve: "CVE-2021-29559", level: "Medium", score: 5.3 }],
};

// --- 문서 템플릿 ---
export const templates = {
  advisory: ({ model, developer, cve, level, pkg }: any) =>
    [
      `# [Security Advisory] ${model} – ${cve} (${level})`,
      ``,
      `- **Model**: ${model}`,
      `- **Developer**: ${developer}`,
      `- **CVE**: ${cve}`,
      `- **Severity**: ${level}`,
      pkg ? `- **Component**: \`${pkg}\`` : "",
      `- **Generated at**: ${new Date().toISOString()}`,
      ``,
      `## Summary`,
      `A vulnerability (${cve}) affecting ${pkg || "component"} was identified.`,
      ``,
      `## Impact`,
      `Potential clinical/operational impact (e.g., RCE on inference node, data integrity).`,
      ``,
      `## Mitigation`,
      `- Upgrade to fixed version`,
      `- Network isolation / allowlist`,
      `- Integrity checks & monitoring`,
    ].filter(Boolean).join("\n"),
  auditNote: ({ model, developer, cve, level, pkg }: any) =>
    [
      `# [Audit Note] ${model} – Vulnerability Evaluation (${cve})`,
      ``,
      `- **Developer**: ${developer}`,
      `- **Severity**: ${level}`,
      pkg ? `- **Component**: \`${pkg}\`` : "",
      ``,
      `## Evidence`,
      `- Detection source: rule-based matching (OSV/NVD style)`,
      `- AIBOM/SBOM reference: (tx hash)`,
      ``,
      `## Reviewer Notes`,
      `Add reviewer comments, traceability, and follow-ups here.`,
    ].filter(Boolean).join("\n"),
};
