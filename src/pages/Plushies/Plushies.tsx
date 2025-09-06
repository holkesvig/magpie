import MetricsBlock from '@pages/Plushies/MetricsBlock'
import TodayBlock from '@pages/Plushies/TodayBlock'
import { usePlushieMetrics } from '@utils/api/PlushieHooks'
import { dateKeyOf, addDays } from '@utils/transformers/computePlushieMetrics'
import styles from '@pages/Plushies/Plushies.module.scss'

export default function Plushies() {
  // If you want to cap the range (e.g., last 18 months), supply a start date here.
  // Otherwise omit and we’ll use the earliest record automatically.
  const today = dateKeyOf(new Date())
  const eighteenMonthsAgo = addDays(today, -30 * 18) // crude but OK for ranges
  const { data: metrics, isLoading, isError, refetch } = usePlushieMetrics()

  console.log(metrics)

  if (isLoading) return <div>Loading…</div>
  if (isError || !metrics)
    return (
      <div>
        <div>Couldn’t load data.</div>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    )

  return (
    <div>
      <MetricsBlock
        total={metrics.total}
        daysTo3000={metrics.daysTo3000}
        daysTo3500={metrics.daysTo3500}
        bankDrops={metrics.bank}
        bankDays={metrics.aheadDays}
      />

      {/* Progress to 3000 */}
      <div className={styles.overallProgress}>
        <h3>Progress to 3000</h3>
        <div className={styles.barContainer}>
          <span>{Math.round(metrics.pct3000 * 100)}%</span>
          <progress
            className={styles.progress}
            value={Math.round(metrics.pct3000 * 100)}
            max={'100'}
          />
        </div>
        <div className=''>
          ETA: {metrics.eta3000} • Ahead by ({metrics.aheadDays} days)
        </div>
      </div>

      <TodayBlock metrics={metrics} />

      {/* Heatmap / table / controls can go here, using m.days */}
    </div>
  )
}
