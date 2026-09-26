"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      next.delete("page"); // ANY filter change resets pagination — classic bug, killed here once
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setParams = useCallback(
    (entries: Record<string, string | null>) =>
      push((sp) => {
        for (const [k, v] of Object.entries(entries)) {
          if (v == null || v === "") sp.delete(k);
          else sp.set(k, v);
        }
      }),
    [push]
  );

  const setParam = useCallback(
    (key: string, value: string | null) => setParams({ [key]: value }),
    [setParams]
  );

  const toggleMulti = useCallback(
    (key: string, value: string) =>
      push((sp) => {
        const current = (sp.get(key) ?? "").split(",").filter(Boolean);
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        if (next.length) sp.set(key, next.join(","));
        else sp.delete(key);
      }),
    [push]
  );

  const clearAll = useCallback(
    () => router.push(pathname, { scroll: false }),
    [pathname, router]
  );

  return { searchParams, setParam, setParams, toggleMulti, clearAll };
}