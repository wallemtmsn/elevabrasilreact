import { useState, useEffect, useMemo } from 'react'
import { profileService } from '@/services/profileService'
import { cursosService } from '@/services/cursosService'
import { matriculasService } from '@/services/matriculasService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Input, Modal } from '@/components/ui'
import { formatCPF, formatDate } from '@/utils/formatters'
import type { ProfileWithEmail, Curso } from '@/types'

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, loading,
}: {
  checked: boolean; onChange: () => void; loading?: boolean
}) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={[
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-green-500' : 'bg-steel-300',
        loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function MatriculasAdmin() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [alunos, setAlunos] = useState<ProfileWithEmail[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // modal state
  const [alunoSelecionado, setAlunoSelecionado] = useState<ProfileWithEmail | null>(null)
  const [matriculas, setMatriculas] = useState<Set<string>>(new Set()) // curso_ids liberados
  const [toggling, setToggling] = useState<Set<string>>(new Set())     // curso_ids em transição

  // todas as matrículas em memória (evita re-fetch)
  const [todasMatriculas, setTodasMatriculas] = useState<{ aluno_id: string; curso_id: string }[]>([])
  const [countMap, setCountMap] = useState<Record<string, number>>({})

  // ── load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      profileService.getAllWithEmail(),
      cursosService.getAll(),
      matriculasService.getAllMatriculas(),
    ])
      .then(([profs, cs, mats]) => {
        setAlunos(profs)
        setCursos(cs)
        // compute count map client-side from single query (evita N+1)
        const map: Record<string, number> = {}
        mats.forEach(m => { map[m.aluno_id] = (map[m.aluno_id] || 0) + 1 })
        setTodasMatriculas(mats)
        setCountMap(map)
      })
      .catch(() => showToast('Erro ao carregar dados.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  // ── open modal ───────────────────────────────────────────────────────────

  function abrirGerenciar(aluno: ProfileWithEmail) {
    const ids = todasMatriculas
      .filter(m => m.aluno_id === aluno.id)
      .map(m => m.curso_id)
    setMatriculas(new Set(ids))
    setAlunoSelecionado(aluno)
  }

  function fecharModal() {
    setAlunoSelecionado(null)
    setMatriculas(new Set())
    setToggling(new Set())
  }

  // ── toggle enrollment ─────────────────────────────────────────────────────

  async function toggleCurso(cursoId: string) {
    if (!alunoSelecionado || !user || toggling.has(cursoId)) return

    setToggling(prev => new Set(prev).add(cursoId))

    const jaTemAcesso = matriculas.has(cursoId)
    try {
      if (jaTemAcesso) {
        await matriculasService.revogar(alunoSelecionado.id, cursoId)
        setMatriculas(prev => { const n = new Set(prev); n.delete(cursoId); return n })
        setTodasMatriculas(prev => prev.filter(m => !(m.aluno_id === alunoSelecionado.id && m.curso_id === cursoId)))
        setCountMap(prev => ({ ...prev, [alunoSelecionado.id]: Math.max(0, (prev[alunoSelecionado.id] || 0) - 1) }))
        showToast('Acesso revogado.', 'info')
      } else {
        await matriculasService.liberar(alunoSelecionado.id, cursoId, user.id)
        setMatriculas(prev => new Set(prev).add(cursoId))
        setTodasMatriculas(prev => [...prev, { aluno_id: alunoSelecionado.id, curso_id: cursoId }])
        setCountMap(prev => ({ ...prev, [alunoSelecionado.id]: (prev[alunoSelecionado.id] || 0) + 1 }))
        showToast('Curso liberado!', 'success')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao alterar matrícula.', 'error')
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(cursoId); return n })
    }
  }

  // ── liberar todos / revogar todos ─────────────────────────────────────────

  async function liberarTodos() {
    if (!alunoSelecionado || !user) return
    const naoPossuem = cursos.filter(c => !matriculas.has(c.id))
    if (naoPossuem.length === 0) return
    const ids = new Set(naoPossuem.map(c => c.id))
    setToggling(ids)
    try {
      await Promise.all(naoPossuem.map(c => matriculasService.liberar(alunoSelecionado.id, c.id, user.id)))
      setMatriculas(new Set(cursos.map(c => c.id)))
      setCountMap(prev => ({ ...prev, [alunoSelecionado.id]: cursos.length }))
      showToast('Todos os cursos liberados!', 'success')
    } catch {
      showToast('Erro ao liberar todos os cursos.', 'error')
    } finally {
      setToggling(new Set())
    }
  }

  async function revogarTodos() {
    if (!alunoSelecionado) return
    const possuem = cursos.filter(c => matriculas.has(c.id))
    if (possuem.length === 0) return
    const ids = new Set(possuem.map(c => c.id))
    setToggling(ids)
    try {
      await Promise.all(possuem.map(c => matriculasService.revogar(alunoSelecionado.id, c.id)))
      setMatriculas(new Set())
      setCountMap(prev => ({ ...prev, [alunoSelecionado.id]: 0 }))
      showToast('Todos os acessos revogados.', 'info')
    } catch {
      showToast('Erro ao revogar acessos.', 'error')
    } finally {
      setToggling(new Set())
    }
  }

  // ── filter ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return alunos.filter(a =>
      a.nome.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.cpf || '').includes(q)
    )
  }, [alunos, search])

  const cursosLiberados = cursos.filter(c => matriculas.has(c.id))
  const cursosNaoLiberados = cursos.filter(c => !matriculas.has(c.id))

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-montserrat text-xl font-bold text-steel-800">Matrículas</h2>
            <p className="text-sm text-steel-400 mt-0.5">
              Libere ou revogue acesso dos alunos aos cursos manualmente.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-navy-500/5 border border-navy-500/20 rounded-xl">
          <svg className="w-5 h-5 text-navy-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-navy-600">
            O aluno só visualiza e acessa os cursos que foram <strong>explicitamente liberados</strong> aqui.
            Após o pagamento ser confirmado, libere o curso correspondente pelo botão "Gerenciar cursos".
          </p>
        </div>

        {/* Search */}
        <Input
          placeholder="Buscar por nome, e-mail ou CPF..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-steel-200 p-8 text-center text-steel-400 animate-pulse">
            Carregando...
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-steel-50 border-b border-steel-200">
                  <tr>
                    {['Aluno', 'E-mail', 'CPF', 'Cadastro', 'Cursos liberados', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-steel-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-steel-400">
                        Nenhum aluno encontrado.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(aluno => {
                      const count = countMap[aluno.id] ?? 0
                      return (
                        <tr key={aluno.id} className="hover:bg-steel-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-steel-700 whitespace-nowrap">{aluno.nome}</p>
                          </td>
                          <td className="px-4 py-3 text-steel-500">{aluno.email}</td>
                          <td className="px-4 py-3 text-steel-500 whitespace-nowrap">
                            {aluno.cpf ? formatCPF(aluno.cpf) : '—'}
                          </td>
                          <td className="px-4 py-3 text-steel-400 whitespace-nowrap">
                            {formatDate(aluno.criado_em)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={[
                              'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                              count > 0
                                ? 'bg-green-50 text-green-700'
                                : 'bg-steel-100 text-steel-400',
                            ].join(' ')}>
                              <span className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-green-500' : 'bg-steel-300'}`} />
                              {count} {count === 1 ? 'curso' : 'cursos'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => abrirGerenciar(aluno)}
                              className="flex items-center gap-1.5 text-xs font-medium text-navy-500 hover:text-navy-700 bg-navy-500/10 hover:bg-navy-500/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                              Gerenciar cursos
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-steel-100 text-xs text-steel-400">
              {filtered.length} aluno{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: gerenciar cursos do aluno ─────────────────────────────── */}
      <Modal
        open={!!alunoSelecionado}
        onClose={fecharModal}
        title={`Cursos de ${alunoSelecionado?.nome}`}
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4">

            {/* Student info */}
            <div className="flex items-center gap-3 p-3 bg-steel-50 rounded-xl border border-steel-200">
              <div className="w-9 h-9 rounded-full bg-navy-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {alunoSelecionado?.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-steel-800">{alunoSelecionado?.nome}</p>
                <p className="text-xs text-steel-400">{alunoSelecionado?.email}</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  {matriculas.size} de {cursos.length} liberados
                </span>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex gap-2">
              <button
                onClick={liberarTodos}
                disabled={cursosNaoLiberados.length === 0 || toggling.size > 0}
                className="text-xs text-green-700 font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Liberar todos
              </button>
              <span className="text-steel-300 text-xs">·</span>
              <button
                onClick={revogarTodos}
                disabled={cursosLiberados.length === 0 || toggling.size > 0}
                className="text-xs text-red-500 font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Revogar todos
              </button>
            </div>

            {/* Cursos list */}
            {cursos.length === 0 ? (
              <p className="text-center text-steel-400 text-sm py-6">Nenhum curso cadastrado ainda.</p>
            ) : (
              <div className="flex flex-col divide-y divide-steel-100 border border-steel-200 rounded-xl overflow-hidden">
                {cursos.map(curso => {
                  const liberado = matriculas.has(curso.id)
                  const isToggling = toggling.has(curso.id)

                  return (
                    <div
                      key={curso.id}
                      className={`flex items-center gap-4 px-4 py-3.5 transition-colors ${liberado ? 'bg-green-50/50' : 'bg-white hover:bg-steel-50'}`}
                    >
                      {/* Status dot */}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${liberado ? 'bg-green-500' : 'bg-steel-200'}`} />

                      {/* Course info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${liberado ? 'text-steel-800' : 'text-steel-500'}`}>
                          {curso.titulo}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {curso.carga_horaria && (
                            <span className="text-xs text-steel-400">{curso.carga_horaria}h</span>
                          )}
                          <span className={`text-xs font-medium ${liberado ? 'text-green-600' : 'text-steel-400'}`}>
                            {liberado ? 'Acesso liberado' : 'Sem acesso'}
                          </span>
                        </div>
                      </div>

                      {/* Toggle */}
                      <Toggle
                        checked={liberado}
                        onChange={() => toggleCurso(curso.id)}
                        loading={isToggling}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-steel-100">
              <button
                onClick={fecharModal}
                className="px-4 py-2 text-sm font-medium text-steel-600 hover:text-steel-800 bg-steel-100 hover:bg-steel-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
        </div>
      </Modal>
    </>
  )
}
