import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/layout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { cursosService } from '@/services/cursosService'
import { modulosService } from '@/services/modulosService'
import { matriculasService } from '@/services/matriculasService'
import { formatCurrency, buildWhatsAppUrl } from '@/utils/formatters'
import { courseDataMap, slugify } from '@/utils/courseDataMap'
import type { Curso, Modulo } from '@/types'
import { ModuloAccordion } from './ModuloAccordion'
import { LoginModal } from '@/pages/Home/LoginModal'
import { RegisterModal } from '@/pages/Home/RegisterModal'

const WA = (import.meta.env.VITE_WHATSAPP_NUMBER as string) || '5522998588802'

const BADGE_LABEL: Record<string, string> = {
  operacional: 'Operacional',
  desenvolvimento: 'Desenvolvimento',
  nr: 'Normas Regulamentadoras',
}
const BADGE_CLASS: Record<string, string> = {
  operacional: 'bg-navy-100 text-navy-700',
  desenvolvimento: 'bg-red-100 text-brand-red',
  nr: 'bg-steel-100 text-steel-600',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="bg-[#1c1d1f] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10">
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-9 bg-white/20 rounded w-3/4" />
              <div className="h-5 bg-white/10 rounded w-2/4" />
              <div className="flex gap-3 mt-4">
                <div className="h-7 bg-white/10 rounded-full w-24" />
                <div className="h-7 bg-white/10 rounded-full w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <div className="h-48 bg-steel-100 rounded-2xl" />
        <div className="h-64 bg-steel-100 rounded-2xl" />
      </div>
    </div>
  )
}

// ── Seção: O que você vai aprender ───────────────────────────────────────────

function ObjetivosSection({ objectives }: { objectives: string[] }) {
  if (!objectives.length) return null
  return (
    <section className="border border-steel-200 rounded-2xl p-6 bg-white">
      <h2 className="text-xl font-bold font-heading text-steel-900 mb-5">
        O que você vai aprender
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {objectives.map((obj, i) => (
          <li key={i} className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-steel-700">{obj}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── Seção: Requisitos ─────────────────────────────────────────────────────────

function RequisitosSection({ norms }: { norms: string }) {
  if (!norms || norms === '-') return null
  const items = norms.split(',').map(s => s.trim()).filter(Boolean)
  return (
    <section>
      <h2 className="text-xl font-bold font-heading text-steel-900 mb-4">
        Normas Regulamentadoras
      </h2>
      <ul className="space-y-2">
        {items.map((norm, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-steel-700">
            <span className="w-1.5 h-1.5 rounded-full bg-navy-500 shrink-0" />
            {norm}
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── Seção: Instrutor ──────────────────────────────────────────────────────────

function InstrutorSection() {
  return (
    <section>
      <h2 className="text-xl font-bold font-heading text-steel-900 mb-5">Instrutor</h2>
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-navy-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xl font-heading">E</span>
        </div>
        <div>
          <p className="font-semibold text-navy-700 text-base font-heading">Eleva Brasil</p>
          <p className="text-sm text-steel-500 mb-2">Escola de Treinamentos Profissionais</p>
          <div className="flex flex-wrap gap-4 text-xs text-steel-600 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Treinamentos certificados
            </span>
            <span>24+ cursos disponíveis</span>
            <span>Instrutores especializados</span>
          </div>
          <p className="text-sm text-steel-600 leading-relaxed max-w-2xl">
            A Eleva Brasil é uma escola de treinamentos profissionais especializada em cursos
            operacionais, de desenvolvimento e normas regulamentadoras. Todos os treinamentos são
            ministrados por técnicos devidamente registrados, com módulos teóricos e práticos,
            emissão de certificados e ART quando aplicável.
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Sidebar de Matrícula ──────────────────────────────────────────────────────

interface SidebarProps {
  curso: Curso
  image?: string
  hours?: string
  isMatriculado: boolean
  user: ReturnType<typeof useAuth>['user']
}

function MatriculaSidebar({ curso, image, hours, isMatriculado, user }: SidebarProps) {
  const waUrl = buildWhatsAppUrl(
    WA,
    `Olá! Tenho interesse no curso: ${curso.titulo}. Gostaria de informações sobre matrícula.`
  )

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-steel-200 overflow-hidden">
      {/* Preview do curso */}
      {image ? (
        <div className="aspect-video bg-steel-100 overflow-hidden">
          <img
            src={image}
            alt={curso.titulo}
            className="w-full h-full object-cover"
            onError={e => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center">
          <svg className="w-16 h-16 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Preço */}
        {curso.valor != null && (
          <div>
            <span className="text-3xl font-bold font-heading text-steel-900">
              {formatCurrency(curso.valor)}
            </span>
          </div>
        )}

        {/* Botão CTA */}
        {isMatriculado ? (
          <Link to={`/curso/${curso.id}`} className="block">
            <Button variant="primary" size="lg" fullWidth>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Acessar Curso
            </Button>
          </Link>
        ) : (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
            <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 px-4 transition-colors text-base">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {user ? 'Solicitar Matrícula via WhatsApp' : 'Fazer Matrícula via WhatsApp'}
            </button>
          </a>
        )}

        {/* O que está incluído */}
        <div className="border-t border-steel-100 pt-4">
          <p className="text-sm font-semibold text-steel-800 mb-3">Este curso inclui:</p>
          <ul className="space-y-2">
            {hours && (
              <li className="flex items-center gap-2 text-sm text-steel-600">
                <svg className="w-4 h-4 text-steel-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {hours} de conteúdo em vídeo
              </li>
            )}
            <li className="flex items-center gap-2 text-sm text-steel-600">
              <svg className="w-4 h-4 text-steel-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              Certificado de conclusão
            </li>
            <li className="flex items-center gap-2 text-sm text-steel-600">
              <svg className="w-4 h-4 text-steel-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
              Material didático incluso
            </li>
            <li className="flex items-center gap-2 text-sm text-steel-600">
              <svg className="w-4 h-4 text-steel-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
              </svg>
              Módulos teórico e prático
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── Sticky Mobile Bar ─────────────────────────────────────────────────────────

function MobileStickyBar({ curso, isMatriculado, user }: Omit<SidebarProps, 'image' | 'hours'>) {
  const waUrl = buildWhatsAppUrl(
    WA,
    `Olá! Tenho interesse no curso: ${curso.titulo}. Gostaria de informações sobre matrícula.`
  )

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-steel-200 shadow-xl px-4 py-3 z-40 flex items-center justify-between gap-3">
      {curso.valor != null && (
        <span className="font-bold text-steel-900 text-lg font-heading shrink-0">
          {formatCurrency(curso.valor)}
        </span>
      )}
      {isMatriculado ? (
        <Link to={`/curso/${curso.id}`} className="flex-1">
          <Button variant="primary" size="md" fullWidth>
            Acessar Curso
          </Button>
        </Link>
      ) : (
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-2.5 px-4 transition-colors text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Matricular via WhatsApp
          </button>
        </a>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function CursoLandingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [curso, setCurso] = useState<Curso | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [isMatriculado, setIsMatriculado] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Modal de login (reutiliza estados da Home via navegação)
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }

    async function load() {
      try {
        const [cursoData, modulosData, matriculadosIds] = await Promise.all([
          cursosService.getById(id!),
          modulosService.getModulosByCurso(id!),
          user ? matriculasService.getCursoIdsByAluno(user.id) : Promise.resolve([] as string[]),
        ])

        if (!cursoData) { setNotFound(true); return }

        setCurso(cursoData)
        setModulos(modulosData)
        setIsMatriculado(matriculadosIds.includes(id!))
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, user])

  const staticData = useMemo(() => {
    if (!curso) return null
    return courseDataMap[slugify(curso.titulo)] ?? null
  }, [curso])

  const navbarModals = (
    <>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true) }} />
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true) }} />
    </>
  )

  if (loading) return (
    <>
      <Navbar onLoginClick={() => setLoginOpen(true)} onRegisterClick={() => setRegisterOpen(true)} />
      {navbarModals}
      <SkeletonLoader />
    </>
  )

  if (notFound) return (
    <>
      <Navbar onLoginClick={() => setLoginOpen(true)} onRegisterClick={() => setRegisterOpen(true)} />
      {navbarModals}
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <svg className="w-16 h-16 text-steel-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-2xl font-bold font-heading text-steel-800 mb-2">Curso não encontrado</h1>
        <p className="text-steel-500 mb-6">O curso que você está procurando não existe ou foi removido.</p>
        <Button variant="primary" onClick={() => navigate('/#cursos')}>
          Ver todos os cursos
        </Button>
      </div>
    </>
  )

  const category = staticData?.category
  const image = staticData?.image
  const hours = staticData?.hours ?? (curso!.carga_horaria ? `${curso!.carga_horaria}h` : undefined)
  const norms = staticData?.norms
  const objectives = staticData?.objectives ?? []

  return (
    <div className="min-h-screen bg-steel-50 pb-20 lg:pb-0">
      <Navbar
        onLoginClick={() => setLoginOpen(true)}
        onRegisterClick={() => setRegisterOpen(true)}
      />
      {navbarModals}

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#1c1d1f] relative">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">
            {/* Conteúdo hero */}
            <div className="py-10 lg:py-14">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs text-white/50 mb-5 flex-wrap">
                <Link to="/" className="hover:text-white/80 transition-colors">Início</Link>
                <span>/</span>
                <Link to="/#cursos" className="hover:text-white/80 transition-colors">Cursos</Link>
                {category && (
                  <>
                    <span>/</span>
                    <span className="text-white/70">{BADGE_LABEL[category]}</span>
                  </>
                )}
              </nav>

              {/* Título */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-white leading-tight mb-4">
                {curso!.titulo}
              </h1>

              {/* Descrição */}
              {curso!.descricao && (
                <p className="text-white/75 text-base leading-relaxed mb-5 max-w-2xl">
                  {curso!.descricao}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                {category && (
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${BADGE_CLASS[category] ?? 'bg-steel-700 text-white'}`}>
                    {BADGE_LABEL[category]}
                  </span>
                )}
                {hours && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-white/80 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {hours}
                  </span>
                )}
                {modulos.length > 0 && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-white/80">
                    {modulos.length} módulo{modulos.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Instrutor */}
              <p className="text-sm text-white/60">
                Curso ministrado por{' '}
                <span className="text-navy-300 font-medium">Eleva Brasil</span>
              </p>
            </div>

            {/* Sidebar — reserva espaço no hero */}
            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10">

          {/* Coluna principal */}
          <div className="py-8 space-y-10">
            <ObjetivosSection objectives={objectives} />

            {/* Currículo do curso */}
            <section>
              <h2 className="text-xl font-bold font-heading text-steel-900 mb-5">
                Conteúdo do curso
              </h2>
              {modulos.length > 0 ? (
                <ModuloAccordion modulos={modulos} />
              ) : (
                <div className="flex items-center gap-4 p-5 bg-steel-100 border border-steel-200 rounded-2xl text-steel-600">
                  <svg className="w-8 h-8 text-steel-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-steel-700">Conteúdo programático em breve</p>
                    <p className="text-sm text-steel-500 mt-0.5">
                      Os módulos e aulas deste curso estão sendo preparados e estarão disponíveis em breve.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {norms && <RequisitosSection norms={norms} />}

            <InstrutorSection />
          </div>

          {/* Sidebar sticky */}
          <div className="hidden lg:block">
            <div className="sticky top-24 mt-[-260px]">
              <MatriculaSidebar
                curso={curso!}
                image={image}
                hours={hours}
                isMatriculado={isMatriculado}
                user={user}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile sidebar (abaixo do hero) */}
      <div className="lg:hidden px-4 pb-6">
        <MatriculaSidebar
          curso={curso!}
          image={image}
          hours={hours}
          isMatriculado={isMatriculado}
          user={user}
        />
      </div>

      {/* Sticky bottom bar (mobile) */}
      <MobileStickyBar curso={curso!} isMatriculado={isMatriculado} user={user} />
    </div>
  )
}
