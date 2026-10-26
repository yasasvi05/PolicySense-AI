import { api } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { Bars, ChartCard, Donut, TwoLines } from '../../components/Charts'
import { ErrorState, PageHeader, Skeleton } from '../../components/ui'

export default function Analytics() {
  const { data, loading, error, reload } = useAsync(() => api.getAnalytics())
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <div>
      <PageHeader title="Analytics" subtitle="What customers ask, and how the assistant answers." />
      {loading ? <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[320px] rounded-2xl" />)}</div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card p-5 lg:col-span-2">
            <h2 className="font-semibold">AI Query Insights</h2>
            <p className="text-xs text-navy-400">Share of questions by topic</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {data.query_insights.map((q) => (
                <div key={q.name}>
                  <div className="flex items-baseline justify-between"><p className="text-sm font-medium text-navy-700">{q.name}</p><p className="text-lg font-bold">{q.value}%</p></div>
                  <div className="mt-2 h-2 rounded-full bg-navy-100"><div className="h-2 rounded-full bg-azure-500" style={{ width: `${q.value}%` }} /></div>
                </div>))}
            </div>
          </section>
          <ChartCard title="Most common customer queries" height={260}><Bars horizontal data={data.top_queries} /></ChartCard>
          <ChartCard title="Policy categories" height={260}><Donut data={data.policy_distribution} /></ChartCard>
          <ChartCard title="Renewal trends" subtitle="Renewed vs lapsed policies per month" height={260}><TwoLines data={data.renewal_trends} x="month" a="renewed" b="lapsed" /></ChartCard>
          <ChartCard title="AI response usage" subtitle="How answers were generated" height={260}><Donut data={data.ai_usage} /></ChartCard>
        </div>
      )}
    </div>
  )
}
