"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

export function PerfCharts({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="h-64 rounded-xl border p-2">
        <div className="px-2 pt-2 text-sm text-gray-600">Accuracy & AUROC (monthly)</div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0.85, 1.0]} tickFormatter={(v) => (typeof v === "number" ? v.toFixed(2) : v)} />
            <Tooltip formatter={(v: any) => (typeof v === "number" ? v.toFixed(3) : v)} />
            <Line type="monotone" dataKey="acc" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="auroc" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-64 rounded-xl border p-2">
        <div className="px-2 pt-2 text-sm text-gray-600">Average Reading Time (seconds)</div>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="time" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
