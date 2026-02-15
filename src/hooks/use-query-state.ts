"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function useQueryState(
  key: string
): [string | null, (value: string | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key);

  const setValue = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next == null || next === "") {
      params.delete(key);
    } else {
      params.set(key, next);
    }
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href);
  };

  return [value, setValue];
}
