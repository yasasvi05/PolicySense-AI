import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, BarChart3, CreditCard, FileSearch, FileText, LayoutDashboard, LogOut, Menu, RefreshCw, ShieldCheck, Sparkles, UserCircle, Users, X, ClipboardList } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { USE_MOCK } from '../../services'
import { Logo, ConfirmDialog } from '../ui'
import { cx } from '../../utils'

const CUSTOMER_NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/assistant', label: 'AI Policy Assistant', icon: Sparkles },
  { to: '/app/policy', label: 'Policy Details', icon: ShieldCheck },
  { to: '/app/payments', label: 'Payments & Penalties', icon: CreditCard },
  { to: '/app/renewals', label: 'Renewal Center', icon: RefreshCw },
  { to: '/app/claims', label: 'Claims', icon: ClipboardList },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: UserCircle },
]
const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/documents', label: 'Document Management', icon: FileText },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AppLayout({ role }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const nav = role === 'admin' ? ADMIN_NAV : CUSTOMER_NAV
  const current = nav.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 text-navy-200">
      <div className="flex h-16 items-center justify-between px-5"><Logo light /><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div>
      <p className="px-5 pb-2 pt-4 text-xs font-medium text-navy-400">{role === 'admin' ? 'Administration' : 'My account'}</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white')}>
            <Icon className="h-[18px] w-[18px]" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-xl bg-white/5 p-3">
        <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
        <p className="truncate text-xs text-navy-400">{role === 'admin' ? 'Administrator' : user?.customer_id}</p>
        <button onClick={() => setConfirm(true)} className="mt-2 flex items-center gap-2 text-xs font-medium text-navy-300 hover:text-white"><LogOut className="h-3.5 w-3.5" />Sign out</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 w-72 animate-page">{sidebar}</aside></div>}

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-navy-100 bg-white/85 px-4 backdrop-blur sm:px-8">
        <button className="btn-ghost -ml-2 px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <p className="flex-1 truncate text-sm font-semibold text-navy-700">{current?.label}</p>
        {USE_MOCK && <span className="hidden rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 sm:inline">Mock data mode</span>}
        {role === 'customer' && <button className="btn-ghost relative px-2.5" onClick={() => navigate('/app/notifications')} aria-label="Notifications"><Bell className="h-5 w-5" /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-azure-500" /></button>}
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8"><div key={pathname} className="animate-page"><Outlet /></div></main>

      <ConfirmDialog open={confirm} title="Sign out?" message="You’ll need to sign in again to see your account." confirmLabel="Sign out"
        onClose={() => setConfirm(false)} onConfirm={() => { logout(); navigate('/') }} />
    </div>
  )
}
