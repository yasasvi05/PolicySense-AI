import { useState } from 'react'
import { AlertTriangle, Bell, CalendarClock, CheckCheck, ClipboardList, CreditCard, ShieldAlert, Wallet } from 'lucide-react'
import { api } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/ui'
import { cx, fmtDate } from '../../utils'

const META = {
  renewal: { icon: CalendarClock, tone: 'bg-azure-50 text-azure-600' }, payment_due: { icon: Wallet, tone: 'bg-amber-50 text-amber-600' },
  payment_received: { icon: CreditCard, tone: 'bg-emerald-50 text-emerald-600' }, penalty: { icon: AlertTriangle, tone: 'bg-red-50 text-red-600' },
  claim: { icon: ClipboardList, tone: 'bg-azure-50 text-azure-600' }, expiry: { icon: ShieldAlert, tone: 'bg-amber-50 text-amber-600' },
}

export default function Notifications() {
  const { data, loading, error, reload } = useAsync(() => api.getNotifications())
  const [read, setRead] = useState(() => new Set(JSON.parse(localStorage.getItem('ps_read') || '[]')))
  const [type, setType] = useState('')
  if (error) return <ErrorState message={error} onRetry={reload} />
  const items = (data || []).filter((n) => !type || n.type === type)
  const markAll = () => { const s = new Set((data || []).map((n) => n.id)); setRead(s); localStorage.setItem('ps_read', JSON.stringify([...s])) }

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Reminders and updates about your account."
        actions={<><select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter notifications"><option value="">All types</option>{Object.keys(META).map((k) => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}</select>
          <button className="btn-outline" onClick={markAll}><CheckCheck className="h-4 w-4" />Mark all as read</button></>} />
      <div className="card divide-y divide-navy-100">
        {loading && [0, 1, 2, 3].map((i) => <div key={i} className="p-4"><Skeleton className="h-10" /></div>)}
        {!loading && items.length === 0 && <EmptyState icon={Bell} title="You’re all caught up" text="New reminders will show up here." />}
        {items.map((n) => {
          const { icon: Icon, tone } = META[n.type] || META.claim
          const unread = !read.has(n.id)
          return (
            <div key={n.id} className={cx('flex items-start gap-4 p-4 sm:px-5', unread && 'bg-azure-50/40')}>
              <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tone)}><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{n.title}</p><p className="text-sm text-navy-600">{n.message}</p></div>
              <div className="flex shrink-0 flex-col items-end gap-1.5"><span className="text-xs text-navy-400">{fmtDate(n.date)}</span>{unread && <span className="h-2 w-2 rounded-full bg-azure-500" aria-label="Unread" />}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
