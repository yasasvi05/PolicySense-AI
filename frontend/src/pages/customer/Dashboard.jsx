
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CalendarClock,
  ClipboardList,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { api } from '../../services'
import { realApi } from '../../services/realApi'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import {
  CardSkeleton,
  ErrorState,
  PageHeader,
  StatCard,
  StatusBadge,
  KeyValue,
} from '../../components/ui'
import {
  daysUntil,
  fmtDate,
  fmtDateLong,
  greeting,
  money,
} from '../../utils'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isBanking = user?.domain === 'banking'

  const { data, loading, error, reload } = useAsync(async () => {
    if (isBanking) {
      const bankingData = await realApi.getBankingOverview()
      return { ...bankingData, banking: true }
    }

    const [policies, renewals, payments, claims] = await Promise.all([
      api.getPolicies(),
      api.getRenewals(),
      api.getPayments(),
      api.getClaims(),
    ])

    return { policies, renewals, payments, claims, banking: false }
  })

  if (error) {
    return <ErrorState message={error} onRetry={reload} />
  }

  // BANKING DASHBOARD
  if (isBanking) {
    const accounts = data?.accounts ?? []
    const transactions = data?.transactions ?? []
    const cards = data?.cards ?? []
    const loans = data?.loans ?? []
    const complaints = data?.complaints ?? []

    const totalBalance = accounts.reduce(
      (sum, account) => sum + Number(account.balance ?? 0),
      0
    )

    return (
      <div>
        <PageHeader
          title={`${greeting()}, ${user?.name?.split(' ')[0]} 👋`}
          subtitle="Here's an overview of your banking accounts and services."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            loading={loading}
            icon={Wallet}
            label="Total Balance"
            value={money(totalBalance)}
            hint={`${accounts.length} bank account(s)`}
          />
          <StatCard
            loading={loading}
            icon={Shield}
            label="Bank Accounts"
            value={accounts.length}
            hint="Your registered accounts"
          />
          <StatCard
            loading={loading}
            icon={CalendarClock}
            label="Cards"
            value={cards.length}
            hint="Your registered bank cards"
          />
          <StatCard
            loading={loading}
            icon={ClipboardList}
            label="Loans"
            value={loans.length}
            hint="Your registered loans"
          />
        </div>

        {/* BANK ACCOUNTS */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Your bank accounts</h2>

          {loading ? (
            <CardSkeleton rows={3} />
          ) : accounts.length === 0 ? (
            <p className="card p-5 text-sm text-navy-600">
              No bank accounts found.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {accounts.map((account) => (
                <article key={account.account_id} className="card p-5">
                  <p className="font-semibold text-navy-900">
                    {account.account_type || 'Bank account'}
                  </p>

                  <p className="mt-1 text-sm text-navy-500">
                    Account: ••••
                    {String(
                      account.account_number ?? account.account_id
                    ).slice(-4)}
                  </p>

                  <p className="mt-4 text-sm text-navy-500">
                    Available balance
                  </p>

                  <p className="text-2xl font-semibold text-navy-900">
                    {money(Number(account.balance ?? 0))}
                  </p>

                  <div className="mt-3">
                    <StatusBadge status={account.account_status || 'Active'} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* RECENT TRANSACTIONS */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            Recent transactions
          </h2>

          {loading ? (
            <CardSkeleton rows={4} />
          ) : transactions.length === 0 ? (
            <p className="card p-5 text-sm text-navy-600">
              No transactions found.
            </p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy-100 bg-navy-50">
                  <tr>
                    <th className="p-4">Transaction</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr
                      key={transaction.transaction_id}
                      className="border-b border-navy-50 last:border-0"
                    >
                      <td className="p-4">
                        <p className="font-medium text-navy-900">
                          {transaction.description || 'Bank transaction'}
                        </p>
                        <p className="text-xs text-navy-500">
                          {transaction.transaction_type || ''}
                        </p>
                      </td>

                      <td className="whitespace-nowrap p-4">
                        {transaction.transaction_date || '—'}
                      </td>

                      <td className="whitespace-nowrap p-4 font-medium">
                        {money(Number(transaction.amount ?? 0))}
                      </td>

                      <td className="p-4">
                        <StatusBadge
                          status={transaction.transaction_status || 'Unknown'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CARDS AND LOANS */}
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="card p-5">
            <h2 className="mb-3 text-lg font-semibold">Your cards</h2>

            {cards.length === 0 ? (
              <p className="text-sm text-navy-600">No cards found.</p>
            ) : (
              <div className="space-y-4">
                {cards.map((card) => (
                  <div
                    key={card.card_id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-navy-900">
                        {card.card_type || 'Bank card'}
                      </p>
                      <p className="text-sm text-navy-500">
                        ••••
                        {String(card.card_number ?? card.card_id).slice(-4)}
                      </p>
                    </div>

                    <StatusBadge status={card.card_status || 'Unknown'} />
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="card p-5">
            <h2 className="mb-3 text-lg font-semibold">Your loans</h2>

            {loans.length === 0 ? (
              <p className="text-sm text-navy-600">No loans found.</p>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => (
                  <div
                    key={loan.loan_id}
                    className="border-b border-navy-100 pb-3 last:border-0"
                  >
                    <p className="font-medium text-navy-900">
                      {loan.loan_type || 'Loan'}
                    </p>

                    <p className="mt-1 text-sm text-navy-600">
                      Loan amount: {money(Number(loan.principal_amount ?? 0))}
                    </p>

                    <p className="text-sm text-navy-600">
                      Outstanding:{' '}
                      {money(Number(loan.outstanding_amount ?? 0))}
                    </p>

                    <StatusBadge status={loan.loan_status || 'Unknown'} />
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        {/* COMPLAINTS */}
        <section className="card mt-8 p-5">
          <h2 className="mb-3 text-lg font-semibold">Complaints</h2>

          {complaints.length === 0 ? (
            <p className="text-sm text-navy-600">No complaints found.</p>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <div
                  key={complaint.complaint_id}
                  className="border-b border-navy-100 pb-3 last:border-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-navy-900">
                      {complaint.complaint_type ||
                        complaint.subject ||
                        `Complaint ${complaint.complaint_id}`}
                    </p>

                    <StatusBadge
                      status={complaint.complaint_status || 'Unknown'}
                    />
                  </div>

                  <p className="mt-1 text-sm text-navy-600">
                    {complaint.description ||
                      complaint.subject ||
                      'Complaint details unavailable.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BANKING ASSISTANT */}
        <section className="card mt-8 p-5">
          <h2 className="mb-2 text-lg font-semibold">Banking Assistant</h2>

          <p className="text-sm text-navy-600">
            Ask questions about banking policies, accounts, cards, loans,
            fees, transactions, and complaints.
          </p>

          <Link to="/app/assistant" className="btn-accent mt-4 inline-flex">
            <Sparkles className="h-4 w-4" />
            Ask the assistant
          </Link>
        </section>
      </div>
    )
  }

  // INSURANCE DASHBOARD — PRESERVED
  const nextRenewal = data?.renewals
    ?.filter((r) => r.renewal_status !== 'Renewed')
    .sort((a, b) =>
      a.renewal_due_date.localeCompare(b.renewal_due_date)
    )[0]

  const outstanding = data?.payments
    ?.filter((p) => ['Pending', 'Overdue'].includes(p.payment_status))
    .reduce((sum, p) => sum + p.amount, 0)

  const lateFee = data?.payments?.find((p) => p.late_fee > 0)

  const pendingClaims =
    data?.claims?.filter((c) => c.claim_status === 'Pending').length ?? 0

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here’s an overview of your policies and account."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          icon={Shield}
          label="Active Policies"
          value={data?.policies?.filter(
            (p) => p.policy_status === 'Active'
          ).length}
          hint="All covers in force"
        />

        <StatCard
          loading={loading}
          icon={CalendarClock}
          label="Next Renewal"
          value={nextRenewal ? fmtDate(nextRenewal.renewal_due_date) : '—'}
          hint={
            nextRenewal &&
            `${nextRenewal.policy_name} · in ${daysUntil(nextRenewal.renewal_due_date)} days`
          }
        />

        <StatCard
          loading={loading}
          icon={Wallet}
          label="Outstanding Amount"
          value={money(outstanding ?? 0)}
          hint={outstanding ? 'Premium awaiting payment' : 'Nothing due'}
        />

        <StatCard
          loading={loading}
          icon={ClipboardList}
          label="Recent Claims"
          value={data?.claims?.length ?? 0}
          hint={`${pendingClaims} in review`}
        />
      </div>

      {lateFee && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-azure-100 bg-azure-50 p-4 sm:p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-azure-600">
            <AlertCircle className="h-5 w-5" />
          </span>

          <div className="min-w-[220px] flex-1">
            <p className="font-semibold text-navy-900">
              A {money(lateFee.late_fee)} late fee was added to{' '}
              {lateFee.transaction_id}
            </p>

            <p className="text-sm text-navy-600">
              Not sure why? The assistant can check your payment record against
              the policy terms.
            </p>
          </div>

          <button
            className="btn-accent"
            onClick={() =>
              navigate('/app/assistant', {
                state: {
                  prompt: `Why was I charged ₹${lateFee.late_fee} extra?`,
                  context: {
                    type: 'payment',
                    id: lateFee.transaction_id,
                  },
                },
              })
            }
          >
            <Sparkles className="h-4 w-4" />
            Ask why
          </button>
        </div>
      )}

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your policies</h2>

        <Link
          to="/app/policy"
          className="text-sm font-semibold text-azure-700 hover:underline"
        >
          View details
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {loading
          ? [0, 1, 2].map((i) => <CardSkeleton key={i} rows={5} />)
          : data?.policies?.map((p) => {
              const ren = data.renewals.find(
                (r) =>
                  r.policy_id === p.policy_id &&
                  r.renewal_status !== 'Renewed'
              )

              return (
                <article key={p.policy_id} className="card p-5">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-navy-900">
                        {p.policy_name}
                      </p>
                      <p className="text-xs text-navy-400">
                        {p.policy_type} insurance
                      </p>
                    </div>

                    <StatusBadge status={p.policy_status} />
                  </div>

                  <KeyValue
                    items={[
                      ['Policy Number', p.policy_number],
                      ['Premium', money(p.premium_amount)],
                      ['Expiry Date', fmtDateLong(p.expiry_date)],
                      [
                        'Renewal Status',
                        ren ? <StatusBadge status={ren.renewal_status} /> : '—',
                      ],
                      ['Coverage Amount', money(p.coverage_amount)],
                    ]}
                  />
                </article>
              )
            })}
      </div>
    </div>
  )
}
