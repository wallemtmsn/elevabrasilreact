import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Toast, ToastType } from '@/types'

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3500)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}

// ===== Toast UI embutido no provider =====
const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
}

const colors: Record<ToastType, string> = {
  success: '#16a34a',
  error: '#dc2626',
  info: '#1e3a5f',
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold max-w-xs animate-slide-up cursor-pointer"
          style={{ background: colors[t.type] }}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {icons[t.type]}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
