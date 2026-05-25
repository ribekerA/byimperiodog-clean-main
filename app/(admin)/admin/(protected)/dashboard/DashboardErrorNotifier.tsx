"use client";

import { useEffect } from "react";

import { useToast } from "@/components/ui/toast";

export function DashboardErrorNotifier({ message }: { message?: string }) {
  const { push } = useToast();

  useEffect(() => {
    if (!message) return;
    push({
      message,
      type: "error",
      duration: 6000,
    });
  }, [message, push]);

  return null;
}
