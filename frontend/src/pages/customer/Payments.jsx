import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { api } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { DataTable, ErrorState, KeyValue, Modal, PageHeader, StatCard, StatusBadge } from '../../components/ui'
import { fmtDate, fmtDateLong, money } from '../../utils'

export default function Payments() {
  const navigate = useNavigate()
  const [sel, setSel] = useState(null)
  const { data, loading, error, reload } = useAsync(() => api.getPayments())
  if (error) return <ErrorState message={error} onRetry={reload} />
  const rows = data || []
  const ask = (p) => navigate('/app/assistant', { state: p.late_fee
    ? { prompt: `Why was I charged ₹${p.late_fee} extra on ${p.transaction_id}?`, context: { type: 'payment', id: p.transaction_id } }
    : { prompt: `Explain transaction ${p.transaction_id}`, context: { type: 'payment', id: p.transaction_id } } })

  const cols = [
    { key: 'transaction_id', label: 'Transaction ID', sortable: true, render: (r) => <span className="font-semibold">{r.transaction_id}</span> },
    { key: 'policy_number', label: 'Policy', sortable: true },
    { key: 'due_date', label: 'Due Date', sortable: true, render: (r) => fmtDate(r.due_date) },
    { key: 'payment_date', label: 'Payment Date', sortable: true, render: (r) => fmtDate(r.payment_date) },
    { key: 'amount', label: 'Amount', sortable: true, align: 'right', render: (r) => money(r.amount) },
    { key: 'late_fee', label: 'Late Fee', sortable: true, align: 'right', render: (r) => (r.late_fee ? <span className="font-semibold text-red-600">{money(r.late_fee)}</span> : '—') },
    { key: 'payment_status', label: 'Status', sortable: true, render: (r) => <StatusBadge status={r.payment_status} /> },
  ]
  return (
    <div>
      <PageHeader title="Payments & Penalties" subtitle="Select a transaction to see how it was calculated." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard loading={loading} label="Total paid" value={money(rows.filter((r) => r.payment_status === 'Paid').reduce((s, r) => s + r.amount_paid, 0))} />
        <StatCard loading={loading} label="Late fees charged" value={money(rows.reduce((s, r) => s + r.late_fee, 0))} />
        <StatCard loading={loading} label="Awaiting payment" value={money(rows.filter((r) => r.payment_status !== 'Paid').reduce((s, r) => s + r.amount, 0))} />
      </div>
      <DataTable loading={loading} columns={cols} rows={rows} searchKeys={['transaction_id', 'policy_number', 'policy_name']} filterKey="payment_status" filterLabel="All statuses" onRowClick={setSel} />

      <Modal open={!!sel} onClose={() => setSel(null)} title={`Transaction ${sel?.transaction_id}`} wide
        footer={sel && <><button className="btn-outline" onClick={() => setSel(null)}>Close</button><button className="btn-accent" onClick={() => ask(sel)}><Sparkles className="h-4 w-4" />{sel.late_fee ? 'Why was this penalty charged?' : 'Ask AI about this payment'}</button></>}>
        {sel && (
          <div className="space-y-5">
            <KeyValue items={[['Policy', `${sel.policy_name} (${sel.policy_number})`], ['Status', <StatusBadge status={sel.payment_status} />], ['Due date', fmtDateLong(sel.due_date)], ['Payment date', fmtDateLong(sel.payment_date)],
              ['Amount', money(sel.amount)], ['Payment mode', sel.payment_mode || '—']]} />
            {sel.late_fee > 0 ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-900">
                <p className="font-semibold">Late fee of {money(sel.late_fee)} applied</p>
                <p className="mt-1">Payment arrived {Math.round((new Date(sel.payment_date) - new Date(sel.due_date)) / 864e5)} days after the due date. Select “Why was this penalty charged?” for an explanation based on your record and the policy wording.</p>
              </div>
            ) : <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">No late fee on this transaction.</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
