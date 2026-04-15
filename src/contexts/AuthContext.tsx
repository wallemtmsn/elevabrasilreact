import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import type { Profile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const initialLoaded = useRef(false)
  const hadUser = useRef(false) // rastreia se havia usuário logado (para distinguir logout manual de expiração)
  const profileLoaded = useRef(false) // evita refetch desnecessário em SIGNED_IN de reautenticação

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }, [user, fetchProfile])

  const logout = useCallback(async () => {
    hadUser.current = false // logout manual — não mostra aviso de sessão expirada
    profileLoaded.current = false
    setUser(null)
    setProfile(null)
    setSession(null)
    supabase.auth.signOut().catch(() => {})
  }, [])

  useEffect(() => {
    // Carga inicial: busca sessão uma única vez
    supabase.auth.getSession()
      .then(async ({ data }) => {
        const s = data.session
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          const p = await fetchProfile(s.user.id)
          setProfile(p)
          profileLoaded.current = true
        }
        setLoading(false)
        initialLoaded.current = true
      })
      .catch(async () => {
        // Token inválido ou expirado no localStorage — limpa sessão corrompida
        // e continua como não autenticado para não travar a página
        await supabase.auth.signOut()
        setLoading(false)
        initialLoaded.current = true
      })

    // Mudanças de estado (login, logout, token refresh) — ignora o evento inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!initialLoaded.current) return
      // Não seta loading=true após carga inicial — evita loop ao trocar de aba (TOKEN_REFRESHED)
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        hadUser.current = true
        // Só rebusca o profile em login real (não em reautenticação nem em troca de senha)
        // USER_UPDATED (troca de senha) não altera dados do profile — skip evita re-renders
        // que competem com o toast de sucesso
        // SIGNED_IN só busca se ainda não há profile carregado (login novo, não reauth)
        if (event === 'SIGNED_IN' && !profileLoaded.current) {
          const p = await fetchProfile(s.user.id)
          setProfile(p)
          profileLoaded.current = true
        }
      } else {
        setProfile(null)
        profileLoaded.current = false
        // SIGNED_OUT inesperado (token expirado/inválido) — avisa o usuário
        // Não chamar signOut() aqui: já foi disparado pelo próprio Supabase,
        // chamá-lo novamente dentro do onAuthStateChange trava o cliente.
        if (hadUser.current && event === 'SIGNED_OUT') {
          hadUser.current = false
          showToast('Sua sessão expirou. Por favor, faça login novamente.', 'info')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, isAdmin, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
