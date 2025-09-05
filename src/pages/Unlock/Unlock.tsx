import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthKeys } from '@utils/hooks/useAuthKeys'

export default function UnlockPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const redirectTo = params.get('to') || '/plushies' // where to go after unlock

  const { setViewKey, setEditKey } = useAuthKeys()
  const [vk, setVk] = useState('')
  const [ek, setEk] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    // optimistic: we’ll let the ProtectedRoute verify by hitting /api
    try {
      setViewKey(vk.trim())
      if (ek.trim()) setEditKey(ek.trim())
      nav(redirectTo, { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Failed to unlock')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-6 bg-gray-50'>
      <form
        onSubmit={handleSubmit}
        className='w-full max-w-md space-y-4 bg-white p-6 rounded-2xl shadow'
      >
        <h1 className='text-2xl font-semibold'>What's The Magic Word?</h1>

        <label className='block'>
          <span className='text-sm font-medium'>Key</span>
          <input
            type='password'
            value={vk}
            onChange={(e) => {
              ;(setVk(e.target.value), setEk(e.target.value))
            }}
            autoFocus
            required
            className='mt-1 w-full rounded-xl border px-3 py-2 outline-none'
            placeholder='••••••••'
          />
        </label>

        {error && <div className='text-sm text-red-600'>{error}</div>}

        <button
          type='submit'
          disabled={busy || !vk.trim()}
          className='w-full rounded-xl py-2 font-semibold shadow disabled:opacity-50 border bg-black text-white'
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
