import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Avatar, Modal } from '@/components/ui'
import { VisaoGeral } from './sections/VisaoGeral'
import { Perfil } from './sections/Perfil'
import { Cursos } from './sections/Cursos'
import { Certificados } from './sections/Certificados'
import { Seguranca } from './sections/Seguranca'

type Section = 'visao-geral' | 'perfil' | 'cursos' | 'certificados' | 'seguranca'

const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    id: 'perfil',
    label: 'Meu Perfil',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  {
    id: 'cursos',
    label: 'Cursos',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    id: 'certificados',
    label: 'Certificados',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
  {
    id: 'seguranca',
    label: 'Segurança',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  },
]

export function PainelPage() {
  const { profile, logout, loading, isAdmin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState<Section>('visao-geral')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const locationState = location.state as { novoAluno?: boolean; bemVindoDeVolta?: boolean } | null
  const [showWelcome, setShowWelcome] = useState(!!locationState?.novoAluno)
  const [showBemVindo, setShowBemVindo] = useState(!!locationState?.bemVindoDeVolta)

  useEffect(() => {
    if (!showWelcome) return
    const t = setTimeout(() => setShowWelcome(false), 2500)
    return () => clearTimeout(t)
  }, [showWelcome])

  useEffect(() => {
    if (!showBemVindo) return
    const t = setTimeout(() => setShowBemVindo(false), 3000)
    return () => clearTimeout(t)
  }, [showBemVindo])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      showToast('Sessão encerrada.', 'info')
    } catch {
      showToast('Erro ao sair.', 'error')
    }
  }

  if (loading || !profile) {
    if (!loading && !profile) { navigate('/'); return null }
    return <div className="min-h-screen bg-steel-50" />
  }

  const renderSection = () => {
    switch (active) {
      case 'visao-geral': return <VisaoGeral onNavigate={s => setActive(s as Section)} />
      case 'perfil': return <Perfil />
      case 'cursos': return <Cursos />
      case 'certificados': return <Certificados />
      case 'seguranca': return <Seguranca />
    }
  }

  return (
    <>
    {/* Modal: novo cadastro */}
    <Modal open={showWelcome} onClose={() => setShowWelcome(false)} maxWidth="sm">
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <img src="/assets/img/logo.png" alt="Eleva Brasil" className="h-12 w-auto" />
        <svg className="animate-spin h-9 w-9 text-navy-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div>
          <p className="text-lg font-semibold text-steel-800">Estamos criando seu painel de Aluno</p>
          <p className="text-sm text-steel-400 mt-1">Isso levará apenas alguns instantes…</p>
        </div>
      </div>
    </Modal>

    {/* Modal: boas-vindas de retorno */}
    <Modal open={showBemVindo} onClose={() => setShowBemVindo(false)} maxWidth="sm">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <img src="/assets/img/logo.png" alt="Eleva Brasil" className="h-10 w-auto" />
        <div className="w-16 h-16 rounded-full bg-navy-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {profile.nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xl font-bold text-steel-800">
            Bem-vindo(a) de volta, {profile.nome.split(' ')[0]}!
          </p>
          <p className="text-sm text-steel-400 mt-1">
            Continue de onde parou — seu aprendizado te espera.
          </p>
        </div>
        <button
          onClick={() => setShowBemVindo(false)}
          className="mt-1 px-6 py-2 bg-navy-500 text-white text-sm font-medium rounded-lg hover:bg-navy-600 transition-colors"
        >
          Continuar
        </button>
      </div>
    </Modal>
    <div className="min-h-screen bg-steel-50 flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={[
        'fixed top-0 left-0 h-full z-30 w-64 bg-navy-500 text-white flex flex-col',
        'transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <img src="/assets/img/logo.png" alt="Eleva Brasil" className="h-8 w-auto" />
        </div>

        {/* User info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar nome={profile.nome} fotoUrl={profile.foto_url} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{profile.nome}</p>
              <p className="text-xs text-white/50">{isAdmin ? 'Admin' : 'Aluno'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false) }}
              className={[
                'sidebar-link w-full',
                active === item.id ? 'active' : '',
              ].join(' ')}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Painel Admin (somente para admins) */}
        {isAdmin && (
          <div className="px-3 pb-1">
            <button
              onClick={() => navigate('/admin')}
              className="sidebar-link w-full text-amber-300 hover:text-amber-200 hover:bg-amber-900/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 001.946-.806 3.42 3.42 0 014.438 0 1.724 1.724 0 001.946.806c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00.806 1.946 3.42 3.42 0 010 4.438 1.724 1.724 0 00-.806 1.946c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-1.946.806 3.42 3.42 0 01-4.438 0 1.724 1.724 0 00-1.946-.806c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-.806-1.946 3.42 3.42 0 010-4.438 1.724 1.724 0 00.806-1.946c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Painel Admin
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-900/30">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-steel-200 px-4 sm:px-6 h-14 flex items-center gap-3 sticky top-0 z-10">
          <button
            className="md:hidden text-steel-500 hover:text-steel-700 p-1"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-steel-700 text-sm">
            {navItems.find(n => n.id === active)?.label}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
    </>
  )
}
