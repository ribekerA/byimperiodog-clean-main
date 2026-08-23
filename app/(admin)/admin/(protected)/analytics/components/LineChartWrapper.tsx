"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

type Point = { label: string; value: number };

const LineChartDynamic = dynamic(
  () => import("./LineChart").then((m) => m.LineChart),
  { ssr: false }
);

export function LineChartWrapper(props: { data: Point[]; title: string }) {
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

  return <LineChartDynamic {...props} />;
}
