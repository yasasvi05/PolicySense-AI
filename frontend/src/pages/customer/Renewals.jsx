import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, CalendarClock, Sparkles } from 'lucide-react'
import { api } from '../../services'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { CardSkeleton, ConfirmDialog, EmptyState, ErrorState, PageHeader, StatusBadge } from '../../components/ui'
import { cx, daysUntil, fmtDate, fmtDateLong, money } from '../../utils'

export default function Renewals() {
  const navigate = useNavigate()
  const toast = useToast()
  const [renewing, setRenewing] = useState(null)
  const { data, loading, error, reload } = useAsync(() => api.getRenewals())
  if (error) return <ErrorState message={error} onRetry={reload} />

  const upcoming = (data || []).filter((r) => r.renewal_status !== 'Renewed').sort((a, b) => a.renewal_due_date.localeCompare(b.renewal_due_date))
  const timeline = [...(data || [])].sort((a, b) => a.renewal_due_date.localeCompare(b.renewal_due_date))
  const ask = (r) => navigate('/app/assistant', { state: { prompt: `When is my ${r.policy_name} renewal due and what happens if I miss it?`, context: { type: 'renewal', id: r.policy_number } } })

  return (
    <div>
      <PageHeader title="Renewal Center" subtitle="Stay ahead of due dates and avoid late fees." />
      <h2 className="mb-3 text-lg font-semibold">Upcoming renewals</h2>
      {loading ? <div className="grid gap-4 lg:grid-cols-2"><CardSkeleton /><CardSkeleton /></div> : upcoming.length === 0 ? <div className="card"><EmptyState icon={CalendarCheck} title="Nothing to renew" text="All your policies are renewed." /></div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {upcoming.map((r) => {
            const d = daysUntil(r.renewal_due_date)
            return (
              <article key={r.renewal_id} className="card p-5">
                <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{r.policy_name}</p><p className="text-xs text-navy-400">{r.policy_number}</p></div><StatusBadge status={r.renewal_status === 'Pending' ? 'Renewal Pending' : r.renewal_status} /></div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-xs text-navy-400">Renewal date</p><p className="font-semibold">{fmtDate(r.renewal_due_date)}</p></div>
                  <div><p className="text-xs text-navy-400">Premium</p><p className="font-semibold">{money(r.premium_amount)}</p></div>
                  <div><p className="text-xs text-navy-400">Days remaining</p><p className={cx('font-semibold', d <= 15 && 'text-amber-600')}>{d} days</p></div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn-primary" onClick={() => setRenewing(r)}>Renew Now</button>
                  <button className="btn-outline" onClick={() => ask(r)}><Sparkles className="h-4 w-4" />Ask AI</button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <h2 className="mb-3 mt-9 text-lg font-semibold">Renewal timeline</h2>
      <div className="card p-5 sm:p-6">
        <ol className="relative space-y-6 border-l-2 border-navy-100 pl-6">
          {timeline.map((r) => {
            const done = r.renewal_status === 'Renewed'
            return (
              <li key={r.renewal_id} className="relative">
                <span className={cx('absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full ring-4 ring-white', done ? 'bg-emerald-500 text-white' : r.renewal_status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-navy-200 text-navy-600')}>
                  {done ? <CalendarCheck className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}</span>
                <p className="text-sm font-semibold">{r.policy_name} <span className="font-normal text-navy-400">· {fmtDateLong(r.renewal_due_date)}</span></p>
                <p className="text-sm text-navy-500">{done ? `Renewed on ${fmtDateLong(r.renewal_date)}` : r.reminder_sent ? 'Reminder sent' : 'Reminder will be sent before the due date'}</p>
              </li>
            )
          })}
        </ol>
      </div>

      <ConfirmDialog open={!!renewing} title={`Renew ${renewing?.policy_name}?`} confirmLabel="Continue to payment"
        message={`You’ll pay ${money(renewing?.premium_amount)} by ${renewing && fmtDateLong(renewing.renewal_due_date)} to avoid a late fee.`}
        onClose={() => setRenewing(null)}
        onConfirm={() => { toast('Payment gateway isn’t connected yet. TODO: integrate checkout (e.g. Razorpay) and a renewals endpoint.', 'info'); setRenewing(null) }} />
    </div>
  )
}
