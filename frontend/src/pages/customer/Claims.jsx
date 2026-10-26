import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { api } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { DataTable, ErrorState, KeyValue, Modal, PageHeader, StatusBadge } from '../../components/ui'
import { fmtDate, fmtDateLong, money } from '../../utils'

export default function Claims() {
  const navigate = useNavigate()
  const [sel, setSel] = useState(null)
  const { data, loading, error, reload } = useAsync(() => api.getClaims())
  if (error) return <ErrorState message={error} onRetry={reload} />
  const ask = (c) => navigate('/app/assistant', { state: { prompt: c.claim_status === 'Rejected' ? 'Why was my claim rejected?' : `What is the status of claim ${c.claim_id}?`, context: { type: 'claim', id: c.claim_id } } })

  const cols = [
    { key: 'claim_id', label: 'Claim ID', sortable: true, render: (r) => <span className="font-semibold">{r.claim_id}</span> },
    { key: 'policy_name', label: 'Policy', sortable: true },
    { key: 'claim_date', label: 'Claim Date', sortable: true, render: (r) => fmtDate(r.claim_date) },
    { key: 'claim_amount', label: 'Claim Amount', sortable: true, align: 'right', render: (r) => money(r.claim_amount) },
    { key: 'claim_status', label: 'Status', sortable: true, render: (r) => <StatusBadge status={r.claim_status} /> },
    { key: 'settlement_amount', label: 'Settlement', sortable: true, align: 'right', render: (r) => money(r.settlement_amount) },
    { key: 'action', label: '', render: (r) => r.claim_status === 'Rejected' && (
      <button className="btn-outline whitespace-nowrap px-3 py-1.5" onClick={(e) => { e.stopPropagation(); ask(r) }}><Sparkles className="h-3.5 w-3.5" />Why was my claim rejected?</button>) },
  ]
  return (
    <div>
      <PageHeader title="Claims" subtitle="Track every claim and understand each decision." />
      <DataTable loading={loading} columns={cols} rows={data || []} searchKeys={['claim_id', 'policy_name']} filterKey="claim_status" filterLabel="All statuses" onRowClick={setSel} />
      <Modal open={!!sel} onClose={() => setSel(null)} title={`Claim ${sel?.claim_id}`} wide
        footer={sel && <><button className="btn-outline" onClick={() => setSel(null)}>Close</button><button className="btn-accent" onClick={() => ask(sel)}><Sparkles className="h-4 w-4" />{sel.claim_status === 'Rejected' ? 'Why was my claim rejected?' : 'Ask AI about this claim'}</button></>}>
        {sel && <div className="space-y-4"><KeyValue items={[['Policy', sel.policy_name], ['Status', <StatusBadge status={sel.claim_status} />], ['Claim date', fmtDateLong(sel.claim_date)], ['Claim amount', money(sel.claim_amount)], ['Settlement amount', money(sel.settlement_amount)]]} />
          {sel.rejection_reason && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-900"><p className="font-semibold">Recorded reason</p><p className="mt-1">{sel.rejection_reason}</p></div>}</div>}
      </Modal>
    </div>
  )
}
