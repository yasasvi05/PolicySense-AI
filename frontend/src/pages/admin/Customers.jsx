import { useNavigate } from 'react-router-dom'
import { api } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { DataTable, ErrorState, PageHeader, StatusBadge } from '../../components/ui'

export default function Customers() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => api.getCustomers())
  if (error) return <ErrorState message={error} onRetry={reload} />
  const cols = [
    { key: 'customer_id', label: 'Customer ID', sortable: true, render: (r) => <span className="font-semibold">{r.customer_id}</span> },
    { key: 'full_name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'active_policies', label: 'Active Policies', sortable: true },
    { key: 'renewal_status', label: 'Renewal Status', sortable: true, render: (r) => <StatusBadge status={r.renewal_status} /> },
    { key: 'kyc_status', label: 'KYC Status', sortable: true, render: (r) => <StatusBadge status={r.kyc_status} /> },
    { key: 'a', label: 'Actions', render: (r) => <button className="btn-outline px-3 py-1.5" onClick={(e) => { e.stopPropagation(); navigate(`/admin/customers/${r.customer_id}`) }}>View profile</button> },
  ]
  return (
    <div>
      <PageHeader title="Customer Management" subtitle="Select a customer to see their policies, payments and claims." />
      <DataTable loading={loading} columns={cols} rows={data || []} searchKeys={['customer_id', 'full_name', 'email']} filterKey="renewal_status" filterLabel="All renewal statuses" onRowClick={(r) => navigate(`/admin/customers/${r.customer_id}`)} />
    </div>
  )
}
