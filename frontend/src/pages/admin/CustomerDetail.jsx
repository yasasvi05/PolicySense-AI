import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { CardSkeleton, DataTable, ErrorState, KeyValue, PageHeader, StatusBadge } from '../../components/ui'
import { fmtDate, fmtDateLong, money } from '../../utils'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => api.getCustomer(id), [id])
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading) return <CardSkeleton rows={6} />
  const { customer: c } = data
  const empty = <p className="px-5 py-8 text-center text-sm text-navy-400">No records.</p>
  return (
    <div>
      <button className="btn-ghost -ml-3 mb-2" onClick={() => navigate('/admin/customers')}><ArrowLeft className="h-4 w-4" />All customers</button>
      <PageHeader title={c.full_name} subtitle={`${c.customer_id} · Customer since ${fmtDateLong(c.customer_since)}`} />
      <section className="card mb-6 p-5">
        <KeyValue items={[['Email', c.email], ['Phone', c.phone], ['City', c.city], ['KYC Status', <StatusBadge status={c.kyc_status} />]]} />
      </section>
      <h2 className="mb-3 font-semibold">Policies</h2>
      <DataTable rows={data.policies} empty={empty} columns={[
        { key: 'policy_number', label: 'Policy' }, { key: 'policy_name', label: 'Name' }, { key: 'premium_amount', label: 'Premium', render: (r) => money(r.premium_amount) },
        { key: 'expiry_date', label: 'Expiry', render: (r) => fmtDate(r.expiry_date) }, { key: 'policy_status', label: 'Status', render: (r) => <StatusBadge status={r.policy_status} /> }]} />
      <h2 className="mb-3 mt-6 font-semibold">Payments</h2>
      <DataTable rows={data.payments} empty={empty} columns={[
        { key: 'transaction_id', label: 'Transaction' }, { key: 'due_date', label: 'Due', render: (r) => fmtDate(r.due_date) }, { key: 'payment_date', label: 'Paid', render: (r) => fmtDate(r.payment_date) },
        { key: 'late_fee', label: 'Late Fee', render: (r) => (r.late_fee ? money(r.late_fee) : '—') }, { key: 'payment_status', label: 'Status', render: (r) => <StatusBadge status={r.payment_status} /> }]} />
      <h2 className="mb-3 mt-6 font-semibold">Claims</h2>
      <DataTable rows={data.claims} empty={empty} columns={[
        { key: 'claim_id', label: 'Claim' }, { key: 'claim_date', label: 'Date', render: (r) => fmtDate(r.claim_date) }, { key: 'claim_amount', label: 'Amount', render: (r) => money(r.claim_amount) },
        { key: 'claim_status', label: 'Status', render: (r) => <StatusBadge status={r.claim_status} /> }]} />
    </div>
  )
}
