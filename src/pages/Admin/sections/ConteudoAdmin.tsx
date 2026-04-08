import { useState, useEffect, useMemo } from 'react'
import { cursosService } from '@/services/cursosService'
import { modulosService } from '@/services/modulosService'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input, Modal } from '@/components/ui'
import type { Curso, Modulo, Aula } from '@/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDuracao(min?: number | null) {
  if (!min) return ''
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function totalDuracaoModulo(aulas: Aula[]) {
  const total = aulas.reduce((s, a) => s + (a.duracao_min || 0), 0)
  return total ? formatDuracao(total) : null
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url)
}
function isVimeo(url: string) {
  return /vimeo\.com/.test(url)
}
function videoLabel(url?: string | null) {
  if (!url) return null
  if (isYouTube(url)) return 'YouTube'
  if (isVimeo(url)) return 'Vimeo'
  return 'Vídeo'
}

// ─── empty forms ─────────────────────────────────────────────────────────────

type ModuloForm = { titulo: string; ordem: string }
type AulaForm = { titulo: string; descricao: string; video_url: string; duracao_min: string; ordem: string }

const emptyModuloForm: ModuloForm = { titulo: '', ordem: '' }
const emptyAulaForm: AulaForm = { titulo: '', descricao: '', video_url: '', duracao_min: '', ordem: '' }

// ─── sub-components ──────────────────────────────────────────────────────────

function IconBtn({
  onClick, title, color = 'steel', disabled = false, children,
}: {
  onClick: () => void; title: string; color?: 'steel' | 'red' | 'blue'; disabled?: boolean; children: React.ReactNode
}) {
  const cls = {
    steel: 'text-steel-400 hover:text-steel-600 hover:bg-steel-100',
    red: 'text-red-400 hover:text-red-600 hover:bg-red-50',
    blue: 'text-blue-400 hover:text-blue-600 hover:bg-blue-50',
  }[color]
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${cls}`}
    >
      {children}
    </button>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function ConteudoAdmin() {
  const { showToast } = useToast()

  // data
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cursoId, setCursoId] = useState<string>('')
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  // loading
  const [loadingCursos, setLoadingCursos] = useState(true)
  const [loadingModulos, setLoadingModulos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)

  // modal: módulo
  const [modalModulo, setModalModulo] = useState<'create' | 'edit' | null>(null)
  const [moduloEditando, setModuloEditando] = useState<Modulo | null>(null)
  const [moduloForm, setModuloForm] = useState<ModuloForm>(emptyModuloForm)

  // modal: aula
  const [modalAula, setModalAula] = useState<'create' | 'edit' | null>(null)
  const [aulaEditando, setAulaEditando] = useState<Aula | null>(null)
  const [aulaModulo, setAulaModulo] = useState<Modulo | null>(null)
  const [aulaForm, setAulaForm] = useState<AulaForm>(emptyAulaForm)

  // modal: delete confirm
  const [deletandoModulo, setDeletandoModulo] = useState<Modulo | null>(null)
  const [deletandoAula, setDeletandoAula] = useState<Aula | null>(null)

  // ── load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    cursosService.getAll()
      .then(data => { setCursos(data); if (data.length > 0) setCursoId(data[0].id) })
      .catch(() => showToast('Erro ao carregar cursos.', 'error'))
      .finally(() => setLoadingCursos(false))
  }, [])

  useEffect(() => {
    if (!cursoId) return
    setLoadingModulos(true)
    reloadModulos()
  }, [cursoId])

  async function reloadModulos() {
    try {
      const data = await modulosService.getModulosByCurso(cursoId)
      setModulos(data)
      setExpandidos(new Set(data.map(m => m.id)))
    } catch {
      showToast('Erro ao carregar módulos.', 'error')
    } finally {
      setLoadingModulos(false)
    }
  }

  // ── computed ──────────────────────────────────────────────────────────────

  const cursoDados = useMemo(() => cursos.find(c => c.id === cursoId), [cursos, cursoId])
  const totalAulas = useMemo(() => modulos.reduce((s, m) => s + (m.aulas?.length || 0), 0), [modulos])
  const totalMin = useMemo(() => modulos.reduce((s, m) => s + (m.aulas || []).reduce((ss, a) => ss + (a.duracao_min || 0), 0), 0), [modulos])

  // ── toggle expand ────────────────────────────────────────────────────────

  function toggleExpand(id: string) {
    setExpandidos(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function expandAll() { setExpandidos(new Set(modulos.map(m => m.id))) }
  function collapseAll() { setExpandidos(new Set()) }

  // ── módulo modal ─────────────────────────────────────────────────────────

  function openCriarModulo() {
    setModuloEditando(null)
    setModuloForm({ titulo: '', ordem: String(modulos.length + 1) })
    setModalModulo('create')
  }

  function openEditarModulo(m: Modulo) {
    setModuloEditando(m)
    setModuloForm({ titulo: m.titulo, ordem: String(m.ordem) })
    setModalModulo('edit')
  }

  async function handleSalvarModulo() {
    if (!moduloForm.titulo.trim()) { showToast('Título do módulo obrigatório.', 'error'); return }
    setSaving(true)
    try {
      const payload = { titulo: moduloForm.titulo.trim(), ordem: parseInt(moduloForm.ordem) || 1 }
      if (modalModulo === 'edit' && moduloEditando) {
        await modulosService.updateModulo(moduloEditando.id, payload)
        showToast('Módulo atualizado!', 'success')
      } else {
        await modulosService.createModulo(cursoId, payload)
        showToast('Módulo criado!', 'success')
      }
      setModalModulo(null)
      await reloadModulos()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar módulo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletarModulo() {
    if (!deletandoModulo) return
    try {
      await modulosService.deleteModulo(deletandoModulo.id)
      showToast('Módulo excluído.', 'info')
      setDeletandoModulo(null)
      await reloadModulos()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir módulo.', 'error')
    }
  }

  // ── aula modal ───────────────────────────────────────────────────────────

  function openCriarAula(modulo: Modulo) {
    setAulaModulo(modulo)
    setAulaEditando(null)
    const nextOrdem = (modulo.aulas?.length || 0) + 1
    setAulaForm({ titulo: '', descricao: '', video_url: '', duracao_min: '', ordem: String(nextOrdem) })
    setModalAula('create')
  }

  function openEditarAula(modulo: Modulo, aula: Aula) {
    setAulaModulo(modulo)
    setAulaEditando(aula)
    setAulaForm({
      titulo: aula.titulo,
      descricao: aula.descricao || '',
      video_url: aula.video_url || '',
      duracao_min: aula.duracao_min?.toString() || '',
      ordem: aula.ordem.toString(),
    })
    setModalAula('edit')
  }

  async function handleSalvarAula() {
    if (!aulaForm.titulo.trim()) { showToast('Título da aula obrigatório.', 'error'); return }
    if (!aulaModulo) return
    setSaving(true)
    try {
      const payload = {
        titulo: aulaForm.titulo.trim(),
        descricao: aulaForm.descricao.trim() || null,
        video_url: aulaForm.video_url.trim() || null,
        duracao_min: aulaForm.duracao_min ? parseInt(aulaForm.duracao_min) : null,
        ordem: parseInt(aulaForm.ordem) || 1,
      }
      if (modalAula === 'edit' && aulaEditando) {
        await modulosService.updateAula(aulaEditando.id, payload)
        showToast('Aula atualizada!', 'success')
      } else {
        await modulosService.createAula(aulaModulo.id, payload)
        showToast('Aula criada!', 'success')
      }
      setModalAula(null)
      await reloadModulos()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar aula.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletarAula() {
    if (!deletandoAula) return
    try {
      await modulosService.deleteAula(deletandoAula.id)
      showToast('Aula excluída.', 'info')
      setDeletandoAula(null)
      await reloadModulos()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir aula.', 'error')
    }
  }

  // ── reordering ────────────────────────────────────────────────────────────

  async function moverModulo(idx: number, dir: -1 | 1) {
    const target = modulos[idx + dir]
    if (!target) return
    setReordering(true)
    try {
      await modulosService.swapOrdemModulos(modulos[idx], target)
      await reloadModulos()
    } catch { showToast('Erro ao reordenar.', 'error') }
    finally { setReordering(false) }
  }

  async function moverAula(modulo: Modulo, idx: number, dir: -1 | 1) {
    const aulas = modulo.aulas || []
    const target = aulas[idx + dir]
    if (!target) return
    setReordering(true)
    try {
      await modulosService.swapOrdemAulas(aulas[idx], target)
      await reloadModulos()
    } catch { showToast('Erro ao reordenar.', 'error') }
    finally { setReordering(false) }
  }

  // ── helpers for forms ─────────────────────────────────────────────────────

  const setMod = (f: keyof ModuloForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setModuloForm(p => ({ ...p, [f]: e.target.value }))

  const setAul = (f: keyof AulaForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setAulaForm(p => ({ ...p, [f]: e.target.value }))

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-montserrat text-xl font-bold text-steel-800">Conteúdo dos Cursos</h2>
          <Button size="sm" onClick={openCriarModulo} disabled={!cursoId}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo módulo
          </Button>
        </div>

        {/* Course selector */}
        {loadingCursos ? (
          <div className="h-10 bg-white border border-steel-200 rounded-xl animate-pulse" />
        ) : (
          <div className="bg-white border border-steel-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="lbl mb-1">Curso selecionado</label>
              <select
                value={cursoId}
                onChange={e => setCursoId(e.target.value)}
                className="inp w-full"
              >
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>{c.titulo}</option>
                ))}
              </select>
            </div>
            {cursoDados && (
              <div className="flex gap-4 text-sm text-steel-500 flex-shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-navy-500">{modulos.length}</p>
                  <p className="text-xs">Módulos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-navy-500">{totalAulas}</p>
                  <p className="text-xs">Aulas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-navy-500">{formatDuracao(totalMin) || '—'}</p>
                  <p className="text-xs">Total</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loadingModulos && (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white border border-steel-200 rounded-2xl p-4 animate-pulse h-16" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loadingModulos && modulos.length === 0 && cursoId && (
          <div className="bg-white border border-steel-200 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 bg-navy-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="font-semibold text-steel-700 mb-1">Nenhum módulo ainda</p>
            <p className="text-sm text-steel-400 mb-4">Adicione módulos para organizar as aulas deste curso.</p>
            <Button size="sm" onClick={openCriarModulo}>Criar primeiro módulo</Button>
          </div>
        )}

        {/* Modules list */}
        {!loadingModulos && modulos.length > 0 && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 text-xs text-steel-400">
              <button onClick={expandAll} className="hover:text-navy-500 transition-colors">Expandir tudo</button>
              <span>·</span>
              <button onClick={collapseAll} className="hover:text-navy-500 transition-colors">Recolher tudo</button>
            </div>

            <div className="flex flex-col gap-3">
              {modulos.map((modulo, mIdx) => {
                const aulas = modulo.aulas || []
                const expandido = expandidos.has(modulo.id)
                const durTotal = totalDuracaoModulo(aulas)

                return (
                  <div
                    key={modulo.id}
                    className="bg-white border border-steel-200 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Module header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-steel-50 border-b border-steel-100">
                      {/* Drag handle / order */}
                      <span className="text-xs font-bold text-steel-400 w-6 text-center flex-shrink-0">
                        {mIdx + 1}
                      </span>

                      {/* Title */}
                      <button
                        onClick={() => toggleExpand(modulo.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <svg
                          className={`w-4 h-4 text-steel-400 flex-shrink-0 transition-transform duration-150 ${expandido ? 'rotate-90' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-semibold text-steel-800 text-sm truncate">{modulo.titulo}</span>
                      </button>

                      {/* Meta */}
                      <div className="hidden sm:flex items-center gap-2 text-xs text-steel-400 flex-shrink-0">
                        <span>{aulas.length} {aulas.length === 1 ? 'aula' : 'aulas'}</span>
                        {durTotal && <span>• {durTotal}</span>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <IconBtn
                          onClick={() => moverModulo(mIdx, -1)}
                          title="Mover para cima"
                          disabled={mIdx === 0 || reordering}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </IconBtn>
                        <IconBtn
                          onClick={() => moverModulo(mIdx, 1)}
                          title="Mover para baixo"
                          disabled={mIdx === modulos.length - 1 || reordering}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </IconBtn>

                        <div className="w-px h-4 bg-steel-200 mx-1" />

                        <IconBtn onClick={() => openCriarAula(modulo)} title="Adicionar aula" color="blue">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </IconBtn>
                        <IconBtn onClick={() => openEditarModulo(modulo)} title="Editar módulo">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </IconBtn>
                        <IconBtn onClick={() => setDeletandoModulo(modulo)} title="Excluir módulo" color="red">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </IconBtn>
                      </div>
                    </div>

                    {/* Aulas list */}
                    {expandido && (
                      <div className="divide-y divide-steel-50">
                        {aulas.length === 0 ? (
                          <div className="px-6 py-5 text-center">
                            <p className="text-sm text-steel-400 mb-3">Nenhuma aula neste módulo.</p>
                            <button
                              onClick={() => openCriarAula(modulo)}
                              className="text-sm text-navy-500 font-medium hover:underline"
                            >
                              + Adicionar primeira aula
                            </button>
                          </div>
                        ) : (
                          aulas.map((aula, aIdx) => {
                            const vLabel = videoLabel(aula.video_url)
                            return (
                              <div
                                key={aula.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-steel-50 transition-colors group"
                              >
                                {/* Order num */}
                                <span className="text-xs text-steel-300 w-6 text-center flex-shrink-0">
                                  {aIdx + 1}
                                </span>

                                {/* Play icon */}
                                <svg className="w-4 h-4 text-steel-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>

                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-steel-700 truncate">{aula.titulo}</p>
                                  {aula.descricao && (
                                    <p className="text-xs text-steel-400 truncate">{aula.descricao}</p>
                                  )}
                                </div>

                                {/* Meta badges */}
                                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                                  {vLabel && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      vLabel === 'YouTube' ? 'bg-red-50 text-red-600' :
                                      vLabel === 'Vimeo' ? 'bg-blue-50 text-blue-600' :
                                      'bg-steel-100 text-steel-500'
                                    }`}>
                                      {vLabel}
                                    </span>
                                  )}
                                  {aula.duracao_min ? (
                                    <span className="text-xs text-steel-400">{formatDuracao(aula.duracao_min)}</span>
                                  ) : (
                                    <span className="text-xs text-steel-300">—</span>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <IconBtn
                                    onClick={() => moverAula(modulo, aIdx, -1)}
                                    title="Mover para cima"
                                    disabled={aIdx === 0 || reordering}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </IconBtn>
                                  <IconBtn
                                    onClick={() => moverAula(modulo, aIdx, 1)}
                                    title="Mover para baixo"
                                    disabled={aIdx === aulas.length - 1 || reordering}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </IconBtn>
                                  <IconBtn onClick={() => openEditarAula(modulo, aula)} title="Editar aula">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </IconBtn>
                                  <IconBtn onClick={() => setDeletandoAula(aula)} title="Excluir aula" color="red">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </IconBtn>
                                </div>
                              </div>
                            )
                          })
                        )}

                        {/* Add aula footer */}
                        {aulas.length > 0 && (
                          <div className="px-4 py-2 bg-steel-50/50">
                            <button
                              onClick={() => openCriarAula(modulo)}
                              className="text-xs text-navy-500 font-medium hover:underline flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Adicionar aula
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Modal: criar/editar módulo ────────────────────────────────────── */}
      <Modal
        open={modalModulo !== null}
        onClose={() => setModalModulo(null)}
        title={modalModulo === 'edit' ? 'Editar módulo' : 'Novo módulo'}
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Título do módulo *"
            value={moduloForm.titulo}
            onChange={setMod('titulo')}
            placeholder="Ex: Introdução ao curso"
            autoFocus
          />
          <Input
            label="Ordem"
            type="number"
            min="1"
            value={moduloForm.ordem}
            onChange={setMod('ordem')}
            helpText="Define a posição do módulo no curso"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModalModulo(null)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSalvarModulo}>
              {modalModulo === 'edit' ? 'Salvar' : 'Criar módulo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: criar/editar aula ──────────────────────────────────────── */}
      <Modal
        open={modalAula !== null}
        onClose={() => setModalAula(null)}
        title={
          modalAula === 'edit'
            ? `Editar aula — ${aulaModulo?.titulo}`
            : `Nova aula — ${aulaModulo?.titulo}`
        }
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4">
          {/* Título + Ordem */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <Input
                label="Título da aula *"
                value={aulaForm.titulo}
                onChange={setAul('titulo')}
                placeholder="Ex: Apresentação do curso"
                autoFocus
              />
            </div>
            <Input
              label="Ordem"
              type="number"
              min="1"
              value={aulaForm.ordem}
              onChange={setAul('ordem')}
            />
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1">
            <label className="lbl">Descrição</label>
            <textarea
              value={aulaForm.descricao}
              onChange={setAul('descricao')}
              rows={3}
              className="inp resize-none"
              placeholder="Descreva o conteúdo desta aula..."
            />
          </div>

          {/* Vídeo URL */}
          <div className="flex flex-col gap-1.5">
            <Input
              label="URL do vídeo"
              value={aulaForm.video_url}
              onChange={setAul('video_url')}
              placeholder="https://youtu.be/... ou https://vimeo.com/..."
            />
            {aulaForm.video_url && (
              <div className="flex items-center gap-2 text-xs">
                {isYouTube(aulaForm.video_url) && (
                  <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YouTube detectado
                  </span>
                )}
                {isVimeo(aulaForm.video_url) && (
                  <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                    Vimeo detectado
                  </span>
                )}
                {!isYouTube(aulaForm.video_url) && !isVimeo(aulaForm.video_url) && (
                  <span className="text-steel-400">Vídeo direto (MP4/WebM)</span>
                )}
              </div>
            )}
          </div>

          {/* Duração */}
          <Input
            label="Duração (minutos)"
            type="number"
            min="1"
            value={aulaForm.duracao_min}
            onChange={setAul('duracao_min')}
            placeholder="Ex: 15"
            helpText="Duração em minutos para exibir na barra lateral"
          />

          {/* Preview duração */}
          {aulaForm.duracao_min && (
            <p className="text-xs text-steel-400 -mt-2">
              Exibido como: <strong>{formatDuracao(parseInt(aulaForm.duracao_min))}</strong>
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-steel-100">
            <Button variant="ghost" onClick={() => setModalAula(null)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSalvarAula}>
              {modalAula === 'edit' ? 'Salvar alterações' : 'Criar aula'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: confirmar exclusão de módulo ───────────────────────────── */}
      <Modal open={!!deletandoModulo} onClose={() => setDeletandoModulo(null)} title="Excluir módulo">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Ação irreversível</p>
              <p className="text-sm text-red-600 mt-1">
                Excluir <strong>"{deletandoModulo?.titulo}"</strong> vai remover todas as {deletandoModulo?.aulas?.length || 0} aulas associadas.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeletandoModulo(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeletarModulo}>Excluir módulo</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: confirmar exclusão de aula ─────────────────────────────── */}
      <Modal open={!!deletandoAula} onClose={() => setDeletandoAula(null)} title="Excluir aula">
        <div className="flex flex-col gap-4">
          <p className="text-steel-600">
            Tem certeza que deseja excluir a aula <strong>"{deletandoAula?.titulo}"</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeletandoAula(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeletarAula}>Excluir aula</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
