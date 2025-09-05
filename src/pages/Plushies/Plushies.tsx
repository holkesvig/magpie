import MetricsBlock from "@pages/Plushies/MetricsBlock";
import { usePlushieMetrics } from "@utils/api/PlushieHooks";
import { dateKeyOf, addDays } from "@utils/transformers/computePlushieMetrics";

export default function Plushies() {
  // If you want to cap the range (e.g., last 18 months), supply a start date here.
  // Otherwise omit and we’ll use the earliest record automatically.
  const today = dateKeyOf(new Date());
  const eighteenMonthsAgo = addDays(today, -30 * 18); // crude but OK for ranges
  const { data: m, isLoading, isError, refetch } = usePlushieMetrics(eighteenMonthsAgo);

  if (isLoading) return <div>Loading…</div>;
  if (isError || !m) return (
    <div>
      <div className="text-sm">Couldn’t load data.</div>
      <button className="" onClick={() => refetch()}>Retry</button>
    </div>
  );

  return (
    <div className="">
      <MetricsBlock
        total={m.total}
        daysTo3000={m.daysTo3000}
        daysTo3500={m.daysTo3500}
        bankDrops={m.bank}
        bankDays={m.aheadDays}
      />

      {/* Progress to 3000 (optional) */}
      <div className="">
        <div className="">
          <span>Progress to 3000 - </span>
          <span>{Math.round(m.pct3000 * 100)}%</span>
        </div>
        <div className="'">
          <div className="h-full bg-black" style={{ width: `${Math.min(100, m.pct3000 * 100)}%` }} />
        </div>
        <div className="">
          ETA: {m.eta3000} • Ahead by ({m.aheadDays} days)
        </div>
      </div>

      {/* Heatmap / table / controls can go here, using m.days */}
    </div>
  );
}