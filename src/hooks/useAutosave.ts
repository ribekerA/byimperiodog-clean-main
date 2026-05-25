"use client";

import { useEffect, useRef } from "react";

type UseAutosaveOptions<T> = {
  interval: number;
  enabled: boolean;
  values: T;
  onSave: (values: T) => Promise<void> | void;
};

export default function useAutosave<T>({ interval, enabled, values, onSave }: UseAutosaveOptions<T>) {
  const latestValues = useRef(values);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestValues.current = values;
  }, [values]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      void onSave(latestValues.current);
    }, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, interval, values, onSave]);
}
