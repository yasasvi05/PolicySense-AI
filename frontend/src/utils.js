export const money = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`)
export const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const fmtDateLong = (s) => (s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—')
export const daysUntil = (s) => Math.ceil((new Date(s) - new Date(new Date().toISOString().slice(0, 10))) / 864e5)
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
export const cx = (...a) => a.filter(Boolean).join(' ')
