import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Avatar } from '@/components/ui'
import { buildWhatsAppUrl } from '@/utils/formatters'

const WA = (import.meta.env.VITE_WHATSAPP_NUMBER as string) || '5522998588802'

interface NavbarProps {
  onLoginClick?: () => void
  onRegisterClick?: () => void
  onApoioClick?: () => void
}

export function Navbar({ onLoginClick, onRegisterClick, onApoioClick }: NavbarProps) {
  const { user, profile, isAdmin, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      showToast('Sessão encerrada.', 'info')
    } catch {
      showToast('Erro ao sair.', 'error')
    }
  }

  const navLinks = [
    { label: 'Início', href: '/#inicio' },
    { label: 'Sobre Nós', href: '/#sobre' },
    { label: 'Treinamentos', href: '/#cursos' },
    { label: 'Desenvolvimento', href: '/#desenvolvimento' },
    { label: 'Contato', href: '/#contato' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy-800/95 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Navegação principal">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="Eleva Brasil - Ir para o início">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <img src="/assets/img/logo.jpg" alt="Eleva Brasil" className="w-full h-full object-contain scale-110 brightness-150" />
            </div>
            <div className="hidden sm:block">
              <span className="block font-heading font-bold text-white text-lg leading-tight">Eleva Brasil</span>
              <span className="block text-xs text-steel-300 tracking-wider uppercase">Treinamentos</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1" role="list">
            {navLinks.map(link => (
              <li key={link.href}>
                <a href={link.href} className="nav-link">{link.label}</a>
              </li>
            ))}
            <li>
              <button onClick={onApoioClick} className="nav-link">Apoio</button>
            </li>
          </ul>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Auth */}
            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
                >
                  <Avatar nome={profile.nome} fotoUrl={profile.foto_url} size="sm" />
                  <span className="text-sm font-medium max-w-[120px] truncate">{profile.nome}</span>
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-20">
                      <Link to="/painel" className="flex items-center gap-2 px-4 py-2 text-sm text-steel-700 hover:bg-steel-50" onClick={() => setUserMenuOpen(false)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Meu Painel
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-steel-700 hover:bg-steel-50" onClick={() => setUserMenuOpen(false)}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                          Painel Admin
                        </Link>
                      )}
                      <hr className="my-1 border-steel-200" />
                      <button onClick={() => { setUserMenuOpen(false); handleLogout() }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-brand-red hover:bg-steel-50">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/20 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                Entrar
              </button>
            )}

            {/* WhatsApp CTA */}
            <a
              href={buildWhatsAppUrl(WA, 'Olá, seja bem vindo(a) a ELEVA, sua escola de Treinamentos! Como posso te ajudar?')}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.228A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.726-5.992-1.956l-.418-.314-2.786.725.752-2.727-.344-.432A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Fale Conosco
            </a>
          </div>

          {/* Mobile right side */}
          <div className="lg:hidden flex items-center gap-2">
            {!user && (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                Entrar
              </button>
            )}
            <button
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Abrir menu"
            >
              {menuOpen
                ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden pb-4 border-t border-white/10 pt-3">
            <ul className="flex flex-col gap-1" role="list">
              {navLinks.map(link => (
                <li key={link.href}>
                  <a href={link.href} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{link.label}</a>
                </li>
              ))}
              <li>
                <button onClick={() => { setMenuOpen(false); onApoioClick?.() }} className="mobile-nav-link w-full text-left">Apoio</button>
              </li>
            </ul>
            <div className="border-t border-white/10 mt-2 pt-3 flex flex-col gap-2 px-1">
              {user && profile ? (
                <>
                  <Link to="/painel" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Meu Painel</Link>
                  {isAdmin && <Link to="/admin" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Painel Admin</Link>}
                  <button onClick={handleLogout} className="mobile-nav-link text-brand-red text-left">Sair</button>
                </>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); onRegisterClick?.() }}
                  className="flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                >
                  Cadastre-se grátis
                </button>
              )}
              <a
                href={buildWhatsAppUrl(WA, 'Olá, seja bem vindo(a) a ELEVA, sua escola de Treinamentos! Como posso te ajudar?')}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.228A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.726-5.992-1.956l-.418-.314-2.786.725.752-2.727-.344-.432A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Fale Conosco via WhatsApp
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
