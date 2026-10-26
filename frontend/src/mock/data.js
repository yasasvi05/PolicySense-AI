// ───────────────────────────────────────────────────────────────────────────
// MOCK DATA LAYER – synthetic demo data. Same JSON shapes as the FastAPI backend,
// so switching VITE_USE_MOCK=false requires no UI changes.
// ───────────────────────────────────────────────────────────────────────────
const iso = (offsetDays) => new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10)

export const MOCK_USERS = {
  'rahul.sharma@example.com': { password: 'Customer@123', user: { id: 1, email: 'rahul.sharma@example.com', role: 'customer', name: 'Rahul Sharma', customer_id: 'CUST1001' } },
  'admin@policysense.ai': { password: 'Admin@123', user: { id: 2, email: 'admin@policysense.ai', role: 'admin', name: 'Admin User', customer_id: null } },
}

export const customer = {
  customer_id: 'CUST1001', full_name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98765 43210',
  date_of_birth: '1994-03-18', address: 'Plot 42, Road No. 7, Jubilee Hills', city: 'Hyderabad', state: 'Telangana',
  pincode: '500033', kyc_status: 'Verified', customer_since: '2021-04-12',
}

const catalog = {
  Health: {
    benefits: ['Cashless hospitalisation at network hospitals', 'Day-care procedures covered', 'Pre (30 days) and post (60 days) hospitalisation costs', 'Annual health check-up', 'Ambulance cover up to ₹3,000'],
    exclusions: ['Cosmetic or plastic surgery (Section 8.1)', 'Infertility and assisted reproduction', 'Pre-existing conditions during first 24 months (Section 4.3)', 'Treatment outside India'],
    documents: ['Health_Secure_Plus_Terms.txt', 'Policy_Schedule.pdf', 'Claim_Form.pdf'],
  },
  Motor: {
    benefits: ['Own damage cover', 'Third-party liability', '24x7 roadside assistance', 'No-claim bonus up to 50%'],
    exclusions: ['Drunk driving', 'Driving without a valid licence', 'Consequential loss', 'Wear and tear'],
    documents: ['Motor_Shield_Terms.txt', 'Policy_Schedule.pdf'],
  },
  Life: {
    benefits: ['Death benefit to nominee', 'Accidental death rider', 'Terminal illness benefit', 'Tax benefits under applicable law'],
    exclusions: ['Suicide within first 12 months', 'Death due to war or hazardous activities', 'Non-disclosure of material facts'],
    documents: ['Term_Life_Assure_Brochure.pdf', 'Policy_Schedule.pdf'],
  },
}

const soon = iso(12)
export const policies = [
  { policy_id: 1, customer_id: 'CUST1001', policy_number: 'POL10245', policy_type: 'Health', policy_name: 'Health Secure Plus', issue_date: '2026-07-02', expiry_date: '2027-07-01', renewal_due_date: '2027-07-02', premium_amount: 12500, coverage_amount: 500000, policy_status: 'Active', ...catalog.Health },
  { policy_id: 2, customer_id: 'CUST1001', policy_number: 'POL20871', policy_type: 'Motor', policy_name: 'Motor Shield Comprehensive', issue_date: iso(-353), expiry_date: iso(11), renewal_due_date: soon, premium_amount: 8200, coverage_amount: 650000, policy_status: 'Active', ...catalog.Motor },
  { policy_id: 3, customer_id: 'CUST1001', policy_number: 'POL30412', policy_type: 'Life', policy_name: 'Term Life Assure', issue_date: '2026-03-15', expiry_date: '2027-03-14', renewal_due_date: '2027-03-15', premium_amount: 18400, coverage_amount: 5000000, policy_status: 'Active', ...catalog.Life },
]
const P = Object.fromEntries(policies.map((p) => [p.policy_id, p]))
const meta = (id) => ({ policy_id: id, policy_number: P[id].policy_number, policy_name: P[id].policy_name })

export const payments = [
  { payment_id: 4, transaction_id: 'TXN1004', ...meta(2), due_date: soon, payment_date: null, amount_paid: 0, amount: 8200, late_fee: 0, payment_status: 'Pending', payment_mode: null },
  { payment_id: 1, transaction_id: 'TXN1001', ...meta(1), due_date: '2026-07-02', payment_date: '2026-07-05', amount_paid: 12500, amount: 12500, late_fee: 500, payment_status: 'Paid', payment_mode: 'UPI' },
  { payment_id: 2, transaction_id: 'TXN1002', ...meta(3), due_date: '2026-03-15', payment_date: '2026-03-14', amount_paid: 18400, amount: 18400, late_fee: 0, payment_status: 'Paid', payment_mode: 'Net Banking' },
  { payment_id: 3, transaction_id: 'TXN1003', ...meta(2), due_date: iso(-353), payment_date: iso(-354), amount_paid: 8200, amount: 8200, late_fee: 0, payment_status: 'Paid', payment_mode: 'Card' },
]

export const claims = [
  { claim_id: 'CLM7003', ...meta(1), claim_date: '2026-09-02', claim_amount: 60000, claim_status: 'Rejected', rejection_reason: 'The procedure is classified as cosmetic surgery, which is excluded under Section 8.1.', settlement_amount: null },
  { claim_id: 'CLM7002', ...meta(2), claim_date: iso(-20), claim_amount: 42000, claim_status: 'Pending', rejection_reason: null, settlement_amount: null },
  { claim_id: 'CLM7001', ...meta(1), claim_date: '2026-08-12', claim_amount: 85000, claim_status: 'Approved', rejection_reason: null, settlement_amount: 78000 },
]

export const renewals = [
  { renewal_id: 3, ...meta(2), renewal_due_date: soon, renewal_status: 'Pending', reminder_sent: true, renewal_date: null, premium_amount: 8200 },
  { renewal_id: 4, ...meta(3), renewal_due_date: '2027-03-15', renewal_status: 'Upcoming', reminder_sent: false, renewal_date: null, premium_amount: 18400 },
  { renewal_id: 2, ...meta(1), renewal_due_date: '2027-07-02', renewal_status: 'Upcoming', reminder_sent: false, renewal_date: null, premium_amount: 12500 },
  { renewal_id: 1, ...meta(1), renewal_due_date: '2026-07-02', renewal_status: 'Renewed', reminder_sent: true, renewal_date: '2026-07-05', premium_amount: 12500 },
]

const daysUntil = (d) => Math.ceil((new Date(d) - new Date(iso(0))) / 864e5)
export function buildNotifications() {
  const out = []
  renewals.filter((r) => r.renewal_status !== 'Renewed' && daysUntil(r.renewal_due_date) <= 30).forEach((r) =>
    out.push({ id: `ren-${r.renewal_id}`, type: 'renewal', title: 'Upcoming renewal', date: iso(0), message: `Your ${r.policy_name} policy renewal is due in ${daysUntil(r.renewal_due_date)} days.` }))
  payments.forEach((p) => {
    if (p.payment_status === 'Pending') out.push({ id: `due-${p.payment_id}`, type: 'payment_due', title: 'Payment due', date: iso(0), message: `Premium of ₹${p.amount.toLocaleString('en-IN')} for ${p.policy_name} is due on ${p.due_date}.` })
    else out.push({ id: `rcv-${p.payment_id}`, type: 'payment_received', title: 'Payment received', date: p.payment_date, message: `We received ₹${p.amount.toLocaleString('en-IN')} for ${p.policy_name} on ${p.payment_date}.` })
    if (p.late_fee) out.push({ id: `pen-${p.payment_id}`, type: 'penalty', title: 'Penalty applied', date: p.payment_date, message: `A late fee of ₹${p.late_fee} was added to ${p.transaction_id}.` })
  })
  claims.forEach((c) => out.push({ id: `clm-${c.claim_id}`, type: 'claim', title: 'Claim status update', date: c.claim_date, message: `Claim ${c.claim_id} for ${c.policy_name} is ${c.claim_status}.` }))
  policies.filter((p) => daysUntil(p.expiry_date) >= 0 && daysUntil(p.expiry_date) <= 30).forEach((p) =>
    out.push({ id: `exp-${p.policy_id}`, type: 'expiry', title: 'Policy expiry', date: iso(0), message: `${p.policy_name} expires on ${p.expiry_date}.` }))
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

// Clauses the mock "ChromaDB" returns. In live mode these come from your uploaded PDFs.
export const clauses = {
  late: { title: 'Late Payment Clause', section: '6.2', document: 'Health_Secure_Plus_Terms.txt', score: 0.91, excerpt: 'If the renewal premium is received after the due date but within the 30-day grace period, a late payment fee is added to the premium payable. A late fee of Rs 500 applies when payment is received 1 to 15 days after the due date. A late fee of Rs 1,000 applies when payment is received 16 to 30 days after the due date.' },
  renewal: { title: 'Renewal and Grace Period', section: '7.1', document: 'Health_Secure_Plus_Terms.txt', score: 0.88, excerpt: 'The policy must be renewed on or before the renewal due date. A grace period of 30 days is allowed after the due date, during which no claims are payable. If the policy is not renewed within the grace period it lapses, and continuity benefits such as waiting-period credits and the no-claim bonus are lost.' },
  exclusion: { title: 'Exclusions', section: '8.1', document: 'Health_Secure_Plus_Terms.txt', score: 0.9, excerpt: 'The following are not covered: cosmetic or plastic surgery unless needed after an accident or for cancer treatment, dental treatment unless caused by an accident, infertility and assisted reproduction, self-inflicted injury, injury arising from war, and treatment taken outside India.' },
  coverage: { title: 'Coverage', section: '3.1', document: 'Health_Secure_Plus_Terms.txt', score: 0.86, excerpt: 'The policy covers in-patient hospitalisation of 24 hours or more, day-care procedures, pre-hospitalisation expenses for 30 days and post-hospitalisation expenses for 60 days, ambulance charges up to Rs 3,000 per event, and one annual health check-up.' },
}

export const adminDocuments = [
  { id: 1, filename: 'Health_Secure_Plus.pdf', policy_type: 'Health', uploaded_at: '2026-10-08T10:20:00', chunk_count: 42, status: 'Indexed', detail: 'Simulated (mock mode).' },
  { id: 2, filename: 'Motor_Shield_Terms.pdf', policy_type: 'Motor', uploaded_at: '2026-10-02T14:05:00', chunk_count: 31, status: 'Indexed', detail: 'Simulated (mock mode).' },
  { id: 3, filename: 'Term_Life_Assure_Brochure.pdf', policy_type: 'Life', uploaded_at: '2026-09-21T09:40:00', chunk_count: 27, status: 'Indexed', detail: 'Simulated (mock mode).' },
  { id: 4, filename: 'Claims_FAQ_2026.pdf', policy_type: 'General', uploaded_at: '2026-09-10T16:15:00', chunk_count: 18, status: 'Indexed', detail: 'Simulated (mock mode).' },
]

export const adminCustomers = [
  { customer_id: 'CUST1001', full_name: 'Rahul Sharma', email: 'rahul.sharma@example.com', city: 'Hyderabad', kyc_status: 'Verified', active_policies: 3, renewal_status: 'Pending' },
  { customer_id: 'CUST1002', full_name: 'Priya Nair', email: 'priya@example.com', city: 'Kochi', kyc_status: 'Verified', active_policies: 1, renewal_status: 'Pending' },
  { customer_id: 'CUST1003', full_name: 'Arjun Mehta', email: 'arjun@example.com', city: 'Mumbai', kyc_status: 'Verified', active_policies: 1, renewal_status: 'Up to date' },
  { customer_id: 'CUST1004', full_name: 'Sneha Iyer', email: 'sneha@example.com', city: 'Chennai', kyc_status: 'Pending', active_policies: 1, renewal_status: 'Up to date' },
  { customer_id: 'CUST1005', full_name: 'Vikram Rao', email: 'vikram@example.com', city: 'Bengaluru', kyc_status: 'Verified', active_policies: 1, renewal_status: 'Pending' },
  { customer_id: 'CUST1006', full_name: 'Ananya Das', email: 'ananya@example.com', city: 'Kolkata', kyc_status: 'Rejected', active_policies: 1, renewal_status: 'Up to date' },
]

export const analytics = {
  cards: { total_customers: 1284, active_policies: 2146, pending_renewals: 137, total_claims: 412, documents_indexed: 4, ai_queries_today: 86 },
  policy_distribution: [{ name: 'Health', value: 968 }, { name: 'Motor', value: 702 }, { name: 'Life', value: 476 }],
  renewal_status: [{ name: 'Renewed', value: 1480 }, { name: 'Pending', value: 137 }, { name: 'Upcoming', value: 420 }, { name: 'Overdue', value: 38 }],
  claims_status: [{ name: 'Approved', value: 268 }, { name: 'Pending', value: 94 }, { name: 'Rejected', value: 50 }],
  customer_queries: [{ day: 'Mon', queries: 72 }, { day: 'Tue', queries: 88 }, { day: 'Wed', queries: 95 }, { day: 'Thu', queries: 81 }, { day: 'Fri', queries: 104 }, { day: 'Sat', queries: 59 }, { day: 'Sun', queries: 86 }],
  query_insights: [{ name: 'Penalty Queries', value: 35 }, { name: 'Renewal Queries', value: 28 }, { name: 'Claim Queries', value: 22 }, { name: 'Policy Information', value: 15 }],
  top_queries: [{ name: 'Why was I charged extra?', value: 214 }, { name: 'When is my renewal due?', value: 176 }, { name: 'Why was my claim rejected?', value: 139 }, { name: 'What does my policy cover?', value: 97 }, { name: 'What happens if I miss my renewal?', value: 84 }],
  ai_usage: [{ name: 'gemini', value: 78 }, { name: 'template-fallback', value: 22 }],
  renewal_trends: [{ month: 'May', renewed: 62, lapsed: 8 }, { month: 'Jun', renewed: 70, lapsed: 6 }, { month: 'Jul', renewed: 74, lapsed: 9 }, { month: 'Aug', renewed: 81, lapsed: 5 }, { month: 'Sep', renewed: 88, lapsed: 7 }, { month: 'Oct', renewed: 93, lapsed: 4 }],
}
