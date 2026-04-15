import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const INACTIVITY_MS = 10 * 60 * 1000  // 10 minutos sem interação → abre modal
const COUNTDOWN_SEC = 60               // 60 segundos para responder antes do logout

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const

export function InactivityGuard() {
  const { user, refreshSession, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC)

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearCountdown = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    countdownTimer.current = null
  }

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SEC)
    clearCountdown()
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearCountdown()
          logout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [logout])

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      setOpen(true)
      startCountdown()
    }, INACTIVITY_MS)
  }, [startCountdown])

  // Inicia o timer de inatividade e escuta eventos de interação
  useEffect(() => {
    if (!user) return

    resetInactivityTimer()
    EVENTS.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }))

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      clearCountdown()
      EVENTS.forEach(e => window.removeEventListener(e, resetInactivityTimer))
    }
  }, [user, resetInactivityTimer])

  const handleConfirm = async () => {
    clearCountdown()
    setOpen(false)
    await refreshSession()
    resetInactivityTimer()
  }

  const handleLogout = () => {
    clearCountdown()
    setOpen(false)
    logout()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Topo colorido */}
        <div className="h-1.5 bg-gradient-to-r from-navy-600 to-navy-400" />

        <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
          {/* Ícone */}
          <div className="w-14 h-14 rounded-full bg-navy-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>

          {/* Título */}
          <div>
            <h2 className="font-montserrat font-bold text-steel-800 text-lg">
              Você ainda está aqui?
            </h2>
            <p className="text-sm text-steel-500 mt-1">
              Detectamos inatividade na sua sessão.
            </p>
          </div>

          {/* Contagem regressiva */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold text-navy-500 font-montserrat tabular-nums">
              {countdown}
            </span>
            <p className="text-xs text-steel-400">
              segundos para encerrar a sessão automaticamente
            </p>
          </div>

          {/* Barra de progresso */}
          <div className="w-full h-1.5 bg-steel-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / COUNTDOWN_SEC) * 100}%` }}
            />
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2.5 rounded-xl border border-steel-200 text-steel-600 text-sm font-medium hover:bg-steel-50 transition-colors"
            >
              Sair
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-navy-500 text-white text-sm font-semibold hover:bg-navy-600 transition-colors"
            >
              Sim, estou aqui
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
