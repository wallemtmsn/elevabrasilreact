import { useEffect, useRef } from 'react'

/**
 * Dispara `onTimeout` se `loading` permanecer true por mais de `ms` milissegundos.
 * Proteção contra queries que travam no lock interno do Supabase.
 */
export function useLoadingTimeout(loading: boolean, onTimeout: () => void, ms = 20_000) {
  const cb = useRef(onTimeout)
  cb.current = onTimeout

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => cb.current(), ms)
    return () => clearTimeout(timer)
  }, [loading, ms])
}
