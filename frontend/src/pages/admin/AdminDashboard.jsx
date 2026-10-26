import { BookOpenCheck, ClipboardList, FileCheck2, RefreshCw, Shield, Sparkles, Users } from 'lucide-react'
import { api } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { Bars, ChartCard, Donut, AreaTrend } from '../../components/Charts'
import { ErrorState, PageHeader, Skeleton, StatCard } from '../../components/ui'

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => api.getAnalytics())
  if (error) return <ErrorState message={error} onRetry={reload} />
  const c = data?.cards || {}
  const n = (v) => v?.toLocaleString('en-IN')
  return (
    <div>
      <PageHeader title="Admin overview" subtitle="Portfolio health and assistant activity at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard loading={loading} icon={Users} label="Total Customers" value={n(c.total_customers)} />
        <StatCard loading={loading} icon={Shield} label="Active Policies" value={n(c.active_policies)} />
        <StatCard loading={loading} icon={RefreshCw} label="Pending Renewals" value={n(c.pending_renewals)} />
        <StatCard loading={loading} icon={ClipboardList} label="Total Claims" value={n(c.total_claims)} />
        <StatCard loading={loading} icon={FileCheck2} label="Documents Indexed" value={n(c.documents_indexed)} />
        <StatCard loading={loading} icon={Sparkles} label="AI Queries Today" value={n(c.ai_queries_today)} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[320px] rounded-2xl" />) : <>
          <ChartCard title="Policy distribution" subtitle="Active policies by product"><Donut data={data.policy_distribution} /></ChartCard>
          <ChartCard title="Renewal status" subtitle="Current renewal pipeline"><Bars data={data.renewal_status} /></ChartCard>
          <ChartCard title="Customer queries" subtitle="Assistant questions, last 7 days"><AreaTrend data={data.customer_queries} x="day" y="queries" /></ChartCard>
          <ChartCard title="Claims status" subtitle="All claims by outcome"><Donut data={data.claims_status} /></ChartCard>
        </>}
      </div>
    </div>
  )
}
