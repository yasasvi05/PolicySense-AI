import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const Ctx = createContext(() => {})
export const useToast = () => useContext(Ctx)

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info }
const TONE = { success: 'text-emerald-600', error: 'text-red-600', info: 'text-azure-600' }

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const toast = useCallback((message, type = 'success') => {
    const id = Math.random()
    setItems((s) => [...s, { id, message, type }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4000)
  }, [])
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        {items.map((t) => {
          const Icon = ICON[t.type]
          return (
            <div key={t.id} className="pointer-events-auto flex animate-toast items-start gap-3 rounded-xl border border-navy-100 bg-white p-3.5 shadow-lift">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${TONE[t.type]}`} />
              <p className="flex-1 text-sm text-navy-800">{t.message}</p>
              <button onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="text-navy-300 hover:text-navy-600"><X className="h-4 w-4" /></button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
