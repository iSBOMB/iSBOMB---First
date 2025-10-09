import { Section, SimpleTable } from "../../components/ui";

export default function AIBOMPage() {
  const rows = [
    ["LungVision v1.4.0", "PyTorch 2.4", "Registered", <button key="1" className="rounded-lg border px-2 py-1 hover:bg-gray-50">Open</button>],
    ["CT-Lesion v1.3.1", "PyTorch 2.3", "Pending", <button key="2" className="rounded-lg border px-2 py-1 hover:bg-gray-50">Register</button>],
  ];
  return (
    <Section title="AIBOM 등록/조회" desc="버전별 구성 요소 및 체인 트랜잭션">
      <SimpleTable columns={["Model", "Framework", "Status", "Actions"]} rows={rows} />
    </Section>
  );
}
