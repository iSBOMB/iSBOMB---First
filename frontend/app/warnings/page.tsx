import { Section, SimpleTable } from "../../components/ui";

export default function WarningsPage() {
  const rows = [
    ["ALRT-2025-09-01-01", "LungVision v1.4.0", "CVE-2025-XXXX", "Critical", <div key="1" className="flex gap-2"><button className="rounded-lg border px-2 py-1 hover:bg-gray-50">Open</button><button className="rounded-lg border px-2 py-1 hover:bg-gray-50">Notify</button></div>],
  ];
  return (
    <Section title="취약점 경고 등록/전파" desc="체인에 경고 기록 및 이해관계자 알림">
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <input placeholder="Model or AIBOM tx" className="rounded-md border px-2 py-1 text-sm" />
        <input placeholder="CVE id (e.g., CVE-2025-XXXX)" className="rounded-md border px-2 py-1 text-sm" />
        <button className="rounded-md bg-black px-3 py-1.5 text-sm text-white sm:col-span-2">Register Warning</button>
      </div>
      <SimpleTable columns={["Alert ID", "Model", "CVE", "Level", "Actions"]} rows={rows} />
    </Section>
  );
}
