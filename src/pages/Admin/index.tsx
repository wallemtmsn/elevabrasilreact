import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Avatar } from '@/components/ui'
import { Dashboard } from './sections/Dashboard'
import { Alunos } from './sections/Alunos'
import { CursosAdmin } from './sections/CursosAdmin'
import { ConteudoAdmin } from './sections/ConteudoAdmin'
import { MatriculasAdmin } from './sections/MatriculasAdmin'
import { PerguntasAdmin } from './sections/PerguntasAdmin'

type Section = 'dashboard' | 'alunos' | 'cursos' | 'conteudo' | 'matriculas' | 'perguntas'

const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    id: 'alunos',
    label: 'Alunos',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    id: 'cursos',
    label: 'Cursos',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    id: 'conteudo',
    label: 'Conteúdo',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    id: 'matriculas',
    label: 'Matrículas',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  },
  {
    id: 'perguntas',
    label: 'Perguntas e Respostas',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  },
]

export function AdminPage() {
  const { profile, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [active, setActive] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      showToast('Sessão encerrada.', 'info')
    } catch {
      showToast('Erro ao sair.', 'error')
    }
  }

  if (!profile) return null

  const renderSection = () => {
    switch (active) {
      case 'dashboard': return <Dashboard />
      case 'alunos': return <Alunos />
      case 'cursos': return <CursosAdmin />
      case 'conteudo': return <ConteudoAdmin />
      case 'matriculas': return <MatriculasAdmin />
      case 'perguntas': return <PerguntasAdmin />
    }
  }

  return (
    <div className="min-h-screen bg-steel-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={[
        'fixed top-0 left-0 h-full z-30 w-64 bg-navy-500 text-white flex flex-col',
        'transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/assets/img/logo.png" alt="Eleva Brasil" className="h-8 w-auto" />
            <span className="text-xs bg-brand-red px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar nome={profile.nome} fotoUrl={profile.foto_url} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{profile.nome}</p>
              <p className="text-xs text-white/50">Administrador</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false) }}
              className={['sidebar-link w-full', active === item.id ? 'active' : ''].join(' ')}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 flex flex-col gap-1">
          <Link to="/painel" className="sidebar-link text-white/70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Painel do aluno
          </Link>
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
