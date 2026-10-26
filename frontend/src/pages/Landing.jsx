import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, Bell, Check, ChevronDown, CreditCard, Database, FileSearch, FileText, KeyRound, Lock, ShieldCheck, Sparkles, UserCheck, Layers, Brain, Workflow } from 'lucide-react'
import { Logo } from '../components/ui'
import { cx } from '../utils'

const FEATURES = [
  { icon: Sparkles, title: 'AI Policy Assistant', text: 'Ask in plain language and get a clear, sourced answer.' },
  { icon: UserCheck, title: 'Personalized Answers', text: 'Responses use your own dates, amounts and policy details.' },
  { icon: Bell, title: 'Renewal Tracking', text: 'See what is due, how soon, and what happens if you wait.' },
  { icon: CreditCard, title: 'Payment & Penalty Explanation', text: 'Understand every late fee against the clause behind it.' },
  { icon: FileSearch, title: 'Policy Document Search', text: 'Find the exact section of your terms without reading 40 pages.' },
  { icon: FileText, title: 'Claim Information', text: 'Know where a claim stands and why a decision was made.' },
]
const STEPS = [
  ['You ask a question', 'Type it the way you would say it, for example “Why was I charged ₹500 extra?”'],
  ['We look up both sides', 'Your records come from the customer database. The matching wording comes from your policy documents.'],
  ['The AI explains why', 'It connects the two and tells you what happened and which clause applies.'],
  ['You see the proof', 'Every answer lists the record and the clause it was built from.'],
]
const FAQ = [
  ['Does the assistant see other customers’ data?', 'No. Every request is tied to your signed-in account, and the server only reads records that belong to you.'],
  ['Where do the answers come from?', 'From two places: your account records in PostgreSQL and your policy documents indexed in ChromaDB. The answer panel shows both.'],
  ['What if the assistant cannot find a matching record?', 'It says so instead of guessing, and the response is marked as not fully grounded.'],
  ['Can I trust the answer for a dispute?', 'Treat it as an explanation. For formal disputes, use the clause reference it shows and contact support.'],
]

function FlowCard() {
  const Box = ({ icon: Icon, title, sub }) => (
    <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-900 text-white"><Icon className="h-[18px] w-[18px]" /></span><div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-navy-500">{sub}</p></div></div>)
  const Arrow = () => <ArrowDown className="mx-auto my-1.5 h-4 w-4 text-azure-500" />
  return (
    <div className="card mx-auto w-full max-w-md bg-white/80 p-5 shadow-lift backdrop-blur">
      <Box icon={Sparkles} title="Customer Query" sub="“Why was I charged ₹500 extra?”" /><Arrow />
      <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-azure-50 p-3 text-sm"><Database className="mb-1 h-4 w-4 text-azure-600" /><p className="font-semibold">Structured data</p><p className="text-xs text-navy-500">Payments, dates, fees</p></div>
        <div className="rounded-xl bg-azure-50 p-3 text-sm"><FileText className="mb-1 h-4 w-4 text-azure-600" /><p className="font-semibold">Policy documents</p><p className="text-xs text-navy-500">Clauses and terms</p></div></div><Arrow />
      <Box icon={Layers} title="Hybrid Retrieval" sub="Both sources, one question" /><Arrow />
      <Box icon={Brain} title="AI Response" sub="Personalised, with sources shown" />
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(0)
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden gap-7 text-sm font-medium text-navy-600 md:flex">{[['How it works', '#how'], ['Features', '#features'], ['Security', '#security'], ['FAQ', '#faq']].map(([l, h]) => <a key={h} href={h} className="hover:text-navy-900">{l}</a>)}</nav>
          <Link to="/login" className="btn-primary">Sign in</Link>
        </div>
      </header>

      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl">Understand Your Policy. Get Answers Instantly.</h1>
            <p className="mt-5 max-w-xl text-lg text-navy-600">PolicySense AI combines your customer information with policy knowledge to provide personalized, explainable answers.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary px-6 py-3" onClick={() => navigate('/login')}>Get Started</button>
              <button className="btn-outline px-6 py-3" onClick={() => navigate('/login', { state: { demo: 'customer', to: '/app/assistant' } })}>Explore AI Assistant</button>
            </div>
            <p className="mt-6 max-w-lg border-l-2 border-azure-500 pl-4 text-sm text-navy-600">Your account records tell us what happened. Your policy documents tell us what the rules say. The AI explains why they apply to you.</p>
          </div>
          <FlowCard />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight">Why PolicySense AI?</h2>
        <p className="mt-3 max-w-2xl text-navy-600">A regular chatbot only knows generic policy wording. It cannot tell you why <i>your</i> premium was ₹500 higher. PolicySense reads your record first, then the clause, then explains the link.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[[Database, 'Knows your account', 'Payment dates, renewals and claims are read from your own records.'], [FileSearch, 'Knows your policy', 'Relevant clauses are retrieved from the actual policy documents.'], [ShieldCheck, 'Shows its work', 'Each answer lists the data and clause behind it, so you can check it.']].map(([I, t, d]) => (
            <div key={t} className="rounded-2xl border border-navy-100 p-6"><I className="h-6 w-6 text-azure-600" /><p className="mt-4 font-semibold">{t}</p><p className="mt-1 text-sm text-navy-600">{d}</p></div>))}
        </div>
      </section>

      <section id="how" className="bg-navy-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-4">
            {STEPS.map(([t, d], i) => (<li key={t} className="card p-5"><span className="grid h-8 w-8 place-items-center rounded-full bg-navy-900 text-sm font-bold text-white">{i + 1}</span><p className="mt-4 font-semibold">{t}</p><p className="mt-1 text-sm text-navy-600">{d}</p></li>))}
          </ol>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight">Key features</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: I, title, text }) => (<div key={title} className="card p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-azure-50 text-azure-600"><I className="h-5 w-5" /></span><p className="mt-4 font-semibold">{title}</p><p className="mt-1 text-sm text-navy-600">{text}</p></div>))}
        </div>
      </section>

      <section className="bg-brand py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Personalized AI support</h2>
            <p className="mt-3 text-navy-200">The same question gets a different answer for every customer, because the answer starts from their records. Here is what a customer sees.</p>
          </div>
          <div className="rounded-2xl bg-white p-5 text-navy-900 shadow-lift">
            <p className="text-sm font-semibold text-navy-400">Example answer</p>
            <p className="mt-2 text-[15px]">Your premium was due on 02 July 2026, but your payment was received on 05 July 2026. According to the late payment clause, a ₹500 penalty was applied.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-xl bg-navy-50 p-3"><p className="font-semibold">Customer record</p>{['Payment Date: 05 July 2026', 'Due Date: 02 July 2026', 'Penalty: ₹500'].map((t) => <p key={t} className="mt-1 flex gap-1.5"><Check className="h-4 w-4 text-emerald-600" />{t}</p>)}</div>
              <div className="rounded-xl bg-navy-50 p-3"><p className="font-semibold">Policy document</p>{['Late Payment Clause', 'Section 6.2'].map((t) => <p key={t} className="mt-1 flex gap-1.5"><Check className="h-4 w-4 text-emerald-600" />{t}</p>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight">Secure data handling</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[[KeyRound, 'Signed-in access only', 'Token-based sign-in with separate customer and admin roles.'], [Lock, 'Your records stay yours', 'The server reads only the signed-in customer’s data. Nothing is chosen by the browser.'], [Workflow, 'Keys stay on the server', 'Database credentials and the Gemini API key never reach the frontend.']].map(([I, t, d]) => (
            <div key={t} className="rounded-2xl border border-navy-100 p-6"><I className="h-6 w-6 text-azure-600" /><p className="mt-4 font-semibold">{t}</p><p className="mt-1 text-sm text-navy-600">{d}</p></div>))}
        </div>
      </section>

      <section id="faq" className="bg-navy-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="card">
                <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>{q}<ChevronDown className={cx('h-5 w-5 shrink-0 text-navy-400 transition', open === i && 'rotate-180')} /></button>
                {open === i && <p className="px-5 pb-4 text-sm text-navy-600">{a}</p>}
              </div>))}
          </div>
        </div>
      </section>

      <footer className="bg-navy-950 py-10 text-sm text-navy-300">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6"><Logo light /><p>© {new Date().getFullYear()} PolicySense AI. Prototype built on synthetic data.</p></div>
      </footer>
    </div>
  )
}
