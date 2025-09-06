import { useMemo, useState } from 'react'
import type { Metrics } from '@pages/Plushies/Plushies.types'
import { dateKeyOf } from '@utils/transformers/computePlushieMetrics'
import { useAuthKeys } from '@utils/hooks/useAuthKeys'
import { useAdjustDay, useSetDay } from '@utils/api/PlushieHooks'
import dayjs from 'dayjs'
import { CheckCircle } from 'react-feather'
import cx from 'classnames'
import styles from '@pages/Plushies/TodayBlock.module.scss'

/**
 * Props:
 * - metrics: the computed metrics object from usePlushiesMetrics
 */
export default function TodayBlock({
  metrics,
  initialNotes,
}: {
  metrics: Metrics
  initialNotes?: string
}) {
  const todayKey = dateKeyOf(new Date())
  const { editKey } = useAuthKeys()
  const editable = !!editKey?.trim()

  // Find today's cell and bankBefore
  const todayCell = metrics.days[metrics.days.length - 1]
  const prevCell =
    metrics.days.length > 1 ? metrics.days[metrics.days.length - 2] : undefined

  const todayRaw = todayCell?.raw ?? 0
  const bankBefore = prevCell?.bankAfter ?? 0
  const goal = metrics.goalPerDay ?? 5
  const lastUpdated = todayCell?.updatedAt

  // Select latest timestamp
  const displayUpdatedAt = useMemo(() => {
    // 1) Prefer today's updatedAt
    if (todayCell?.updatedAt) return todayCell.updatedAt
    // 2) Fallback to strictly previous day
    if (prevCell?.updatedAt) return prevCell.updatedAt
    // 3) Optional: fallback to the most recent prior day with a timestamp
    for (let i = metrics.days.length - 2; i >= 0; i--) {
      const u = metrics.days[i].updatedAt
      if (u) return u
    }
    return undefined
  }, [todayCell?.updatedAt, prevCell?.updatedAt, metrics.days])

  const remainingToGoal = Math.max(0, goal - todayRaw)
  const coveredByBank = Math.min(remainingToGoal, bankBefore)
  const progressPct = Math.min(100, Math.round((todayRaw / goal) * 100))
  const complete = todayCell?.complete ?? false

  // Local "Set to" field & notes
  const [manualCount, setManualCount] = useState<number | ''>('')
  const [notes, setNotes] = useState<string>(initialNotes ?? '')

  // Mutations
  const adjust = useAdjustDay(todayKey)
  const setDay = useSetDay(todayKey)

  const disableActions = adjust.isPending || setDay.isPending

  const handleIncrement = () => adjust.mutate(1)
  const handleDecrement = () => adjust.mutate(-1)
  const handleSaveManual = () => {
    const val =
      typeof manualCount === 'number'
        ? Math.max(0, Math.floor(manualCount))
        : null
    if (val == null) return
    setDay.mutate({ count: val, notes: notes.trim() || undefined })
  }

  const todayLabel = useMemo(() => {
    const [y, m, d] = todayKey.split('-')
    return dayjs(`${y}-${m}-${d}`).format('MMMM DD') // already local YYYY-MM-DD
  }, [todayKey])

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100vw',
        padding: '5%',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '80%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '35px',
            alignItems: 'center',
          }}
        >
          <h1 className=''>Today</h1>
          <h4 style={{ color: 'grey', marginTop: -75 }}>{todayLabel}</h4>
        </div>
        <StatusPill complete={complete} />
      </header>

      {displayUpdatedAt && (
        <div className='mt-1 text-xs text-gray-500'>
          Last bambi added on {dayjs(displayUpdatedAt).format('MM/DD - hh:mm A')}
        </div>
      )}

      <div className='grid gap-3 md:grid-cols-3'>
        {/* Collected today */}
        <div className='rounded-xl border p-3'>
          <div className='text-xs text-gray-500'>Collected today</div>
          <div className='text-3xl font-semibold'>{formatInt(todayRaw)}</div>
          {coveredByBank > 0 && (
            <div className='mt-1 text-xs text-gray-500'>
              +{coveredByBank} from bank
            </div>
          )}
        </div>

        {/* Progress to goal */}
        <div className='rounded-xl border p-3'>
          <div className='flex items-center justify-between text-xs text-gray-500'>
            <span>Progress to {goal} - </span>
            <span>{progressPct}%</span>
            <progress value={progressPct} />
          </div>
          <div className='mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden'>
            <div
              className='h-full bg-black'
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className='mt-1 text-xs text-gray-600'>
            {todayRaw} / {goal}
          </div>
        </div>

        {/* Bank snapshot */}
        <div className='rounded-xl border p-3'>
          <div className='text-xs text-gray-500'>Bank (before today)</div>
          <div className='text-3xl font-semibold'>{formatInt(bankBefore)}</div>
          <div className='mt-1 text-xs text-gray-500'>
            = {Math.floor(bankBefore / goal)}{' '}
            {Math.floor(bankBefore / goal) === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Controls (edit mode only) */}
      {editable ? (
        <div className='grid gap-3 md:grid-cols-3'>
          {/* Increment / Decrement */}
          <div className='flex items-center gap-2'>
            <button
              onClick={handleDecrement}
              disabled={disableActions}
              className='rounded-xl border px-4 py-2 disabled:opacity-50'
              aria-label='Decrement'
            >
              −1
            </button>
            <button
              onClick={handleIncrement}
              disabled={disableActions}
              className='rounded-xl border px-4 py-2 disabled:opacity-50'
              aria-label='Increment'
            >
              +1
            </button>
            {(adjust.isPending || setDay.isPending) && (
              <span className='text-xs text-gray-500 ml-2'>Saving…</span>
            )}
          </div>

          {/* Set absolute */}
          <div className='flex items-center gap-2'>
            <label className='text-sm text-gray-600'>Set to</label>
            <input
              type='number'
              min={0}
              inputMode='numeric'
              value={manualCount}
              onChange={(e) =>
                setManualCount(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              className='w-24 rounded-xl border px-3 py-2'
            />
            <button
              onClick={handleSaveManual}
              disabled={disableActions || typeof manualCount !== 'number'}
              className='rounded-xl border px-4 py-2 disabled:opacity-50 bg-black text-white'
            >
              Save
            </button>
          </div>

          {/* Notes (optional) */}
          <div className='flex items-center gap-2'>
            <label className='text-sm text-gray-600'>Notes</label>
            <input
              type='text'
              placeholder='Optional'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className='flex-1 rounded-xl border px-3 py-2'
            />
          </div>
        </div>
      ) : (
        <div className='text-xs text-gray-500'>
          View-only. Unlock editing to change today’s count.
        </div>
      )}
    </section>
  )
}

function StatusPill({ complete }: { complete: boolean }) {
  return (
    <span className={''}>{complete ? <CheckCircle /> : 'In progress'}</span>
  )
}

function formatInt(n: number) {
  return new Intl.NumberFormat().format(Math.max(0, Math.floor(n)))
}
