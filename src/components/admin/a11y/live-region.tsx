"use client";

import { useEffect, useRef } from "react";

export function AdminLiveRegion({ message }: { message: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && ref.current) {
      ref.current.textContent = message;
    }
  }, [message]);

  return <div ref={ref} className="sr-only" aria-live="polite" aria-atomic="true" />;
}
