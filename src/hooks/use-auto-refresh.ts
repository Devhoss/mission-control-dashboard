"use client";

import { useState, useEffect, useCallback } from "react";

export type AutoRefreshState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
};

function defaultParseResponse<T>(res: Response): Promise<{ data: T }> {
  return res.json().then((json: { ok?: boolean; data?: T; error?: string }) => {
    if (json.ok && "data" in json) return { data: json.data as T };
    throw new Error(json.error ?? "Request failed");
  });
}

export function useAutoRefreshQuery<T>(
  url: string,
  options: {
    intervalMs?: number;
    enabled?: boolean;
    parseResponse?: (res: Response) => Promise<{ data: T }>;
  } = {}
) {
  const { intervalMs = 15000, enabled = true, parseResponse } = options;
  const parse = parseResponse ?? defaultParseResponse;

  const [state, setState] = useState<AutoRefreshState<T>>({
    data: null,
    loading: true,
    error: null,
    lastFetched: null,
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(url);
      const { data } = await parse(res);
      setState({
        data,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, [url, enabled, parse]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs, enabled]);

  return { ...state, refetch: fetchData };
}
