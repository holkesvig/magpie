import { useQuery } from "@tanstack/react-query";
import { useAuthKeys } from "@utils/hooks/useAuthKeys";
import type { PlushiesListResponse, Metrics } from "@pages//Plushies/Plushies.types";
import { computePlushiesMetrics, dateKeyOf, addDays, BASELINE } from "@utils/transformers/computePlushieMetrics";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Small helper for gated GET with x-view-key
async function getWithViewKey<T>(url: string, viewKey: string): Promise<T> {
    const res = await fetch(url, { headers: { "x-view-key": viewKey } });
    if (res.status === 401) {
      const e: any = new Error("unauthorized"); e.status = 401; throw e;
    }
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }

  /** Minimal PUT helper that sends both keys */
async function putWithKeys<T>(url: string, body: unknown, viewKey: string, editKey: string): Promise<T> {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-view-key": viewKey,
        "x-edit-key": editKey,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) { const e: any = new Error("unauthorized"); e.status = 401; throw e; }
    if (!res.ok) throw new Error(`PUT ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }
  
  /**
   * Increment/decrement by delta (e.g., +1 or -1).
   * Server clamps at >= 0.
   */
  export function useAdjustDay(dateKey: string) {
    const qc = useQueryClient();
    const { viewKey, editKey, clearAll } = useAuthKeys();
  
    return useMutation({
      mutationFn: (delta: number) =>
        putWithKeys<{ record: unknown }>(`/api/plushies/${dateKey}`, { delta }, viewKey, editKey),
      onSuccess: () => {
        // Refresh computed metrics
        qc.invalidateQueries({ queryKey: ["plushies-metrics"] });
      },
      onError: (err: any) => {
        if (err?.status === 401) {
          clearAll(); // drop stored keys if unauthorized
        }
      },
    });
  }
  
  /**
   * Set an absolute count for the day (optionally with notes).
   */
  export function useSetDay(dateKey: string) {
    const qc = useQueryClient();
    const { viewKey, editKey, clearAll } = useAuthKeys();
  
    return useMutation({
      mutationFn: (payload: { count: number; notes?: string }) =>
        putWithKeys<{ record: unknown }>(`/api/plushies/${dateKey}`, payload, viewKey, editKey),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["plushies-metrics"] });
      },
      onError: (err: any) => {
        if (err?.status === 401) {
          clearAll();
        }
      },
    });
  }
  
  /**
   * Fetches plushies and returns computed metrics with BASELINE applied.
   * @param startDate optional YYYY-MM-DD; omit to auto-use earliest record
   */
  export function usePlushieMetrics(startDate?: string) {
    const { viewKey } = useAuthKeys();
  
    // Example: cap to ~18 months (optional). Remove if you want full history.
    const today = dateKeyOf(new Date());
    const eighteenMonthsAgo = addDays(today, -30 * 18);
    const from = startDate ?? eighteenMonthsAgo;
  
    return useQuery<Metrics>({
      queryKey: ["plushies-metrics", from, !!viewKey, BASELINE],
      enabled: !!viewKey,
      queryFn: async () => {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
  
        const data = await getWithViewKey<PlushiesListResponse>(
          `/api/plushies${params.toString() ? `?${params}` : ""}`,
          viewKey
        );
  
        return computePlushiesMetrics(data.records, from, undefined, {
          baseline: BASELINE,
          includeBaselineInAhead: true, // set true if you want baseline to affect ahead/behind
        });
      },
      staleTime: 0,
      retry: false,
      refetchOnWindowFocus: false,
    });
  }