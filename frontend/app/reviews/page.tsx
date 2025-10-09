import { Section, SimpleTable } from "../../components/ui";

export default function ReviewsPage() {
  const rows = [
    ["REQ-2025-08-12-01", "LungVision v1.4.0", "A-메디", "Pending", <div key="1" className="flex gap-2"><button className="rounded-lg border px-2 py-1 hover:bg-gray-50">Open</button><button className="rounded-lg border px-2 py-1 hover:bg-gray-50">Withdraw</button></div>],
  ];
  return (
    <Section title="심사 요청/서류조회/승인기록">
      <div className="mb-3 flex gap-2">
        <input placeholder="Model ID or Request ID" className="rounded-md border px-2 py-1 text-sm" />
        <button className="rounded-md border px-3 py-1.5 text-sm">Search</button>
        <button className="rounded-md bg-black px-3 py-1.5 text-sm text-white">Request Review</button>
      </div>
      <SimpleTable columns={["Request ID", "Model", "Developer", "Status", "Actions"]} rows={rows} />
    </Section>
  );
}
