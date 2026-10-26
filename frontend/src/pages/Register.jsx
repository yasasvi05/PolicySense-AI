
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Logo, Spinner } from '../components/ui'
import ArchitectureFlow from '../components/assistant/ArchitectureFlow'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({
    domain: 'insurance',
    customer_id: '',
    email: '',
    password: '',
    confirm: '',
  })

  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (user) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/app'}
        replace
      />
    )
  }

  const set = (key) => (e) => {
    setForm((current) => ({
      ...current,
      [key]: e.target.value,
    }))
    setErrors((current) => ({
      ...current,
      [key]: '',
    }))
  }

  const submit = async (e) => {
    e.preventDefault()

    const errs = {}
    const customerId = form.customer_id.trim()
    const email = form.email.trim()

    if (!/^[A-Za-z0-9]{4,20}$/.test(customerId)) {
      errs.customer_id = 'Enter a valid Customer ID.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.'
    }

    if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(form.password) ||
      !/\d/.test(form.password)
    ) {
      errs.password =
        'Use at least 8 characters, including a letter and a number.'
    }

    if (form.confirm !== form.password) {
      errs.confirm = 'Passwords do not match.'
    }

    setErrors(errs)

    if (Object.keys(errs).length > 0) return

    setBusy(true)

    try {
      await register({
        customer_id: customerId,
        email,
        password: form.password,
        domain: form.domain,
      })

      toast('Account activated. Welcome to PolicySense AI!')
      navigate('/app', { replace: true })
    } catch (err) {
      toast(err.message || 'Registration failed. Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-14">
        <Link to="/" className="mb-10">
          <Logo />
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">
          Activate your account
        </h1>

        <p className="mt-1 max-w-md text-navy-500">
          Choose your service, then use the Customer ID and registered email
          associated with your account.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 max-w-md space-y-4"
          noValidate
        >
          <div>
            <label className="label" htmlFor="domain">
              Service type
            </label>
            <select
              id="domain"
              className="input"
              value={form.domain}
              onChange={set('domain')}
            >
              <option value="insurance">Insurance</option>
              <option value="banking">Banking</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="customer_id">
              {form.domain === 'banking'
                ? 'Banking Customer ID'
                : 'Insurance Customer ID'}
            </label>
            <input
              id="customer_id"
              className="input"
              value={form.customer_id}
              onChange={set('customer_id')}
              placeholder={
                form.domain === 'banking' ? 'BANK1001' : 'CUST1002'
              }
              autoComplete="off"
              aria-invalid={!!errors.customer_id}
            />
            {errors.customer_id && (
              <p className="mt-1 text-xs text-red-600">
                {errors.customer_id}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="email">
              Registered email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="password">
              Create password
            </label>
            <div className="relative">
              <input
                id="password"
                type={show ? 'text' : 'password'}
                className="input pr-10"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShow((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              type={show ? 'text' : 'password'}
              className="input"
              value={form.confirm}
              onChange={set('confirm')}
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
            />
            {errors.confirm && (
              <p className="mt-1 text-xs text-red-600">
                {errors.confirm}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={busy}
          >
            {busy && <Spinner />}
            Activate account
          </button>
        </form>

        <p className="mt-5 max-w-md text-sm text-navy-600">
          Already activated?{' '}
          <Link
            to="/login"
            className="font-semibold text-azure-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="hidden items-center justify-center bg-brand p-12 lg:flex">
        <div className="w-full max-w-md rounded-2xl bg-white/95 p-6 shadow-lift">
          <ArchitectureFlow />
        </div>
      </div>
    </div>
  )
}
