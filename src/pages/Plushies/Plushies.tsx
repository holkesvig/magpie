import MetricsBlock from "@pages/Plushies/MetricsBlock";
import TodayBlock from "@pages/Plushies/TodayBlock";
import { usePlushieMetrics } from "@utils/api/PlushieHooks";
import { dateKeyOf, addDays } from "@utils/transformers/computePlushieMetrics";

export default function Plushies() {
  // If you want to cap the range (e.g., last 18 months), supply a start date here.
  // Otherwise omit and we’ll use the earliest record automatically.
  const today = dateKeyOf(new Date());
  const eighteenMonthsAgo = addDays(today, -30 * 18); // crude but OK for ranges
  const { data: metrics, isLoading, isError, refetch } = usePlushieMetrics(eighteenMonthsAgo);

  if (isLoading) return <div>Loading…</div>;
  if (isError || !metrics) return (
    <div>
      <div className="text-sm">Couldn’t load data.</div>
      <button className="" onClick={() => refetch()}>Retry</button>
    </div>
  );

  return (
    <div className="">
      <MetricsBlock
        total={metrics.total}
        daysTo3000={metrics.daysTo3000}
        daysTo3500={metrics.daysTo3500}
        bankDrops={metrics.bank}
        bankDays={metrics.aheadDays}
      />

      {/* Progress to 3000 (optional) */}
      <div className="">
        <div className="">
          <span>Progress to 3000 - </span>
          <span>{Math.round(metrics.pct3000 * 100)}%</span>
        </div>
        <div className="'">
          <div className="h-full bg-black" style={{ width: `${Math.min(100, metrics.pct3000 * 100)}%` }} />
        </div>
        <div className="">
          ETA: {metrics.eta3000} • Ahead by ({metrics.aheadDays} days)
        </div>
      </div>

      <TodayBlock metrics={metrics} />

      {/* Heatmap / table / controls can go here, using m.days */}
    </div>
  );
}