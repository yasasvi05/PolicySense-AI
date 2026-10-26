import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Copy, Database, FileSearch, FileText, RefreshCw, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, ChevronDown } from 'lucide-react'
import { Badge, KeyValue, Modal, Spinner } from '../ui'
import { useToast } from '../../context/ToastContext'
import { api } from '../../services'
import { cx } from '../../utils'

/** Reveals text word-by-word. Only used for freshly generated answers. */
export function useStreamedText(text, enabled) {
  const words = text.split(' ')
  const [n, setN] = useState(enabled ? 0 : words.length)
  useEffect(() => {
    if (!enabled) return setN(words.length)
    setN(0)
    const t = setInterval(() => setN((c) => (c >= words.length ? (clearInterval(t), c) : c + 1)), 28)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled])
  return { shown: words.slice(0, n).join(' '), done: n >= words.length }
}

const humanize = (k) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
const showVal = (v) => (typeof v === 'number' && /amount|fee|premium/i.test('') ? v : v === null || v === undefined ? '—' : String(v))

function ModeChip({ r }) {
  if (r.mode === 'mock') return <Badge tone="amber">Mock service · not connected to backend</Badge>
  if (r.mode === 'live') return <Badge tone="green">Live · ChromaDB + Gemini</Badge>
  return <Badge tone="amber">Fallback · {r.retrieval} retrieval, {r.generation} answer</Badge>
}

export function SourcesModal({ open, onClose, response, tab }) {
  const rec = response.customer_record || {}
  return (
    <Modal open={open} onClose={onClose} wide title={tab === 'customer' ? 'Customer record' : tab === 'policy' ? 'Policy clause' : 'Sources used'}>
      <div className="space-y-6">
        {tab !== 'policy' && (
          <section>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-800"><Database className="h-4 w-4 text-azure-600" />From PostgreSQL – what happened to you</p>
            {Object.keys(rec).length ? <div className="rounded-xl bg-navy-50 p-4"><KeyValue items={Object.entries(rec).map(([k, v]) => [humanize(k), showVal(v)])} /></div> : <p className="text-sm text-navy-500">No matching customer record was found.</p>}
          </section>
        )}
        {tab !== 'customer' && (
          <section>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-800"><FileSearch className="h-4 w-4 text-azure-600" />From ChromaDB – what the policy says</p>
            {response.policy_sources?.length ? response.policy_sources.map((c, i) => (
              <div key={i} className="mb-3 rounded-xl border border-navy-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-navy-900">{c.title}{c.section && <span className="font-normal text-navy-500"> · Section {c.section}</span>}</p>
                  {c.score != null && <Badge tone="blue">Similarity {Math.round(c.score * 100)}%</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-navy-400">{c.document}</p>
                <p className="mt-3 border-l-2 border-azure-500 pl-3 text-sm leading-relaxed text-navy-700">{c.excerpt}</p>
              </div>
            )) : <p className="text-sm text-navy-500">No policy clauses were retrieved.</p>}
          </section>
        )}
      </div>
    </Modal>
  )
}

export default function HybridAnswer({ response, animate, onRegenerate, onStreamDone }) {
  const toast = useToast()
  const { shown, done } = useStreamedText(response.answer, animate)
  const [modal, setModal] = useState(null)
  const [vote, setVote] = useState(null)
  const [trace, setTrace] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (done) onStreamDone?.() }, [done]) // eslint-disable-line

  const copy = async () => {
    try { await navigator.clipboard.writeText(response.answer); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { toast('Copy isn’t available in this browser', 'error') }
  }
  const rate = async (v) => {
    setVote(v)
    try { await api.sendFeedback(response.query_id, v); toast('Thanks, your feedback helps us improve answers', 'info') } catch (e) { toast(e.message, 'error') }
  }
  const btn = 'rounded-lg p-2 text-navy-400 transition hover:bg-navy-50 hover:text-navy-800'

  return (
    <div className="card max-w-3xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 bg-gradient-to-r from-navy-50 to-white px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Sparkles className="h-4 w-4 text-azure-600" />Hybrid RAG Response</span>
        <ModeChip r={response} />
      </div>

      <div className="px-4 pb-1 pt-4 sm:px-5">
        <p className="text-xs font-semibold text-navy-400">AI Answer</p>
        <p className="mt-1.5 min-h-[3rem] text-[15px] leading-relaxed text-navy-900">{shown}{!done && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-azure-500" />}</p>
      </div>

      {done && (
        <div className="space-y-4 px-4 pb-4 pt-3 sm:px-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-800"><Database className="h-4 w-4 text-azure-600" />Retrieved Customer Data</p>
              <p className="mb-2 text-xs text-navy-400">PostgreSQL · what happened</p>
              {response.customer_sources?.length ? (
                <ul className="space-y-1.5 text-sm">{response.customer_sources.map((s) => (
                  <li key={s.label} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span><span className="text-navy-500">{s.label}:</span> <span className="font-medium text-navy-900">{s.value}</span></span></li>))}</ul>
              ) : <p className="text-sm text-navy-500">No matching records.</p>}
            </div>
            <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-800"><FileText className="h-4 w-4 text-azure-600" />Retrieved Policy Information</p>
              <p className="mb-2 text-xs text-navy-400">ChromaDB · what the policy says</p>
              {response.policy_sources?.length ? (
                <ul className="space-y-1.5 text-sm">{response.policy_sources.slice(0, 3).map((c, i) => (
                  <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span className="font-medium text-navy-900">{c.title}{c.section && <span className="font-normal text-navy-500"> · Section {c.section}</span>}</span></li>))}</ul>
              ) : <p className="text-sm text-navy-500">No matching clauses.</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {response.grounded
              ? <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><ShieldCheck className="h-4 w-4" />Answer grounded in retrieved information</span>
              : <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700"><AlertTriangle className="h-4 w-4" />No matching records found, so this answer may be incomplete</span>}
            <span className="flex-1" />
            <button className="btn-outline px-3 py-1.5" onClick={() => setModal('customer')}>View Customer Record</button>
            <button className="btn-outline px-3 py-1.5" onClick={() => setModal('policy')}>View Policy Clause</button>
          </div>

          <div className="flex flex-wrap items-center gap-1 border-t border-navy-100 pt-3">
            <button className={btn} onClick={copy} aria-label="Copy response" title="Copy response">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
            <button className={btn} onClick={onRegenerate} aria-label="Regenerate" title="Regenerate"><RefreshCw className="h-4 w-4" /></button>
            <button className={cx(btn, vote === 'up' && 'bg-emerald-50 text-emerald-700')} onClick={() => rate('up')} aria-label="Helpful"><ThumbsUp className="h-4 w-4" /></button>
            <button className={cx(btn, vote === 'down' && 'bg-red-50 text-red-700')} onClick={() => rate('down')} aria-label="Not helpful"><ThumbsDown className="h-4 w-4" /></button>
            <button className="ml-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-azure-700 hover:bg-azure-50" onClick={() => setModal('both')}>View sources</button>
            <button className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-navy-500 hover:bg-navy-50" onClick={() => setTrace(!trace)}>
              How this was built<ChevronDown className={cx('h-3.5 w-3.5 transition', trace && 'rotate-180')} /></button>
          </div>

          {trace && (
            <ol className="grid gap-2 rounded-xl bg-navy-900 p-3.5 text-xs text-navy-200 sm:grid-cols-5">
              {response.pipeline?.map((s) => (
                <li key={s.step}><p className="font-semibold text-white">{s.step}</p><p className={cx('mt-0.5', s.status === 'ok' ? 'text-emerald-300' : 'text-amber-300')}>{s.status}</p><p className="mt-0.5 text-navy-300">{s.detail}</p></li>))}
            </ol>
          )}
        </div>
      )}
      <SourcesModal open={!!modal} tab={modal} response={response} onClose={() => setModal(null)} />
    </div>
  )
}

export const TypingIndicator = ({ label }) => (
  <div className="card inline-flex items-center gap-3 px-4 py-3">
    <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-dot rounded-full bg-azure-500" style={{ animationDelay: `${i * 0.18}s` }} />)}</span>
    <span className="text-sm text-navy-500">{label}</span>
  </div>
)
