import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Pencil, Trash2, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react'
import { cursosService } from '@/services/cursosService'
import { modulosService } from '@/services/modulosService'
import { provasService } from '@/services/provasService'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input, Modal } from '@/components/ui'
import type { Curso, Modulo, Prova, Questao } from '@/types'

// ─── Formulário de questão ────────────────────────────────────────────────────

const LETRAS = ['A', 'B', 'C', 'D'] as const
type Letra = typeof LETRAS[number]

interface QuestaoForm {
  enunciado: string
  A: string; B: string; C: string; D: string
  resposta_certa: Letra
}

const FORM_VAZIO: QuestaoForm = { enunciado: '', A: '', B: '', C: '', D: '', resposta_certa: 'A' }

// ─── Component principal ──────────────────────────────────────────────────────

export function ProvasAdmin() {
  const { showToast } = useToast()

  // Seleção
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cursoId, setCursoId] = useState<string>('')
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [moduloSelecionado, setModuloSelecionado] = useState<Modulo | null>(null)

  // Prova do módulo selecionado
  const [prova, setProva] = useState<Prova | null>(null)
  const [provasMap, setProvasMap] = useState<Record<string, boolean>>({}) // modulo_id → tem prova

  // Loading
  const [loadingCurso, setLoadingCurso] = useState(false)
  const [loadingProva, setLoadingProva] = useState(false)
  const [salvandoProva, setSalvandoProva] = useState(false)

  // Modal de questão
  const [modalQuestao, setModalQuestao] = useState(false)
  const [editandoQuestao, setEditandoQuestao] = useState<Questao | null>(null)
  const [formQuestao, setFormQuestao] = useState<QuestaoForm>(FORM_VAZIO)
  const [salvandoQuestao, setSalvandoQuestao] = useState(false)

  // Modal de deletar
  const [deletandoQuestao, setDeletandoQuestao] = useState<Questao | null>(null)
  const [deletandoProva, setDeletandoProva] = useState(false)

  // Título da prova (editável inline)
  const [tituloProva, setTituloProva] = useState('')
  const [editandoTitulo, setEditandoTitulo] = useState(false)

  // ── Carrega cursos na montagem ────────────────────────────────────────────

  useEffect(() => {
    cursosService.getAll()
      .then(data => { setCursos(data); if (data.length > 0) setCursoId(data[0].id) })
      .catch(() => showToast('Erro ao carregar cursos.', 'error'))
  }, [])

  // ── Carrega módulos ao selecionar curso ───────────────────────────────────

  useEffect(() => {
    if (!cursoId) return
    setLoadingCurso(true)
    setModuloSelecionado(null)
    setProva(null)
    modulosService.getModulosByCurso(cursoId)
      .then(async mods => {
        setModulos(mods)
        if (mods.length === 0) { setProvasMap({}); return }
        const provasArr = await provasService.getProvasByModulos(mods.map(m => m.id))
        const map: Record<string, boolean> = {}
        provasArr.forEach(p => { map[p.modulo_id] = true })
        setProvasMap(map)
      })
      .catch(() => showToast('Erro ao carregar módulos.', 'error'))
      .finally(() => setLoadingCurso(false))
  }, [cursoId])

  // ── Seleciona módulo e carrega sua prova ──────────────────────────────────

  async function selecionarModulo(modulo: Modulo) {
    setModuloSelecionado(modulo)
    setProva(null)
    setLoadingProva(true)
    try {
      const p = await provasService.getProvaByModuloAdmin(modulo.id)
      setProva(p)
      setTituloProva(p?.titulo ?? `Avaliação — ${modulo.titulo}`)
    } catch {
      showToast('Erro ao carregar prova.', 'error')
    } finally {
      setLoadingProva(false)
    }
  }

  // ── Cria a prova do módulo ────────────────────────────────────────────────

  async function criarProva() {
    if (!moduloSelecionado) return
    setSalvandoProva(true)
    try {
      const nova = await provasService.criarProva(moduloSelecionado.id, tituloProva.trim() || `Avaliação — ${moduloSelecionado.titulo}`)
      nova.questoes = []
      setProva(nova)
      setProvasMap(prev => ({ ...prev, [moduloSelecionado.id]: true }))
      showToast('Prova criada!', 'success')
    } catch {
      showToast('Erro ao criar prova.', 'error')
    } finally {
      setSalvandoProva(false)
    }
  }

  // ── Salva título da prova ─────────────────────────────────────────────────

  async function salvarTitulo() {
    if (!prova || !tituloProva.trim()) return
    try {
      await provasService.atualizarProva(prova.id, tituloProva.trim())
      setProva(prev => prev ? { ...prev, titulo: tituloProva.trim() } : prev)
      setEditandoTitulo(false)
      showToast('Título atualizado.', 'success')
    } catch {
      showToast('Erro ao salvar título.', 'error')
    }
  }

  // ── Deleta a prova inteira ────────────────────────────────────────────────

  async function deletarProva() {
    if (!prova || !moduloSelecionado) return
    try {
      await provasService.deletarProva(prova.id)
      setProva(null)
      setProvasMap(prev => { const n = { ...prev }; delete n[moduloSelecionado.id]; return n })
      setDeletandoProva(false)
      showToast('Prova excluída.', 'info')
    } catch {
      showToast('Erro ao excluir prova.', 'error')
    }
  }

  // ── Abre modal de questão ─────────────────────────────────────────────────

  function abrirNovaQuestao() {
    setEditandoQuestao(null)
    setFormQuestao(FORM_VAZIO)
    setModalQuestao(true)
  }

  function abrirEditarQuestao(q: Questao) {
    setEditandoQuestao(q)
    setFormQuestao({
      enunciado: q.enunciado,
      A: q.alternativas.A,
      B: q.alternativas.B,
      C: q.alternativas.C,
      D: q.alternativas.D,
      resposta_certa: q.resposta_certa ?? 'A',
    })
    setModalQuestao(true)
  }

  // ── Salva questão (criar ou editar) ───────────────────────────────────────

  async function salvarQuestao() {
    if (!prova) return
    const { enunciado, A, B, C, D, resposta_certa } = formQuestao
    if (!enunciado.trim() || !A.trim() || !B.trim() || !C.trim() || !D.trim()) {
      showToast('Preencha todos os campos da questão.', 'error')
      return
    }
    setSalvandoQuestao(true)
    try {
      const alternativas = { A: A.trim(), B: B.trim(), C: C.trim(), D: D.trim() }
      if (editandoQuestao) {
        await provasService.atualizarQuestao(editandoQuestao.id, { enunciado: enunciado.trim(), alternativas, resposta_certa })
        setProva(prev => {
          if (!prev) return prev
          return { ...prev, questoes: (prev.questoes || []).map(q => q.id === editandoQuestao.id ? { ...q, enunciado: enunciado.trim(), alternativas, resposta_certa } : q) }
        })
        showToast('Questão atualizada!', 'success')
      } else {
        const ordem = (prova.questoes?.length ?? 0)
        const nova = await provasService.criarQuestao(prova.id, { enunciado: enunciado.trim(), alternativas, resposta_certa, ordem })
        setProva(prev => prev ? { ...prev, questoes: [...(prev.questoes || []), nova] } : prev)
        showToast('Questão adicionada!', 'success')
      }
      setModalQuestao(false)
    } catch {
      showToast('Erro ao salvar questão.', 'error')
    } finally {
      setSalvandoQuestao(false)
    }
  }

  // ── Deleta questão ────────────────────────────────────────────────────────

  async function deletarQuestao() {
    if (!deletandoQuestao) return
    try {
      await provasService.deletarQuestao(deletandoQuestao.id)
      setProva(prev => prev ? { ...prev, questoes: (prev.questoes || []).filter(q => q.id !== deletandoQuestao.id) } : prev)
      setDeletandoQuestao(null)
      showToast('Questão excluída.', 'info')
    } catch {
      showToast('Erro ao excluir questão.', 'error')
    }
  }

  const questoes = prova?.questoes || []

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div>
          <h2 className="font-montserrat text-xl font-bold text-steel-800">Avaliações</h2>
          <p className="text-sm text-steel-400 mt-0.5">
            Crie e gerencie as provas de cada módulo. O aluno precisa ser aprovado para avançar.
          </p>
        </div>

        {/* Seletor de curso */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="text-sm font-medium text-steel-600 whitespace-nowrap">Curso:</label>
          <select
            value={cursoId}
            onChange={e => setCursoId(e.target.value)}
            className="inp flex-1 max-w-sm"
          >
            {cursos.length === 0 && <option value="">Nenhum curso cadastrado</option>}
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.titulo}</option>
            ))}
          </select>
        </div>

        {/* Layout dois painéis */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── Painel esquerdo: módulos ───────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-steel-200 bg-steel-50">
              <p className="text-xs font-semibold text-steel-500 uppercase tracking-wide">Módulos</p>
            </div>

            {loadingCurso ? (
              <div className="p-6 text-center text-steel-400 text-sm animate-pulse">Carregando...</div>
            ) : modulos.length === 0 ? (
              <div className="p-6 text-center text-steel-400 text-sm">Nenhum módulo encontrado.</div>
            ) : (
              <div className="divide-y divide-steel-100">
                {modulos.map((mod, idx) => {
                  const temProva = provasMap[mod.id]
                  const selecionado = moduloSelecionado?.id === mod.id
                  return (
                    <button
                      key={mod.id}
                      onClick={() => selecionarModulo(mod)}
                      className={[
                        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                        selecionado ? 'bg-navy-500 text-white' : 'hover:bg-steel-50',
                      ].join(' ')}
                    >
                      <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${selecionado ? 'bg-white/20 text-white' : 'bg-steel-100 text-steel-500'}`}>
                        {idx + 1}
                      </span>
                      <span className={`flex-1 text-sm font-medium truncate ${selecionado ? 'text-white' : 'text-steel-700'}`}>
                        {mod.titulo}
                      </span>
                      {temProva ? (
                        <CheckCircle2 size={16} className={selecionado ? 'text-green-300' : 'text-green-500'} />
                      ) : (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${selecionado ? 'bg-white/20 text-white/70' : 'bg-steel-100 text-steel-400'}`}>
                          sem prova
                        </span>
                      )}
                      <ChevronRight size={14} className={selecionado ? 'text-white/60' : 'text-steel-300'} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Painel direito: editor de prova ───────────────────────── */}
          <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden flex flex-col">

            {!moduloSelecionado ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-3">
                <div className="bg-steel-50 rounded-full p-4">
                  <BookOpen className="text-steel-300" size={32} />
                </div>
                <p className="text-steel-400 text-sm">Selecione um módulo para gerenciar a avaliação.</p>
              </div>
            ) : loadingProva ? (
              <div className="flex-1 flex items-center justify-center p-10 text-steel-400 text-sm animate-pulse">
                Carregando prova...
              </div>
            ) : (
              <>
                {/* Header do painel */}
                <div className="px-5 py-4 border-b border-steel-200 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {editandoTitulo && prova ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="inp text-sm flex-1"
                          value={tituloProva}
                          onChange={e => setTituloProva(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') salvarTitulo(); if (e.key === 'Escape') setEditandoTitulo(false) }}
                          autoFocus
                        />
                        <Button size="sm" onClick={salvarTitulo}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditandoTitulo(false)}>Cancelar</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-steel-800 truncate">
                          {prova ? prova.titulo : `Módulo: ${moduloSelecionado.titulo}`}
                        </h3>
                        {prova && (
                          <button onClick={() => { setTituloProva(prova.titulo); setEditandoTitulo(true) }} className="text-steel-400 hover:text-steel-600">
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-steel-400 mt-0.5">
                      {prova ? `${questoes.length} questão${questoes.length !== 1 ? 'ões' : ''}` : 'Nenhuma prova cadastrada'}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {prova ? (
                      <>
                        <Button size="sm" onClick={abrirNovaQuestao}>
                          <Plus size={15} /> Questão
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeletandoProva(true)}>
                          <Trash2 size={15} />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" loading={salvandoProva} onClick={criarProva}>
                        <Plus size={15} /> Criar prova
                      </Button>
                    )}
                  </div>
                </div>

                {/* Corpo: lista de questões ou estado vazio */}
                {!prova ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
                    <div className="bg-navy-50 rounded-full p-4">
                      <ClipboardList className="text-navy-300" size={32} />
                    </div>
                    <div>
                      <p className="text-steel-600 font-medium text-sm">Este módulo não tem avaliação</p>
                      <p className="text-steel-400 text-xs mt-1">Clique em "Criar prova" para começar.</p>
                    </div>
                  </div>
                ) : questoes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
                    <div className="bg-steel-50 rounded-full p-4">
                      <Plus className="text-steel-300" size={32} />
                    </div>
                    <div>
                      <p className="text-steel-600 font-medium text-sm">Prova criada, mas sem questões</p>
                      <p className="text-steel-400 text-xs mt-1">Adicione pelo menos 10 questões para uma boa avaliação.</p>
                    </div>
                    <Button size="sm" onClick={abrirNovaQuestao}><Plus size={15} /> Adicionar questão</Button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto divide-y divide-steel-100">

                    {/* Alerta de questões insuficientes */}
                    {questoes.length < 10 && (
                      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                        <span className="text-amber-500 text-xs font-medium">
                          ⚠ Recomendado: mínimo de 10 questões. Você tem {questoes.length}.
                        </span>
                      </div>
                    )}

                    {questoes.map((q, idx) => (
                      <div key={q.id} className="px-5 py-4 flex items-start gap-3 hover:bg-steel-50 transition-colors group">
                        <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-steel-800 leading-snug">{q.enunciado}</p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {LETRAS.map(l => (
                              <p key={l} className={[
                                'text-xs px-2 py-1 rounded flex items-center gap-1.5',
                                q.resposta_certa === l
                                  ? 'bg-green-50 text-green-700 font-medium'
                                  : 'text-steel-500',
                              ].join(' ')}>
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${q.resposta_certa === l ? 'bg-green-500 text-white' : 'bg-steel-200 text-steel-500'}`}>
                                  {l}
                                </span>
                                {q.alternativas[l]}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => abrirEditarQuestao(q)} className="p-1.5 text-steel-400 hover:text-navy-500 rounded-lg hover:bg-navy-50 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeletandoQuestao(q)} className="p-1.5 text-steel-400 hover:text-brand-red rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: adicionar/editar questão ─────────────────────────────────── */}
      <Modal
        open={modalQuestao}
        onClose={() => setModalQuestao(false)}
        title={editandoQuestao ? 'Editar questão' : 'Nova questão'}
        maxWidth="lg"
      >
        <div className="flex flex-col gap-5">

          <div>
            <label className="lbl">Enunciado</label>
            <textarea
              value={formQuestao.enunciado}
              onChange={e => setFormQuestao(p => ({ ...p, enunciado: e.target.value }))}
              rows={3}
              placeholder="Digite o enunciado da questão..."
              className="inp resize-none mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LETRAS.map(l => (
              <div key={l}>
                <label className="lbl">Alternativa {l}</label>
                <Input
                  value={formQuestao[l]}
                  onChange={e => setFormQuestao(p => ({ ...p, [l]: e.target.value }))}
                  placeholder={`Texto da alternativa ${l}`}
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="lbl mb-2 block">Resposta correta</label>
            <div className="flex gap-2">
              {LETRAS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setFormQuestao(p => ({ ...p, resposta_certa: l }))}
                  className={[
                    'w-10 h-10 rounded-xl font-bold text-sm transition-all',
                    formQuestao.resposta_certa === l
                      ? 'bg-green-500 text-white shadow-md scale-105'
                      : 'bg-steel-100 text-steel-500 hover:bg-steel-200',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-steel-100">
            <Button variant="ghost" onClick={() => setModalQuestao(false)}>Cancelar</Button>
            <Button loading={salvandoQuestao} onClick={salvarQuestao}>
              {editandoQuestao ? 'Salvar alterações' : 'Adicionar questão'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: confirmar exclusão de questão ─────────────────────────────── */}
      <Modal
        open={!!deletandoQuestao}
        onClose={() => setDeletandoQuestao(null)}
        title="Excluir questão"
        maxWidth="sm"
      >
        <p className="text-steel-600 text-sm mb-5">
          Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.
        </p>
        <p className="text-xs text-steel-500 bg-steel-50 rounded-lg px-3 py-2 mb-5 italic">
          "{deletandoQuestao?.enunciado}"
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeletandoQuestao(null)}>Cancelar</Button>
          <Button variant="danger" onClick={deletarQuestao}>Excluir</Button>
        </div>
      </Modal>

      {/* ── Modal: confirmar exclusão da prova ───────────────────────────────── */}
      <Modal
        open={deletandoProva}
        onClose={() => setDeletandoProva(false)}
        title="Excluir prova"
        maxWidth="sm"
      >
        <p className="text-steel-600 text-sm mb-5">
          Tem certeza que deseja excluir a prova <strong>"{prova?.titulo}"</strong>?
          Todas as questões e o histórico de tentativas dos alunos serão perdidos.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeletandoProva(false)}>Cancelar</Button>
          <Button variant="danger" onClick={deletarProva}>Excluir prova</Button>
        </div>
      </Modal>
    </>
  )
}
