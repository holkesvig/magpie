import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthKeys } from "@utils/hooks/useAuthKeys";
import { getWithViewKey } from "@utils/api/ApiUtilities";

type Props = { children: ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const { viewKey, clearAll } = useAuthKeys();
  const nav = useNavigate();
  const loc = useLocation();

  const enabled = Boolean(viewKey.trim());

  const q = useQuery({
    queryKey: ["auth-ping"],
    queryFn: () => getWithViewKey<{ ok: true }>("/api/plushies/ping", viewKey),
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // If no key, go to /unlock
  useEffect(() => {
    if (!enabled) {
      nav(`/`, { replace: true });
    }
  }, [enabled, loc.pathname, nav]);

  // On 401, clear stored keys and redirect
  useEffect(() => {
    if (q.isError && (q.error as any)?.status === 401) {
      clearAll();
      nav(`/unlock?to=${encodeURIComponent(loc.pathname)}`, { replace: true });
    }
  }, [q.isError, q.error, clearAll, loc.pathname, nav]);

  if (!enabled) return null;            // we’re redirecting
  if (q.isLoading) return <FullScreenLoader />;

  if (q.isError) {
    return (
      <FullScreenError
        message={(q.error as Error).message || "Unable to verify access"}
        onRetry={() => q.refetch()}
      />
    );
  }

  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-gray-600">Loading…</div>
    </div>
  );
}

function FullScreenError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="rounded-xl border p-6 max-w-md w-full space-y-3">
        <div className="font-semibold">Something went wrong</div>
        <div className="text-sm text-gray-600">{message}</div>
        <button onClick={onRetry} className="rounded-lg px-3 py-2 border w-full">Retry</button>
      </div>
    </div>
  );
}
