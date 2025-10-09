import { Section, SimpleTable } from "../../components/ui";

export default function DocumentsPage() {
  const rows = [
    ["MFDS-2025-08-01-001", "MFDS", "Draft", <div key="1" className="flex gap-2"><button className="rounded-lg border px-2 py-1 hover:bg-gray-50">Open</button><button className="rounded-lg border px-2 py-1 hover:bg-gray-50">Export</button></div>],
    ["FDA-510k-2025-07-20-003", "FDA", "Ready to review", <div key="2" className="flex gap-2"><button className="rounded-lg border px-2 py-1 hover:bg-gray-50">Open</button><button className="rounded-lg border px-2 py-1 hover:bg-gray-50">Export</button></div>],
  ];
  return (
    <Section title="AI 문서 생성" desc="가이드라인 템플릿 기반 자동 작성/편집">
      <div className="mb-3 flex gap-2">
        <select className="rounded-md border px-2 py-1 text-sm"><option>MFDS</option><option>FDA 510(k)</option></select>
        <button className="rounded-md bg-black px-3 py-1.5 text-sm text-white">Generate Draft</button>
      </div>
      <SimpleTable columns={["Document ID", "Regulator", "Status", "Actions"]} rows={rows} />
    </Section>
  );
}
