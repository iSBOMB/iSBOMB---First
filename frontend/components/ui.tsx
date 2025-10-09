"use client";
import type { ReactNode } from "react";

/* ===== UI Primitives: Stat, Section, SimpleTable ===== */

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

type SectionProps = {
  /** HTML id for anchor links (optional) */
  id?: string;
  /** Section title */
  title: string;
  /** Optional description under the title */
  desc?: string;
  /** Optional right-aligned header content (e.g., actions, filters) */
  right?: ReactNode;
  /** Body content */
  children: ReactNode;
};

export function Section({
  id,
  title,
  desc,
  right,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-20 mb-6 rounded-2xl border bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {desc && <p className="mt-1 text-sm text-gray-500">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number | ReactNode)[][];
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
