import { useEffect, useRef } from 'react'

/**
 * Chama `refetch` quando o usuário retorna à aba após ficar inativo por mais de
 * `minInactiveMs` milissegundos (padrão: 3 minutos).
 *
 * `delayMs` (padrão: 600ms) atrasa a chamada para dar tempo ao Supabase de
 * concluir o refresh interno do token antes de disparar queries.
 */
export function useRefetchOnFocus(
  refetch: () => void,
  minInactiveMs = 3 * 60 * 1000,
  delayMs = 600,
) {
  const hiddenAt = useRef(0)
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch // sempre aponta para a versão mais recente sem quebrar o efeito

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now()
      } else if (hiddenAt.current > 0 && Date.now() - hiddenAt.current >= minInactiveMs) {
        if (delayMs > 0) {
          setTimeout(() => refetchRef.current(), delayMs)
        } else {
          refetchRef.current()
        }
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [minInactiveMs, delayMs])
}
