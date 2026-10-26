// Mock implementation of the API contract in services/realApi.js.
// Every function here is a stand-in for a real endpoint; nothing here talks to a server.
import * as d from './data'

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms))
const clone = (x) => JSON.parse(JSON.stringify(x))
const fmt = (s) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`
let profile = clone(d.customer)
let docs = clone(d.adminDocuments)

const trace = (facts, clauseCount) => [
  { step: 'FastAPI', status: 'mock', detail: 'Simulated – no request sent' },
  { step: 'PostgreSQL', status: 'mock', detail: `${facts} facts from mock data` },
  { step: 'ChromaDB', status: 'mock', detail: `${clauseCount} clause from mock data` },
  { step: 'LangChain', status: 'mock', detail: 'Not executed in mock mode' },
  { step: 'Gemini LLM', status: 'mock', detail: 'Canned answer, no model call' },
]

// TODO(backend): replaced by POST /api/assistant/query (see services/realApi.js)
function mockAnswer(message, context) {
  const m = message.toLowerCase()
  let intent = 'coverage'
  if (context?.type === 'payment' || /extra|charged|penalty|fee|charge/.test(m)) intent = 'penalty'
  else if (context?.type === 'claim' || /claim|reject/.test(m)) intent = 'claim'
  else if (context?.type === 'renewal' || /renew|miss|expire|lapse|due/.test(m)) intent = 'renewal'

  let answer, customer_sources, record, policy
  if (intent === 'penalty') {
    const p = d.payments.find((x) => x.transaction_id === (context?.id || 'TXN1001')) || d.payments[1]
    record = p
    const late = p.payment_date ? Math.round((new Date(p.payment_date) - new Date(p.due_date)) / 864e5) : null
    policy = d.clauses.late
    answer = p.late_fee
      ? `Your premium for ${p.policy_name} was due on ${fmt(p.due_date)}, but your payment was received on ${fmt(p.payment_date)}, ${late} days later. According to the late payment clause (Section 6.2), a ${money(p.late_fee)} penalty was applied.`
      : `No late fee was applied to ${p.transaction_id}. The payment was made on or before the due date.`
    customer_sources = [{ label: 'Payment Date', value: p.payment_date ? fmt(p.payment_date) : '—' }, { label: 'Due Date', value: fmt(p.due_date) }, { label: 'Days Late', value: String(late ?? '—') }, { label: 'Penalty', value: money(p.late_fee) }]
  } else if (intent === 'claim') {
    const c = d.claims.find((x) => x.claim_id === context?.id) || d.claims[0]
    record = c
    policy = d.clauses.exclusion
    answer = c.rejection_reason
      ? `Claim ${c.claim_id} for ${money(c.claim_amount)} was rejected. ${c.rejection_reason} Cosmetic procedures are not covered unless needed after an accident or for cancer treatment.`
      : `Claim ${c.claim_id} for ${money(c.claim_amount)} is currently ${c.claim_status}.`
    customer_sources = [{ label: 'Claim ID', value: c.claim_id }, { label: 'Claim Amount', value: money(c.claim_amount) }, { label: 'Status', value: c.claim_status }, ...(c.rejection_reason ? [{ label: 'Rejection Reason', value: c.rejection_reason }] : [])]
  } else if (intent === 'renewal') {
    const r = d.renewals.find((x) => x.policy_number === context?.id && x.renewal_status !== 'Renewed') || d.renewals[0]
    record = r
    policy = d.clauses.renewal
    const days = Math.ceil((new Date(r.renewal_due_date) - new Date()) / 864e5)
    answer = /miss|lapse|happen/.test(m)
      ? `If you miss the ${fmt(r.renewal_due_date)} renewal for ${r.policy_name}, you get a 30-day grace period, but no claims are payable during it. After that the policy lapses and benefits like the no-claim bonus are lost (Section 7.1).`
      : `Your ${r.policy_name} renewal is due on ${fmt(r.renewal_due_date)} (${days} days away) and the premium is ${money(r.premium_amount)}. A 30-day grace period applies afterwards (Section 7.1).`
    customer_sources = [{ label: 'Policy', value: r.policy_name }, { label: 'Renewal Due', value: fmt(r.renewal_due_date) }, { label: 'Days Remaining', value: String(days) }, { label: 'Premium', value: money(r.premium_amount) }]
  } else {
    const p = d.policies.find((x) => x.policy_number === context?.id) || d.policies[0]
    record = p
    policy = d.clauses.coverage
    answer = `${p.policy_name} provides ${money(p.coverage_amount)} of coverage. It includes in-patient hospitalisation, day-care procedures, pre/post-hospitalisation costs and an annual health check-up (Section 3.1). Exclusions such as cosmetic surgery are in Section 8.1.`
    customer_sources = [{ label: 'Policy', value: p.policy_name }, { label: 'Coverage', value: money(p.coverage_amount) }, { label: 'Premium', value: money(p.premium_amount) }, { label: 'Expiry', value: fmt(p.expiry_date) }]
  }
  return { query_id: Date.now(), answer, intent, mode: 'mock', generation: 'mock', retrieval: 'mock', grounded: true, customer_sources, customer_record: record, policy_sources: [policy], pipeline: trace(customer_sources.length, 1), latency_ms: 0 }
}

export const mockApi = {
  async login(email, password) {
    await wait(500)
    const hit = d.MOCK_USERS[email.trim().toLowerCase()]
    if (!hit || hit.password !== password) throw new Error('Incorrect email or password')
    return { access_token: 'mock-token-' + hit.user.role, token_type: 'bearer', user: hit.user }
  },
  async register({ customer_id, email, password }) {
    await wait(700)
    const c = d.adminCustomers.find((x) => x.customer_id === customer_id.toUpperCase() && x.email.toLowerCase() === email.trim().toLowerCase())
    if (!c) throw new Error("We couldn't match those details to an eligible customer record.")
    if (c.customer_id === 'CUST1001' || d.MOCK_USERS[c.email.toLowerCase()]) throw new Error('An account already exists for this customer. Please sign in instead.')
    const user = { id: Date.now(), email: c.email, role: 'customer', name: c.full_name, customer_id: c.customer_id }
    d.MOCK_USERS[c.email.toLowerCase()] = { password, user }
    return { access_token: 'mock-token-customer', token_type: 'bearer', user }
  },
  async getProfile() { await wait(); return clone(profile) },
  async updateProfile(changes) { await wait(); profile = { ...profile, ...changes }; return clone(profile) },
  async getPolicies() { await wait(); return clone(d.policies) },
  async getPayments() { await wait(); return clone(d.payments) },
  async getRenewals() { await wait(); return clone(d.renewals) },
  async getClaims() { await wait(); return clone(d.claims) },
  async getNotifications() { await wait(); return d.buildNotifications() },
  async queryAssistant({ message, context }) { await wait(1100); return mockAnswer(message, context) },
  async getSources() { await wait(200); return {} },
  async sendFeedback() { await wait(150); return { ok: true } },
  async getDocuments() { await wait(); return clone(docs) },
  async uploadDocument(file, policyType) {
    await wait(2200)
    const doc = { id: Date.now(), filename: file.name, policy_type: policyType, uploaded_at: new Date().toISOString(), chunk_count: 20 + (Math.round(file.size / 4000) % 40), status: 'Indexed', detail: 'Simulated indexing (mock mode) – nothing was embedded.' }
    docs = [doc, ...docs]
    const steps = ['Upload PDF', 'Extract Text', 'Chunk Document', 'Generate Embeddings', 'Store in ChromaDB', 'Ready for Retrieval'].map((name) => ({ name, done: true }))
    return { ...doc, steps }
  },
  async deleteDocument(id) { await wait(400); docs = docs.filter((x) => x.id !== id) },
  async getCustomers() { await wait(); return clone(d.adminCustomers) },
  async getCustomer(id) {
    await wait()
    const c = d.adminCustomers.find((x) => x.customer_id === id)
    if (!c) throw new Error('Customer not found')
    const rahul = id === 'CUST1001'
    return { customer: { ...d.customer, customer_id: id, full_name: c.full_name, email: c.email, city: c.city, kyc_status: c.kyc_status }, policies: rahul ? clone(d.policies) : clone(d.policies.slice(0, c.active_policies)), payments: rahul ? clone(d.payments) : [], claims: rahul ? clone(d.claims) : [], renewals: rahul ? clone(d.renewals) : [] }
  },
  async getAnalytics() { await wait(); return clone(d.analytics) },
}
