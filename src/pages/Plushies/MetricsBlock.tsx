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
        <Card label="Total Bambis" value={formatInt(total)} />
        <Card label="Days to 3000"   value={daysTo3000} />
        <Card label="Days to 3500"   value={daysTo3500} />
        <Card
          label="Banked"
          value={formatInt(bankDrops)}
          sub={bankDays > 0 ? `${bankDays} ${bankDays === 1 ? "day" : "days"}` : undefined}
        />
      </div>
    );
  }
  
  function formatInt(n: number) {
    return new Intl.NumberFormat().format(Math.max(0, Math.floor(n)));
  }
  