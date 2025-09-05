// src/components/MetricsBlock.tsx
import styles from "@pages/Plushies/MetricsBlock.module.scss";
import { MetricsCard as Card } from "@pages/Plushies/MetricsCard";
type MetricsBlockProps = {
    total: number;          // total plushies collected so far
    daysTo3000: number;     // ceil((3000 - total)/5), >= 0
    daysTo3500: number;     // ceil((3500 - total)/5), >= 0
    bankDrops: number;      // final bank (surplus drops)
    bankDays: number;       // Math.floor(bankDrops / 5)
  };
  
  export default function MetricsBlock({
    total,
    daysTo3000,
    daysTo3500,
    bankDrops,
    bankDays,
  }: MetricsBlockProps) {
    return (
      <div className={styles.container}>
        <Card label="Total plushies" value={formatInt(total)} />
        <Card label="Days to 3000"   value={daysTo3000} sub={daysTo3000 === 1 ? "day" : "days"} />
        <Card label="Days to 3500"   value={daysTo3500} sub={daysTo3500 === 1 ? "day" : "days"} />
        <Card
          label="Banked"
          value={formatInt(bankDrops)}
          sub={bankDays > 0 ? `${bankDays} ${bankDays === 1 ? "day" : "days"}` : undefined}
        />
      </div>
    );
  }
  
  // function Card({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  //   return (
  //     <div className="rounded-2xl border bg-white p-4 shadow-sm">
  //       <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
  //       <div className="mt-1 text-3xl font-semibold leading-none">{value}</div>
  //       {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
  //     </div>
  //   );
  // }
  
  function formatInt(n: number) {
    return new Intl.NumberFormat().format(Math.max(0, Math.floor(n)));
  }
  