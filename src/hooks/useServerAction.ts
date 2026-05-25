"use client";

import { useCallback, useState, useTransition } from "react";

export type ServerAction<Result, Args extends unknown[]> = (...args: Args) => Promise<Result>;

export function useServerAction<Result, Args extends unknown[] = []>(
  action: ServerAction<Result, Args>,
  initialState?: Result,
) {
  const [data, setData] = useState<Result | undefined>(initialState);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  const execute = useCallback(
    (...args: Args) =>
      new Promise<Result>((resolve, reject) => {
        startTransition(() => {
          action(...args)
            .then((result) => {
              setData(result);
              setError(null);
              resolve(result);
            })
            .catch((err) => {
              const normalized = err instanceof Error ? err : new Error("Server action failure");
              setError(normalized);
              reject(normalized);
            });
        });
      }),
    [action],
  );

  return { data, error, isPending, execute };
}
