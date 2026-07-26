import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cursosService } from '@/services/cursosService'
import { modulosService } from '@/services/modulosService'
import { perguntasService } from '@/services/perguntasService'
import { provasService } from '@/services/provasService'
import { certificadosService } from '@/services/certificadosService'
import { useToast } from '@/contexts/ToastContext'
import { ProvaModal } from './ProvaModal'
import type { Curso, Modulo, Aula, Pergunta, Prova } from '@/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function getEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (yt) {
    const origin = encodeURIComponent(window.location.origin)
    return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`
  }
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?api=1`
  return url
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url)
}

type VideoKind = 'direct' | 'youtube' | 'vimeo' | 'unknown'

function getVideoKind(url: string): VideoKind {
  if (isDirectVideo(url)) return 'direct'
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/vimeo\.com/.test(url)) return 'vimeo'
  return 'unknown'
}

function formatDuracao(min?: number | null): string {
  if (!min) return ''
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function getTodasAulas(modulos: Modulo[]): Aula[] {
  return modulos.flatMap(m => m.aulas || [])
}

// Encontra onde o aluno realmente parou: a primeira aula não concluída do
// primeiro módulo incompleto, ou — se todas as aulas de um módulo já foram
// concluídas mas a avaliação dele está pendente — a última aula desse módulo
// (sinalizando que a avaliação deve reabrir automaticamente).
function determinarPosicaoInicial(
  modulos: Modulo[],
  concluidas: Set<string>,
  provasMap: Record<string, Prova>,
  modulosAprovados: Set<string>
): { aula: Aula | null; moduloProvaPendente: Modulo | null } {
  for (const modulo of modulos) {
    const aulas = modulo.aulas || []
    const primeiraNaoConcluida = aulas.find(a => !concluidas.has(a.id))
    if (primeiraNaoConcluida) {
      return { aula: primeiraNaoConcluida, moduloProvaPendente: null }
    }

    const prova = provasMap[modulo.id]
    if (prova && !modulosAprovados.has(modulo.id)) {
      return { aula: aulas[aulas.length - 1] ?? null, moduloProvaPendente: modulo }
    }
  }

  const todasAulas = getTodasAulas(modulos)
  return { aula: todasAulas[todasAulas.length - 1] ?? modulos[0]?.aulas?.[0] ?? null, moduloProvaPendente: null }
}

// ─── VideoPlayer ─────────────────────────────────────────────────────────────

interface VideoPlayerProps { url: string; onEnded: () => void }

function VideoPlayer({ url, onEnded }: VideoPlayerProps) {
  if (isDirectVideo(url)) {
    return (
      <video
        key={url}
        className="w-full h-full"
        controls
        autoPlay
        src={url}
        onEnded={onEnded}
      />
    )
  }
  return (
    <iframe
      key={url}
      src={getEmbedUrl(url)}
      className="w-full h-full"
      sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-popups allow-forms"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      title="Aula"
    />
  )
}

// ─── CheckIcon ───────────────────────────────────────────────────────────────

function CheckIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    )
  }
  return (
    <span className="w-5 h-5 rounded-full border-2 border-steel-300 flex-shrink-0" />
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export function CursoPlayerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()

  const [curso, setCurso] = useState<Curso | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [aulaAtual, setAulaAtual] = useState<Aula | null>(null)
  const [concluidas, setConcluidas] = useState<Set<string>>(new Set())
  const [modulosExpandidos, setModulosExpandidos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Provas
  const [provasMap, setProvasMap] = useState<Record<string, Prova>>({})       // modulo_id → Prova
  const [modulosAprovados, setModulosAprovados] = useState<Set<string>>(new Set()) // modulo_ids aprovados
  const [provaAtiva, setProvaAtiva] = useState<{ prova: Prova; moduloTitulo: string } | null>(null)
  const [carregandoProva, setCarregandoProva] = useState<string | null>(null) // modulo_id em carregamento

  // Abas
  const [abaAtual, setAbaAtual] = useState<'visao-geral' | 'qa'>('visao-geral')
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [loadingQA, setLoadingQA] = useState(false)
  const [novaPergunta, setNovaPergunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [respondendoId, setRespondendoId] = useState<string | null>(null)
  const [textoResposta, setTextoResposta] = useState('')
  const [videoAssistido, setVideoAssistido] = useState(false)

  useEffect(() => {
    if (!id) return

    Promise.all([
      cursosService.getById(id),
      modulosService.getModulosByCurso(id),
    ])
      .then(async ([c, mods]) => {
        setCurso(c)
        setModulos(mods)

        // expand all modules by default
        setModulosExpandidos(new Set(mods.map(m => m.id)))

        // fetch progresso + provas em paralelo
        if (user && mods.length > 0) {
          const aulaIds = getTodasAulas(mods).map(a => a.id)
          const moduloIds = mods.map(m => m.id)

          const [prog, provas] = await Promise.all([
            modulosService.getProgresso(user.id, aulaIds),
            provasService.getProvasByModulos(moduloIds),
          ])

          const ids = new Set(prog.filter(p => p.concluida).map(p => p.aula_id))
          setConcluidas(ids)

          // monta mapa modulo_id → Prova
          const pMap: Record<string, Prova> = {}
          provas.forEach(p => { pMap[p.modulo_id] = p })
          setProvasMap(pMap)

          // verifica quais módulos já foram aprovados
          let aprovadosSet = new Set<string>()
          const provaIds = provas.map(p => p.id)
          if (provaIds.length > 0) {
            const aprovadas = await provasService.getTentativasAprovadas(user.id, provaIds)
            aprovadosSet = new Set(
              aprovadas.map(t => provas.find(p => p.id === t.prova_id)?.modulo_id).filter(Boolean) as string[]
            )
            setModulosAprovados(aprovadosSet)
          }

          // Restaura a posição exata de onde o aluno parou (aula não concluída
          // mais antiga, ou módulo com avaliação pendente) em vez de sempre
          // voltar para a primeira aula do curso
          const { aula, moduloProvaPendente } = determinarPosicaoInicial(mods, ids, pMap, aprovadosSet)
          setAulaAtual(aula)

          if (moduloProvaPendente) {
            const provaCompleta = await provasService.getProvaByModulo(moduloProvaPendente.id)
            if (provaCompleta && (provaCompleta.questoes?.length ?? 0) > 0) {
              setProvaAtiva({ prova: provaCompleta, moduloTitulo: moduloProvaPendente.titulo })
            }
          }
        } else {
          setAulaAtual(mods[0]?.aulas?.[0] ?? null)
        }
      })
      .catch(err => {
        console.error('[CursoPlayer] Falha ao carregar curso/módulos/progresso', { cursoId: id, error: err })
      })
      .finally(() => setLoading(false))
  }, [id, user])

  // Carrega perguntas ao trocar de aula ou ativar a aba
  useEffect(() => {
    if (!aulaAtual || abaAtual !== 'qa') return
    setLoadingQA(true)
    perguntasService.getByAula(aulaAtual.id)
      .then(setPerguntas)
      .catch(() => {})
      .finally(() => setLoadingQA(false))
  }, [aulaAtual?.id, abaAtual])

  useEffect(() => {
    setVideoAssistido(false)

    const url = aulaAtual?.video_url
    if (!url) return

    const kind = getVideoKind(url)

    if (kind === 'unknown') {
      // Vídeos fora do YouTube/Vimeo (ex.: OneDrive) não expõem evento de
      // término de forma confiável — libera a conclusão sem exigir tempo
      // mínimo assistido.
      setVideoAssistido(true)
      return
    }

    if (kind !== 'youtube' && kind !== 'vimeo') return

    function handleMessage(event: MessageEvent) {
      if (kind === 'youtube') {
        if (!event.origin.includes('youtube.com')) return
        let data: { event?: string; info?: number } | null = null
        try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data }
        catch { return }
        if (data?.event === 'onStateChange' && data?.info === 0) setVideoAssistido(true)
      } else {
        if (!event.origin.includes('vimeo.com')) return
        let data: { event?: string } | null = null
        try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data }
        catch { return }
        if (data?.event === 'finish') setVideoAssistido(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [aulaAtual?.id, aulaAtual?.video_url])

  const handleFazerPergunta = async () => {
    if (!novaPergunta.trim() || !aulaAtual || !user) return
    setEnviando(true)
    try {
      await perguntasService.fazer(aulaAtual.id, user.id, novaPergunta.trim())
      setNovaPergunta('')
      const updated = await perguntasService.getByAula(aulaAtual.id)
      setPerguntas(updated)
    } catch (err) {
      console.error('[Q&A] Erro ao enviar pergunta:', err)
    }
    finally { setEnviando(false) }
  }

  const handleResponder = async (id: string) => {
    if (!textoResposta.trim() || !user || !aulaAtual) return
    try {
      await perguntasService.responder(id, textoResposta.trim(), user.id)
      setRespondendoId(null)
      setTextoResposta('')
      const updated = await perguntasService.getByAula(aulaAtual.id)
      setPerguntas(updated)
    } catch (err) {
      console.error('[Q&A] Erro ao enviar resposta:', err)
      showToast('Erro ao enviar resposta.', 'error')
    }
  }

  const todasAulas = getTodasAulas(modulos)
  const totalAulas = todasAulas.length
  const totalConcluidas = todasAulas.filter(a => concluidas.has(a.id)).length
  const progressoPct = totalAulas > 0 ? Math.round((totalConcluidas / totalAulas) * 100) : 0

  const idxAtual = aulaAtual ? todasAulas.findIndex(a => a.id === aulaAtual.id) : -1
  const podePrev = idxAtual > 0
  const podeNext = idxAtual < todasAulas.length - 1

  const deveBloquearBotao =
    !!aulaAtual?.video_url &&
    !concluidas.has(aulaAtual.id) &&
    !videoAssistido

  const handleVideoEnded = useCallback(() => setVideoAssistido(true), [])

  // Módulo N está bloqueado se as aulas do módulo N-1 não estiverem todas
  // concluídas, ou se o módulo N-1 tem prova e ela ainda não foi aprovada
  function isModuloBloqueado(moduloIdx: number): boolean {
    if (moduloIdx === 0) return false
    const moduloAnterior = modulos[moduloIdx - 1]

    const aulasAnterior = moduloAnterior.aulas || []
    const todasAulasConcluidas = aulasAnterior.every(a => concluidas.has(a.id))
    if (!todasAulasConcluidas) return true

    const provaAnterior = provasMap[moduloAnterior.id]
    if (!provaAnterior) return false
    return !modulosAprovados.has(moduloAnterior.id)
  }

  function irParaAula(aula: Aula) {
    setAulaAtual(aula)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleModulo(moduloId: string) {
    setModulosExpandidos(prev => {
      const next = new Set(prev)
      next.has(moduloId) ? next.delete(moduloId) : next.add(moduloId)
      return next
    })
  }

  async function toggleConcluida() {
    if (!aulaAtual || !user || salvando) return
    setSalvando(true)
    try {
      if (concluidas.has(aulaAtual.id)) {
        await modulosService.desmarcarConcluida(user.id, aulaAtual.id)
        setConcluidas(prev => { const n = new Set(prev); n.delete(aulaAtual.id); return n })
      } else {
        await modulosService.marcarConcluida(aulaAtual.id)
        const novasConcluidas = new Set(concluidas).add(aulaAtual.id)
        setConcluidas(novasConcluidas)

        // Verifica se todas as aulas do módulo atual foram concluídas
        const moduloAtual = modulos.find(m => m.aulas?.some(a => a.id === aulaAtual.id))
        if (moduloAtual) {
          const aulasMod = moduloAtual.aulas || []
          const todasConcluidas = aulasMod.every(a => novasConcluidas.has(a.id))
          const prova = provasMap[moduloAtual.id]
          const jaAprovado = modulosAprovados.has(moduloAtual.id)

          if (todasConcluidas && prova && !jaAprovado) {
            // Carrega as questões da prova (pode não ter vindo no getProvasByModulos)
            const provaCompleta = await provasService.getProvaByModulo(moduloAtual.id)
            if (provaCompleta && (provaCompleta.questoes?.length ?? 0) > 0) {
              setTimeout(() => setProvaAtiva({ prova: provaCompleta, moduloTitulo: moduloAtual.titulo }), 400)
              return // não avança aula automaticamente
            } else if (provaCompleta) {
              console.error('[Avaliação] Prova sem questões cadastradas (auto-abertura)', { moduloId: moduloAtual.id, provaId: provaCompleta.id })
              showToast('A avaliação deste módulo ainda não está disponível. Contate o suporte.', 'error')
            }
          }
        }

        // Verifica progresso teórico e emite certificado se elegível
        if (id && curso) {
          try {
            const resultado = await certificadosService.verificarTeoricoEEmitir(user.id, id, curso.exige_pratico)
            if (resultado.certificado) {
              showToast('Parabéns! Seu certificado foi emitido. Acesse "Meus Certificados" no painel.', 'success')
            }
          } catch (err) {
            console.error('[Certificado] Falha ao verificar/emitir certificado', { userId: user.id, cursoId: id, error: err })
            showToast('Não foi possível verificar/emitir o certificado. Tente novamente ou contate o suporte.', 'error')
          }
        }

        // auto-advance to next lesson
        if (podeNext) setTimeout(() => irParaAula(todasAulas[idxAtual + 1]), 600)
      }
    } catch { /* silent */ }
    finally { setSalvando(false) }
  }

  // ── loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1c1d1f] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-white/40" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-[#1c1d1f] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-steel-400 mb-4">Curso não encontrado.</p>
          <button onClick={() => navigate('/painel')} className="text-sm text-brand-red hover:underline">
            Voltar ao painel
          </button>
        </div>
      </div>
    )
  }

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1c1d1f] flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="bg-[#1c1d1f] border-b border-white/10 h-14 flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-40">
        {/* Back */}
        <button
          onClick={() => navigate('/painel')}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Cursos</span>
        </button>

        <div className="w-px h-5 bg-white/20 flex-shrink-0" />

        {/* Course title */}
        <h1 className="text-white text-sm font-medium truncate flex-1 min-w-0">
          {curso.titulo}
        </h1>

        {/* Progress */}
        {totalAulas > 0 && (
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progressoPct}%` }}
              />
            </div>
            <span className="text-xs text-white/60 whitespace-nowrap">
              {progressoPct}% concluído
            </span>
          </div>
        )}

        {/* Logo */}
        <img
          src="/assets/img/logo.jpg"
          alt="Eleva Brasil"
          className="h-6 w-auto flex-shrink-0 hidden md:block"
        />

        {/* Mobile: sidebar toggle */}
        <button
          className="lg:hidden text-white/70 hover:text-white p-1 flex-shrink-0"
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Conteúdo do curso"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* ── Main (video + info) ───────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

          {/* Video */}
          <div className="bg-black w-full">
            <div className="max-w-5xl mx-auto w-full aspect-video">
              {aulaAtual?.video_url ? (
                <VideoPlayer url={aulaAtual.video_url} onEnded={handleVideoEnded} />
              ) : curso.video_url ? (
                <VideoPlayer url={curso.video_url} onEnded={handleVideoEnded} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Vídeo em breve</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lesson info */}
          <div className="bg-white flex-1">
            <div className="max-w-5xl mx-auto px-6 py-6">

              {/* Navigation + mark complete */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <button
                  onClick={() => podePrev && irParaAula(todasAulas[idxAtual - 1])}
                  disabled={!podePrev}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-steel-200 text-sm text-steel-600 hover:bg-steel-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                <button
                  onClick={() => podeNext && irParaAula(todasAulas[idxAtual + 1])}
                  disabled={!podeNext}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-steel-200 text-sm text-steel-600 hover:bg-steel-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {aulaAtual && (
                  <button
                    onClick={toggleConcluida}
                    disabled={salvando || deveBloquearBotao}
                    title={deveBloquearBotao ? 'Assista ao vídeo para liberar esta opção' : undefined}
                    className={[
                      'ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      concluidas.has(aulaAtual.id)
                        ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        : deveBloquearBotao
                          ? 'bg-steel-100 text-steel-400 border border-steel-200 cursor-not-allowed'
                          : 'bg-navy-500 text-white hover:bg-navy-600',
                    ].join(' ')}
                  >
                    {salvando ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : concluidas.has(aulaAtual.id) ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Concluída
                      </>
                    ) : (
                      'Marcar como concluída'
                    )}
                  </button>
                )}
              </div>

              {/* Lesson title */}
              <h2 className="text-xl font-bold text-steel-800 mb-4">
                {aulaAtual?.titulo || curso.titulo}
              </h2>

              {/* Tabs */}
              <div className="border-b border-steel-200 mb-6">
                <div className="flex">
                  {([
                    { id: 'visao-geral', label: 'Visão Geral' },
                    { id: 'qa', label: `Perguntas e Respostas${perguntas.length > 0 ? ` (${perguntas.length})` : ''}` },
                  ] as { id: 'visao-geral' | 'qa'; label: string }[]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAbaAtual(tab.id)}
                      className={[
                        'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                        abaAtual === tab.id
                          ? 'border-navy-700 text-navy-700'
                          : 'border-transparent text-steel-500 hover:text-steel-700',
                      ].join(' ')}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab: Visão Geral */}
              {abaAtual === 'visao-geral' && (
                <div className="space-y-5">
                  {aulaAtual?.descricao && (
                    <p className="text-steel-500 text-sm leading-relaxed">{aulaAtual.descricao}</p>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-steel-700 mb-3">Sobre este curso</h3>
                    {curso.descricao && (
                      <p className="text-steel-500 text-sm leading-relaxed mb-4">{curso.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-5">
                      {curso.carga_horaria && (
                        <div className="flex items-center gap-2 text-sm text-steel-600">
                          <svg className="w-4 h-4 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {curso.carga_horaria}h de conteúdo
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-steel-600">
                        <svg className="w-4 h-4 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {modulos.length} {modulos.length === 1 ? 'módulo' : 'módulos'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-steel-600">
                        <svg className="w-4 h-4 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {todasAulas.length} {todasAulas.length === 1 ? 'aula' : 'aulas'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Perguntas e Respostas */}
              {abaAtual === 'qa' && !aulaAtual && (
                <div className="text-center py-10 text-steel-400 text-sm">
                  Selecione uma aula no menu lateral para fazer perguntas.
                </div>
              )}

              {abaAtual === 'qa' && aulaAtual && (
                <div className="space-y-6">
                  {/* Formulário */}
                  <div className="bg-steel-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-steel-700 mb-3">Fazer uma pergunta</h3>
                    <textarea
                      value={novaPergunta}
                      onChange={e => setNovaPergunta(e.target.value)}
                      placeholder="Digite sua dúvida sobre esta aula..."
                      rows={3}
                      className="w-full text-sm border border-steel-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleFazerPergunta}
                        disabled={enviando || !novaPergunta.trim()}
                        className="px-4 py-2 bg-navy-700 text-white text-sm font-medium rounded-lg hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {enviando ? 'Enviando...' : 'Enviar pergunta'}
                      </button>
                    </div>
                  </div>

                  {/* Lista */}
                  {loadingQA ? (
                    <div className="flex items-center justify-center py-8">
                      <svg className="animate-spin h-6 w-6 text-steel-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : perguntas.length === 0 ? (
                    <div className="text-center py-8 text-steel-400 text-sm">
                      Nenhuma pergunta ainda. Seja o primeiro a perguntar!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {perguntas.map(p => (
                        <div key={p.id} className="border border-steel-200 rounded-xl p-4">
                          {/* Author */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700 flex-shrink-0">
                              {(p.profiles?.nome || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-steel-700">{p.profiles?.nome || 'Aluno'}</p>
                              <p className="text-xs text-steel-400">{new Date(p.criado_em).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>

                          {/* Pergunta */}
                          <p className="text-sm text-steel-600 mb-3">{p.pergunta}</p>

                          {/* Resposta ou status */}
                          {p.resposta ? (
                            <div className="ml-4 bg-navy-50 border border-navy-100 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-semibold text-navy-700 bg-navy-100 px-2 py-0.5 rounded-full">
                                  {p.respondido_por_profile?.nome || 'Admin'}
                                </span>
                                {p.respondido_em && (
                                  <span className="text-xs text-steel-400">
                                    {new Date(p.respondido_em).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-navy-800">{p.resposta}</p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-steel-400 italic">Aguardando resposta</span>
                              {isAdmin && (
                                respondendoId === p.id ? (
                                  <div className="w-full mt-2">
                                    <textarea
                                      value={textoResposta}
                                      onChange={e => setTextoResposta(e.target.value)}
                                      placeholder="Digite sua resposta..."
                                      rows={3}
                                      className="w-full text-sm border border-steel-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
                                    />
                                    <div className="flex gap-2 mt-2 justify-end">
                                      <button
                                        onClick={() => { setRespondendoId(null); setTextoResposta('') }}
                                        className="text-sm text-steel-500 hover:text-steel-700 px-3 py-1.5"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={() => handleResponder(p.id)}
                                        disabled={!textoResposta.trim()}
                                        className="px-4 py-1.5 bg-navy-700 text-white text-sm font-medium rounded-lg hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        Salvar resposta
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setRespondendoId(p.id); setTextoResposta('') }}
                                    className="text-xs text-navy-600 hover:text-navy-800 font-medium"
                                  >
                                    Responder
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </main>

        {/* ── Sidebar overlay (mobile) ──────────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Curriculum sidebar ────────────────────────────────────────── */}
        <aside
          className={[
            'flex-shrink-0 w-[85vw] sm:w-80 bg-white border-l border-steel-200 flex flex-col',
            'lg:relative lg:translate-x-0 lg:flex',
            // mobile: fixed from the right
            'fixed top-14 right-0 bottom-0 z-40 transition-transform duration-200',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-steel-200 flex-shrink-0">
            <p className="text-xs font-semibold text-steel-500 uppercase tracking-wider">
              Conteúdo do curso
            </p>
            {totalAulas > 0 && (
              <p className="text-xs text-steel-400 mt-0.5">
                {totalConcluidas} de {totalAulas} aulas concluídas
              </p>
            )}
          </div>

          {/* Modules list */}
          <div className="flex-1 overflow-y-auto">
            {modulos.length === 0 && (
              <div className="p-6 text-center text-steel-400 text-sm">
                Conteúdo em breve.
              </div>
            )}

            {modulos.map((modulo, mIdx) => {
              const aulasMod = modulo.aulas || []
              const concluidasMod = aulasMod.filter(a => concluidas.has(a.id)).length
              const expandido = modulosExpandidos.has(modulo.id)
              const bloqueado = isModuloBloqueado(mIdx)
              const provaModulo = provasMap[modulo.id]
              const todasAulasConcluidas = aulasMod.length > 0 && concluidasMod === aulasMod.length
              const provaAprovada = modulosAprovados.has(modulo.id)
              const provaAguardando = !bloqueado && !!provaModulo && todasAulasConcluidas && !provaAprovada

              async function abrirProvaModulo(e: React.MouseEvent) {
                e.stopPropagation()
                if (carregandoProva) return
                setCarregandoProva(modulo.id)
                try {
                  const provaCompleta = await provasService.getProvaByModulo(modulo.id)
                  if (provaCompleta && (provaCompleta.questoes?.length ?? 0) > 0) {
                    setProvaAtiva({ prova: provaCompleta, moduloTitulo: modulo.titulo })
                  } else {
                    console.error('[Avaliação] Prova sem questões cadastradas', { moduloId: modulo.id, provaId: provaCompleta?.id })
                    showToast('Esta avaliação ainda não está disponível. Contate o suporte.', 'error')
                  }
                } catch (err) {
                  console.error('[Avaliação] Falha ao carregar prova do módulo', { moduloId: modulo.id, error: err })
                  showToast(err instanceof Error ? err.message : 'Não foi possível carregar a avaliação.', 'error')
                } finally {
                  setCarregandoProva(null)
                }
              }

              return (
                <div key={modulo.id} className="border-b border-steel-100">
                  {/* Module header */}
                  <div className={[
                    'flex items-start gap-2 px-4 py-3 transition-colors',
                    bloqueado ? 'bg-steel-100 opacity-60' : 'bg-steel-50',
                  ].join(' ')}>
                    <button
                      onClick={() => !bloqueado && toggleModulo(modulo.id)}
                      className={[
                        'flex items-start gap-2 text-left flex-1 min-w-0',
                        bloqueado ? 'cursor-not-allowed' : 'hover:opacity-80',
                      ].join(' ')}
                    >
                      {bloqueado ? (
                        <Lock className="w-4 h-4 text-steel-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <svg
                          className={`w-4 h-4 text-steel-400 flex-shrink-0 mt-0.5 transition-transform duration-150 ${expandido ? 'rotate-90' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-steel-700 leading-snug">
                          Seção {mIdx + 1}: {modulo.titulo}
                        </p>
                        {bloqueado ? (
                          <p className="text-xs text-steel-400 mt-0.5">Conclua a avaliação anterior</p>
                        ) : (
                          <p className="text-xs text-steel-400 mt-0.5">
                            {concluidasMod}/{aulasMod.length} | {aulasMod.reduce((s, a) => s + (a.duracao_min || 0), 0)}min
                          </p>
                        )}
                      </div>
                    </button>
                    {provaAguardando && (
                      <button
                        onClick={abrirProvaModulo}
                        disabled={carregandoProva === modulo.id}
                        className="flex-shrink-0 text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-medium hover:bg-amber-200 transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-wait"
                      >
                        {carregandoProva === modulo.id ? 'Carregando...' : 'Fazer avaliação'}
                      </button>
                    )}
                  </div>

                  {/* Aulas list */}
                  {!bloqueado && expandido && aulasMod.map((aula) => {
                    const isAtual = aulaAtual?.id === aula.id
                    const isDone = concluidas.has(aula.id)

                    return (
                      <button
                        key={aula.id}
                        onClick={() => irParaAula(aula)}
                        className={[
                          'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-l-2',
                          isAtual
                            ? 'border-brand-red bg-red-50'
                            : 'border-transparent hover:bg-steel-50',
                        ].join(' ')}
                      >
                        <CheckIcon done={isDone} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs leading-snug ${isAtual ? 'font-semibold text-steel-800' : 'text-steel-600'}`}>
                            {isAtual && (
                              <svg className="inline w-3 h-3 mr-1 text-brand-red" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            )}
                            {aula.titulo}
                          </p>
                          {aula.duracao_min ? (
                            <p className="text-xs text-steel-400 mt-0.5">{formatDuracao(aula.duracao_min)}</p>
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Mobile progress footer */}
          {totalAulas > 0 && (
            <div className="px-4 py-3 border-t border-steel-200 bg-steel-50 flex-shrink-0 lg:hidden">
              <div className="flex items-center justify-between text-xs text-steel-500 mb-1.5">
                <span>Progresso</span>
                <span>{progressoPct}%</span>
              </div>
              <div className="h-1.5 bg-steel-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressoPct}%` }}
                />
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Prova Modal ──────────────────────────────────────────────────── */}
      {provaAtiva && user && (
        <ProvaModal
          prova={provaAtiva.prova}
          alunoId={user.id}
          moduloTitulo={provaAtiva.moduloTitulo}
          onAprovado={() => {
            setModulosAprovados(prev => new Set(prev).add(
              provaAtiva.prova.modulo_id
            ))
            if (id && curso) {
              certificadosService.verificarTeoricoEEmitir(user!.id, id, curso.exige_pratico)
                .then(resultado => {
                  if (resultado.certificado) {
                    showToast('Parabéns! Seu certificado foi emitido. Acesse "Meus Certificados" no painel.', 'success')
                  }
                })
                .catch(err => {
                  console.error('[Certificado] Falha ao verificar/emitir certificado', { userId: user!.id, cursoId: id, error: err })
                  showToast('Não foi possível verificar/emitir o certificado. Tente novamente ou contate o suporte.', 'error')
                })
            }
          }}
          onFechar={() => {
            setProvaAtiva(null)
            // avança para a próxima aula disponível após fechar
            if (podeNext) setTimeout(() => irParaAula(todasAulas[idxAtual + 1]), 200)
          }}
        />
      )}
    </div>
  )
}
