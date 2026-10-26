import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, Sparkles, XCircle } from 'lucide-react'
import { api } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { CardSkeleton, ErrorState, KeyValue, PageHeader, StatusBadge } from '../../components/ui'
import { daysUntil, fmtDateLong, money, cx } from '../../utils'

const Section = ({ title, children }) => <section className="card p-5"><h2 className="mb-4 font-semibold text-navy-900">{title}</h2>{children}</section>
const List = ({ items, icon: Icon, tone }) => <ul className="space-y-2.5 text-sm text-navy-700">{items.map((i) => <li key={i} className="flex gap-2.5"><Icon className={cx('mt-0.5 h-4 w-4 shrink-0', tone)} />{i}</li>)}</ul>

export default function PolicyDetails() {
  const navigate = useNavigate()
  const [sel, setSel] = useState(0)
  const { data, loading, error, reload } = useAsync(async () => {
    const [policies, renewals] = await Promise.all([api.getPolicies(), api.getRenewals()])
    return { policies, renewals }
  })
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading) return <><PageHeader title="Policy Details" /><div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} rows={4} />)}</div></>

  const p = data.policies[sel]
  const ren = data.renewals.find((r) => r.policy_id === p.policy_id && r.renewal_status !== 'Renewed')
  return (
    <div>
      <PageHeader title="Policy Details" subtitle="Everything about your cover in one place."
        actions={<button className="btn-accent" onClick={() => navigate('/app/assistant', { state: { prompt: `What does my ${p.policy_name} policy cover?`, context: { type: 'policy', id: p.policy_number } } })}><Sparkles className="h-4 w-4" />Ask AI about this policy</button>} />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {data.policies.map((x, i) => (
          <button key={x.policy_id} role="tab" aria-selected={i === sel} onClick={() => setSel(i)}
            className={cx('shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition', i === sel ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 bg-white text-navy-600 hover:bg-navy-50')}>{x.policy_name}</button>))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Policy Overview">
          <KeyValue items={[['Policy Number', p.policy_number], ['Policy Type', `${p.policy_type} insurance`], ['Start Date', fmtDateLong(p.issue_date)], ['Expiry Date', fmtDateLong(p.expiry_date)],
            ['Premium', money(p.premium_amount)], ['Coverage Amount', money(p.coverage_amount)], ['Status', <StatusBadge status={p.policy_status} />]]} />
        </Section>
        <Section title="Coverage & Premium">
          <KeyValue items={[['Sum insured', money(p.coverage_amount)], ['Annual premium', money(p.premium_amount)], ['Policy period', `${fmtDateLong(p.issue_date)} – ${fmtDateLong(p.expiry_date)}`], ['Days left in period', Math.max(0, daysUntil(p.expiry_date))]]} />
        </Section>
        <Section title="Renewal Information">
          <KeyValue items={[['Renewal due', fmtDateLong(p.renewal_due_date)], ['Renewal status', ren ? <StatusBadge status={ren.renewal_status} /> : '—'], ['Days remaining', Math.max(0, daysUntil(p.renewal_due_date))], ['Grace period', '30 days after due date']]} />
        </Section>
        <Section title="Documents"><ul className="space-y-2">{p.documents.map((d) => <li key={d} className="flex items-center gap-2.5 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700"><FileText className="h-4 w-4 text-azure-600" />{d}</li>)}</ul></Section>
        <Section title="Benefits"><List items={p.benefits} icon={CheckCircle2} tone="text-emerald-600" /></Section>
        <Section title="Exclusions"><List items={p.exclusions} icon={XCircle} tone="text-red-500" /></Section>
      </div>
    </div>
  )
}
