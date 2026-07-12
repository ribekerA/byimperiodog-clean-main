"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

type Slice = { label: string; value: number; color?: string };

const PieChartDynamic = dynamic(
  () => import("./PieChart").then((m) => m.PieChart),
  { ssr: false }
);

export function PieChartWrapper(props: { data: Slice[]; title: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <figure className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <figcaption className="mb-3 text-sm font-semibold text-[var(--text)]">{props.title}</figcaption>
        <div className="h-52 animate-pulse rounded-lg bg-gray-100" />
      </figure>
    );
  }

  return <PieChartDynamic {...props} />;
}
