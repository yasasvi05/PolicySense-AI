import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox, Search, X, Loader2 } from 'lucide-react'
import { cx } from '../utils'

export const Spinner = ({ className = 'h-4 w-4' }) => <Loader2 className={cx('animate-spin', className)} />

export const Skeleton = ({ className = 'h-4 w-full' }) => (
  <div className={cx('relative overflow-hidden rounded-lg bg-navy-100', className)}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
)

export const CardSkeleton = ({ rows = 3 }) => (
  <div className="card space-y-3 p-5">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className={i === 0 ? 'h-5 w-1/3' : 'h-4'} />)}</div>
)

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200', amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200', blue: 'bg-azure-50 text-azure-700 ring-azure-100', gray: 'bg-navy-50 text-navy-600 ring-navy-200',
}
const STATUS_TONE = {
  Active: 'green', Paid: 'green', Approved: 'green', Renewed: 'green', Verified: 'green', Indexed: 'green', 'Up to date': 'green',
  Pending: 'amber', 'Renewal Pending': 'amber', Upcoming: 'blue', Processing: 'amber', Chunked: 'amber',
  Rejected: 'red', Overdue: 'red', Failed: 'red', Expired: 'red', Lapsed: 'red',
}
export const Badge = ({ tone = 'gray', children, className }) => (
  <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', TONES[tone], className)}>{children}</span>
)
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || 'gray'}>{status}</Badge>

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-[28px]">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-navy-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
)

export const StatCard = ({ icon: Icon, label, value, hint, loading }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-navy-500">{label}</p>
      {Icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-azure-50 text-azure-600"><Icon className="h-[18px] w-[18px]" /></span>}
    </div>
    {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-2 text-2xl font-bold text-navy-900">{value}</p>}
    {hint && !loading && <p className="mt-1 text-xs text-navy-400">{hint}</p>}
  </div>
)

export const EmptyState = ({ icon: Icon = Inbox, title, text, action }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-50 text-navy-400"><Icon className="h-6 w-6" /></span>
    <p className="mt-4 font-semibold text-navy-800">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm text-navy-500">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export const ErrorState = ({ message, onRetry }) => (
  <div className="card flex flex-col items-center px-6 py-12 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="h-6 w-6" /></span>
    <p className="mt-4 font-semibold text-navy-800">We couldn’t load this page</p>
    <p className="mt-1 max-w-md text-sm text-navy-500">{message}</p>
    {onRetry && <button className="btn-outline mt-4" onClick={onRetry}>Try again</button>}
  </div>
)

export function Modal({ open, onClose, title, children, wide, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={cx('flex max-h-[90vh] w-full animate-page flex-col rounded-t-2xl bg-white shadow-lift sm:rounded-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-navy-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, loading, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} disabled={loading} onClick={onConfirm}>{loading && <Spinner />}{confirmLabel}</button></>}>
      <p className="text-sm text-navy-600">{message}</p>
    </Modal>
  )
}

export const KeyValue = ({ items }) => (
  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
    {items.map(([k, v]) => (
      <div key={k}><dt className="text-xs font-medium text-navy-400">{k}</dt><dd className="mt-0.5 text-sm font-semibold text-navy-900">{v ?? '—'}</dd></div>
    ))}
  </dl>
)

/** Reusable table with search, filter, sort and pagination.
 *  columns: [{ key, label, sortable, render(row), align, sortValue(row) }] */
export function DataTable({ columns, rows, searchKeys = [], filterKey, filterLabel = 'All', pageSize = 8, onRowClick, empty, loading }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState(null)
  const [page, setPage] = useState(0)

  const options = useMemo(() => (filterKey ? [...new Set(rows.map((r) => r[filterKey]))].filter(Boolean) : []), [rows, filterKey])
  const data = useMemo(() => {
    let out = rows
    if (q) out = out.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase())))
    if (filter) out = out.filter((r) => r[filterKey] === filter)
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      const val = (r) => (col?.sortValue ? col.sortValue(r) : r[sort.key])
      out = [...out].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1))
    }
    return out
  }, [rows, q, filter, sort, columns, searchKeys, filterKey])

  useEffect(() => setPage(0), [q, filter, sort])
  const pages = Math.max(1, Math.ceil(data.length / pageSize))
  const view = data.slice(page * pageSize, page * pageSize + pageSize)
  const toggle = (key) => setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }))

  return (
    <div className="card overflow-hidden">
      {(searchKeys.length > 0 || filterKey) && (
        <div className="flex flex-wrap gap-2 border-b border-navy-100 p-3">
          {searchKeys.length > 0 && (
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
              <input className="input pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search table" />
            </div>
          )}
          {filterKey && (
            <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter table">
              <option value="">{filterLabel}</option>
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-navy-50/70 text-navy-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cx('whitespace-nowrap px-4 py-3 font-semibold', c.align === 'right' && 'text-right')}>
                  {c.sortable ? (
                    <button className="inline-flex items-center gap-1 hover:text-navy-900" onClick={() => toggle(c.key)}>
                      {c.label}
                      {sort?.key === c.key && (sort.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>{columns.map((c) => <td key={c.key} className="px-4 py-3.5"><Skeleton className="h-4" /></td>)}</tr>
            ))}
            {!loading && view.map((r, i) => (
              <tr key={r.id ?? r.transaction_id ?? r.claim_id ?? r.customer_id ?? r.renewal_id ?? i} onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cx('transition hover:bg-navy-50/60', onRowClick && 'cursor-pointer')}>
                {columns.map((c) => <td key={c.key} className={cx('px-4 py-3.5 text-navy-800', c.align === 'right' && 'text-right')}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && data.length === 0 && (empty || <EmptyState title="No results" text="Try changing your search or filter." />)}
      {!loading && data.length > pageSize && (
        <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm text-navy-500">
          <span>{page * pageSize + 1}–{Math.min(data.length, (page + 1) * pageSize)} of {data.length}</span>
          <div className="flex gap-1">
            <button className="btn-ghost px-2.5 py-1.5" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <button className="btn-ghost px-2.5 py-1.5" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export const Logo = ({ light }) => (
  <span className="inline-flex items-center gap-2.5">
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden><rect width="32" height="32" rx="9" fill={light ? '#ffffff' : '#0b1f44'} /><path d="M16 6l8 3v6c0 5-3.4 8.6-8 11-4.6-2.4-8-6-8-11V9z" fill="#2f6bff" /><path d="M12.5 16l2.5 2.5 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    <span className={cx('text-[17px] font-extrabold tracking-tight', light ? 'text-white' : 'text-navy-900')}>PolicySense <span className="text-azure-500">AI</span></span>
  </span>
)
