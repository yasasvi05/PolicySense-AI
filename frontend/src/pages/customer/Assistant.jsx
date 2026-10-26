import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { History, MessageSquarePlus, Send, Sparkles, Trash2, Info } from 'lucide-react'
import { api, USE_MOCK } from '../../services'
import { useToast } from '../../context/ToastContext'
import HybridAnswer, { TypingIndicator } from '../../components/assistant/HybridAnswer'
import { Modal } from '../../components/ui'
import ArchitectureFlow from '../../components/assistant/ArchitectureFlow'
import { cx } from '../../utils'

const SUGGESTED = ['Why was I charged extra?', 'When is my renewal due?', 'What happens if I miss my renewal?', 'Why was my claim rejected?', 'What does my policy cover?']
const KEY = 'ps_conversations'
const uid = () => Math.random().toString(36).slice(2, 10)
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }

export default function Assistant() {
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [convos, setConvos] = useState(load)
  const [activeId, setActiveId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingId, setStreamingId] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showArch, setShowArch] = useState(false)
  const bottom = useRef(null)
  const prefilled = useRef(false)

  const active = convos.find((c) => c.id === activeId)
  const messages = active?.messages || []

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(convos.slice(0, 20))), [convos])
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages.length, loading, streamingId])

  const ask = useCallback(async (text, context, convoId, replaceId) => {
    const message = text.trim()
    if (!message || loading) return
    const id = convoId || uid()
    const userMsg = { id: uid(), role: 'user', text: message, context }
    setLoading(true)
    setInput('')
    setConvos((cs) => {
      if (!convoId) return [{ id, title: message.slice(0, 48), messages: [userMsg] }, ...cs]
      return cs.map((c) => {
        if (c.id !== id) return c
        if (replaceId) return { ...c, messages: c.messages.slice(0, c.messages.findIndex((m) => m.id === replaceId)) }
        return { ...c, messages: [...c.messages, userMsg] }
      })
    })
    setActiveId(id)
    try {
      const response = await api.queryAssistant({ message, context })
      const aiMsg = { id: uid(), role: 'assistant', response }
      setConvos((cs) => cs.map((c) => c.id === id ? { ...c, messages: [...c.messages, aiMsg] } : c))
      setStreamingId(aiMsg.id)
    } catch (e) {
      toast(e.message, 'error')
    } finally { setLoading(false) }
  }, [loading, toast])

  // Deep-link from other pages: navigate('/app/assistant', { state: { prompt, context } })
  useEffect(() => {
    const s = location.state
    if (s?.prompt && !prefilled.current) {
      prefilled.current = true
      ask(s.prompt, s.context)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, []) // eslint-disable-line

  const regenerate = (idx) => {
    const user = messages[idx - 1]
    if (user) ask(user.text, user.context, activeId, messages[idx].id)
  }
  const newChat = () => { setActiveId(null); setShowHistory(false) }
  const remove = (id) => { setConvos((cs) => cs.filter((c) => c.id !== id)); if (id === activeId) setActiveId(null) }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">PolicySense AI Assistant</h1>
          <p className="mt-1 text-sm text-navy-500">Ask anything about your policy, payments, renewals, penalties, or claims.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline lg:hidden" onClick={() => setShowHistory(!showHistory)}><History className="h-4 w-4" />History</button>
          <button className="btn-outline" onClick={() => setShowArch(true)}><Info className="h-4 w-4" />How it works</button>
          <button className="btn-primary" onClick={newChat}><MessageSquarePlus className="h-4 w-4" />New chat</button>
        </div>
      </div>

      {USE_MOCK && (
        <div className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p><b>Mock mode.</b> Answers come from a local simulation, not from PostgreSQL, ChromaDB or Gemini. Start the backend and set <code className="rounded bg-white/70 px-1">VITE_USE_MOCK=false</code> to use the real pipeline.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className={cx('card h-fit p-3 lg:block', showHistory ? 'block' : 'hidden')}>
          <p className="px-2 pb-2 pt-1 text-sm font-semibold text-navy-700">Conversation history</p>
          {convos.length === 0 && <p className="px-2 pb-2 text-sm text-navy-400">Your questions will appear here.</p>}
          <ul className="space-y-1">
            {convos.map((c) => (
              <li key={c.id} className={cx('group flex items-center rounded-lg', c.id === activeId ? 'bg-azure-50' : 'hover:bg-navy-50')}>
                <button className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-sm text-navy-700" onClick={() => { setActiveId(c.id); setShowHistory(false) }}>{c.title}</button>
                <button className="p-2 text-navy-300 opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100" onClick={() => remove(c.id)} aria-label="Delete conversation"><Trash2 className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="card flex min-h-[560px] flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" style={{ maxHeight: 'calc(100vh - 330px)', minHeight: 380 }}>
            {messages.length === 0 && !loading && (
              <div className="mx-auto max-w-xl py-8 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white"><Sparkles className="h-6 w-6" /></span>
                <h2 className="mt-4 text-lg font-semibold">What would you like to know?</h2>
                <p className="mt-1 text-sm text-navy-500">Answers combine your account records with your policy’s own wording, and show you both.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTED.map((q) => <button key={q} onClick={() => ask(q)} className="rounded-full border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-700 transition hover:border-azure-500 hover:text-azure-700">{q}</button>)}
                </div>
              </div>
            )}
            {messages.map((m, i) => m.role === 'user' ? (
              <div key={m.id} className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-900 px-4 py-2.5 text-sm text-white sm:max-w-[70%]">{m.text}</p></div>
            ) : (
              <HybridAnswer key={m.id} response={m.response} animate={m.id === streamingId} onRegenerate={() => regenerate(i)} onStreamDone={() => setStreamingId((s) => (s === m.id ? null : s))} />
            ))}
            {loading && <TypingIndicator label={USE_MOCK ? 'Simulating retrieval…' : 'Retrieving from PostgreSQL and ChromaDB…'} />}
            <div ref={bottom} />
          </div>

          <div className="border-t border-navy-100 bg-white p-3 sm:p-4">
            {messages.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {SUGGESTED.map((q) => <button key={q} disabled={loading} onClick={() => ask(q)} className="shrink-0 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-azure-50 hover:text-azure-700 disabled:opacity-50">{q}</button>)}
              </div>
            )}
            <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); ask(input, undefined, activeId) }}>
              <textarea className="input max-h-32 min-h-[44px] resize-none" rows={1} maxLength={1000} placeholder="Ask about your policy, e.g. “Why was I charged ₹500 extra?”"
                value={input} onChange={(e) => setInput(e.target.value)} aria-label="Your question"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input, undefined, activeId) } }} />
              <button className="btn-accent h-11 px-4" disabled={loading || input.trim().length < 3} aria-label="Send"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      </div>

      <Modal open={showArch} onClose={() => setShowArch(false)} title="How an answer is built" wide>
        <ArchitectureFlow />
        <p className="mt-5 text-center text-sm text-navy-500">PostgreSQL tells us what happened to the customer. ChromaDB tells us what the policy says. The LLM explains why the policy applies to that customer.</p>
      </Modal>
    </div>
  )
}
