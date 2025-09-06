import type {
  PlushieRecord,
  Metrics,
  DayCell,
} from 'pages/Plushies/Plushies.types'

export const GOAL = 5 // per-day goal
export const MAIN_TARGET = 3000 // primary target
export const STRETCH_TARGET = 3500 // stretch target
export const BASELINE = 283
export const START_DATE = '2025-09-01'

/** YYYY-MM-DD (local) */
export function dateKeyOf(d: Date) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return dateKeyOf(dt)
}

export function daysBetweenInclusive(fromKey: string, toKey: string): string[] {
  const out: string[] = []
  for (let cur = fromKey; ; ) {
    out.push(cur)
    if (cur === toKey) break
    cur = addDays(cur, 1)
  }
  return out
}

/**
 * Compute rolling-bank metrics from raw records.
 *
 * Baseline rules:
 * - `baseline` counts toward overall totals / remaining / ETAs.
 * - It does NOT affect daily bank, completeness, or heatmap.
 * - `includeBaselineInAhead` controls whether baseline is included in ahead/behind (default: false).
 *
 * @param records   Airtable rows (any order)
 * @param startDate first calendar day to include (YYYY-MM-DD). If omitted, uses earliest record’s dateKey.
 * @param todayKey  override "today" (for testing). Defaults to local today.
 * @param opts      { baseline?: number; includeBaselineInAhead?: boolean }
 */
export function computePlushiesMetrics(
  records: PlushieRecord[],
  startDate?: string,
  todayKey?: string,
  opts?: { baseline?: number; includeBaselineInAhead?: boolean }
): Metrics {
  const baseline = Math.max(0, Math.floor(opts?.baseline ?? BASELINE))
  const includeBaselineInAhead = !!opts?.includeBaselineInAhead

  const today = todayKey ?? dateKeyOf(new Date())

  // Aggregate counts and keep the most recent updatedAt per dateKey (if multiple rows ever existed)
  const counts = new Map<string, number>()
  const lastUpdated = new Map<string, string | undefined>()
  const lastNotes = new Map<string, string | undefined>()
  let earliest = today

  for (const r of records) {
    const dk = r.dateKey
    const c = Math.max(0, Math.floor(r.count))
    counts.set(dk, (counts.get(dk) ?? 0) + c)

    if (r.notes !== undefined && r.notes !== null && r.notes.trim() !== '') {
      lastNotes.set(dk, r.notes)
    }

    // Track the max(updatedAt) per day if provided
    const prev = lastUpdated.get(dk)
    if (r.updatedAt) {
      if (!prev || new Date(r.updatedAt).getTime() > new Date(prev).getTime()) {
        lastUpdated.set(dk, r.updatedAt)
      }
    } else if (!prev && r.createdAt) {
      // Fallback to createdAt if updatedAt missing
      lastUpdated.set(dk, r.createdAt)
    }

    if (dk < earliest) earliest = dk
  }

  const first = startDate ?? earliest
  const allDays = daysBetweenInclusive(first, today)

  let bank = 0 // rolling bank (drops)
  let rawTotal = 0 // sum of raw per-day counts only
  const days: DayCell[] = []

  // Standard rolling-bank pass
  for (const dk of allDays) {
    const raw = counts.get(dk) ?? 0
    rawTotal += raw

    const short = Math.max(0, GOAL - raw)
    const use = Math.min(short, bank)
    const effective = raw + use
    const complete = effective >= GOAL

    const carry = Math.max(0, raw - GOAL) // only raw surplus contributes
    bank = bank - use + carry

    days.push({
      dateKey: dk,
      raw,
      effective,
      complete,
      bankAfter: bank,
      updatedAt: lastUpdated.get(dk), // may be undefined if no record that day
      notes: lastNotes.get(dk) ?? undefined, // may be undefined if no notes that day
    })
  }

  const elapsedDays = allDays.length
  const expectedToDate = elapsedDays * GOAL

  // Totals & KPIs
  const total = baseline + rawTotal // baseline contributes only here
  const aheadDrops =
    (includeBaselineInAhead ? total : rawTotal) - expectedToDate
  const aheadDays = Math.floor(bank / GOAL)

  const remMain = Math.max(0, MAIN_TARGET - total)
  const remStretch = Math.max(0, STRETCH_TARGET - total)

  const daysTo3000 = Math.ceil(remMain / GOAL)
  const daysTo3500 = Math.ceil(remStretch / GOAL)

  const eta3000 = daysTo3000 > 0 ? addDays(today, daysTo3000) : today
  const eta3500 = daysTo3500 > 0 ? addDays(today, daysTo3500) : today

  return {
    goalPerDay: GOAL,
    total,
    bank,
    aheadDrops,
    aheadDays,
    daysCompleted: days.filter((d) => d.complete).length,
    daysTo3000,
    daysTo3500,
    pct3000: MAIN_TARGET ? total / MAIN_TARGET : 0,
    eta3000,
    eta3500,
    days,
  }
}
