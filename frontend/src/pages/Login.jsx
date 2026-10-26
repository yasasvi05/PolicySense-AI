import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Logo, Modal, Spinner } from '../components/ui'
import { USE_MOCK } from '../services'
import ArchitectureFlow from '../components/assistant/ArchitectureFlow'

const DEMO = { customer: ['rahul.sharma@example.com', 'Customer@123'], admin: ['admin@policysense.ai', 'Admin@123'] }

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [forgot, setForgot] = useState(false)

  const home = (u) => (u.role === 'admin' ? '/admin' : '/app')
  if (user) return <Navigate to={home(user)} replace />

  const submit = async (e, creds) => {
    e?.preventDefault()
    const [em, pw] = creds || [email, password]
    const errs = {}
    if (!/^\S+@\S+\.\S+$/.test(em)) errs.email = 'Enter a valid email address'
    if (pw.length < 6) errs.password = 'Password must be at least 6 characters'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const u = await login(em, pw)
      if (!remember) window.addEventListener('beforeunload', () => localStorage.removeItem('ps_token'), { once: true })
      navigate(location.state?.to && u.role === 'customer' ? location.state.to : home(u), { replace: true })
    } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-14">
        <Link to="/" className="mb-10"><Logo /></Link>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-navy-500">Sign in to see your policies and ask the assistant.</p>
        <form onSubmit={submit} className="mt-8 max-w-md space-y-4" noValidate>
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!errors.email} />{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}</div>
          <div><label className="label" htmlFor="password">Password</label>
            <div className="relative"><input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className="input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}</div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-navy-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-navy-300 text-azure-600" />Remember me</label>
            <button type="button" className="font-semibold text-azure-700 hover:underline" onClick={() => setForgot(true)}>Forgot password?</button>
          </div>
          <button className="btn-primary w-full py-3" disabled={busy}>{busy && <Spinner />}Login</button>
        </form>
        <p className="mt-5 max-w-md text-sm text-navy-600">New here? <Link to="/register" className="font-semibold text-azure-700 hover:underline">Activate your account</Link></p>
        <div className="mt-6 max-w-md">
          <div className="mb-4 flex items-center gap-3 text-xs text-navy-400"><span className="h-px flex-1 bg-navy-100" />Prototype access<span className="h-px flex-1 bg-navy-100" /></div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="btn-outline" disabled={busy} onClick={() => submit(null, DEMO.customer)}>Continue as Demo Customer</button>
            <button className="btn-outline" disabled={busy} onClick={() => submit(null, DEMO.admin)}>Continue as Admin</button>
          </div>
          <div className="mt-4 flex gap-2 rounded-xl bg-navy-50 p-3 text-xs text-navy-600"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p>Demo logins: <b>{DEMO.customer[0]}</b> / {DEMO.customer[1]} · <b>{DEMO.admin[0]}</b> / {DEMO.admin[1]}.{' '}{USE_MOCK ? 'Running in mock mode: no server involved.' : 'These accounts exist after the backend seeds its demo data.'}</p></div>
        </div>
      </div>
      <div className="relative hidden items-center justify-center bg-brand p-12 lg:flex">
        <div className="w-full max-w-md"><div className="rounded-2xl bg-white/95 p-6 shadow-lift"><ArchitectureFlow /></div>
          <p className="mt-6 text-center text-sm text-navy-200">PostgreSQL tells us what happened. ChromaDB tells us what the policy says. The LLM explains why it applies to you.</p></div>
      </div>
      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset your password" footer={<button className="btn-primary" onClick={() => setForgot(false)}>Got it</button>}>
        <p className="text-sm text-navy-600">Password reset isn’t part of this prototype. TODO: add a reset-token endpoint and email delivery on the backend. For now, use the demo accounts below the form.</p>
      </Modal>
    </div>
  )
}
