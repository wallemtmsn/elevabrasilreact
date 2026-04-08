import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { perguntasService, type PerguntaAdmin } from '@/services/perguntasService'

// Agrupa perguntas por curso
function groupByCurso(perguntas: PerguntaAdmin[]) {
  const map = new Map<string, { cursoId: string; cursoTitulo: string; perguntas: PerguntaAdmin[] }>()
  for (const p of perguntas) {
    const curso = p.aulas?.modulos?.cursos
    if (!curso) continue
    if (!map.has(curso.id)) {
      map.set(curso.id, { cursoId: curso.id, cursoTitulo: curso.titulo, perguntas: [] })
    }
    map.get(curso.id)!.perguntas.push(p)
  }
  return Array.from(map.values())
}

export function PerguntasAdmin() {
  const { user } = useAuth()
  const [perguntas, setPerguntas] = useState<PerguntaAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [cursoFiltro, setCursoFiltro] = useState<string>('todos')
  const [respondendoId, setRespondendoId] = useState<string | null>(null)
  const [textoResposta, setTextoResposta] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = () => {
    setLoading(true)
    perguntasService.getAll()
      .then(setPerguntas)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const grupos = groupByCurso(perguntas)

  const gruposFiltrados = cursoFiltro === 'todos'
    ? grupos
    : grupos.filter(g => g.cursoId === cursoFiltro)

  const totalPendentes = perguntas.filter(p => !p.resposta).length

  const handleResponder = async (id: string) => {
    if (!textoResposta.trim() || !user) return
    setSalvando(true)
    try {
      await perguntasService.responder(id, textoResposta.trim(), user.id)
      setRespondendoId(null)
      setTextoResposta('')
      carregar()
    } catch { /* silent */ }
    finally { setSalvando(false) }
  }

  const handleDeletar = async (id: string) => {
    if (!confirm('Excluir esta pergunta?')) return
    try {
      await perguntasService.deletar(id)
      carregar()
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-steel-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-steel-800">Perguntas e Respostas</h2>
          <p className="text-sm text-steel-500 mt-0.5">
            {perguntas.length} {perguntas.length === 1 ? 'pergunta' : 'perguntas'} no total
            {totalPendentes > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {totalPendentes} pendente{totalPendentes > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button onClick={carregar} className="text-sm text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>

      {/* Filtro por curso */}
      {grupos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCursoFiltro('todos')}
            className={[
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              cursoFiltro === 'todos'
                ? 'bg-navy-700 text-white'
                : 'bg-white border border-steel-200 text-steel-600 hover:bg-steel-50',
            ].join(' ')}
          >
            Todos os cursos
          </button>
          {grupos.map(g => (
            <button
              key={g.cursoId}
              onClick={() => setCursoFiltro(g.cursoId)}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                cursoFiltro === g.cursoId
                  ? 'bg-navy-700 text-white'
                  : 'bg-white border border-steel-200 text-steel-600 hover:bg-steel-50',
              ].join(' ')}
            >
              {g.cursoTitulo}
              <span className="ml-1.5 opacity-70">
                ({g.perguntas.filter(p => !p.resposta).length} pend.)
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {perguntas.length === 0 ? (
        <div className="bg-white rounded-xl border border-steel-200 p-12 text-center">
          <svg className="w-12 h-12 text-steel-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-steel-400 text-sm">Nenhuma pergunta ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {gruposFiltrados.map(grupo => (
            <div key={grupo.cursoId} className="bg-white rounded-xl border border-steel-200 overflow-hidden">
              {/* Cabeçalho do curso */}
              <div className="px-5 py-3 bg-navy-50 border-b border-navy-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="font-semibold text-navy-800 text-sm">{grupo.cursoTitulo}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-steel-500">
                  <span>{grupo.perguntas.length} pergunta{grupo.perguntas.length > 1 ? 's' : ''}</span>
                  {grupo.perguntas.filter(p => !p.resposta).length > 0 && (
                    <span className="bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                      {grupo.perguntas.filter(p => !p.resposta).length} pendente{grupo.perguntas.filter(p => !p.resposta).length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de perguntas */}
              <div className="divide-y divide-steel-100">
                {grupo.perguntas.map(p => (
                  <div key={p.id} className="p-5">
                    {/* Meta: aula + aluno + data */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5">
                      <span className="text-xs bg-steel-100 text-steel-600 px-2 py-0.5 rounded-full font-medium">
                        {p.aulas?.titulo || 'Aula'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700 flex-shrink-0">
                          {(p.profiles?.nome || 'A')[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-steel-700">{p.profiles?.nome || 'Aluno'}</span>
                      </div>
                      <span className="text-xs text-steel-400">{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span>
                      {!p.resposta
                        ? <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">Pendente</span>
                        : <span className="ml-auto text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Respondida</span>
                      }
                    </div>

                    {/* Pergunta */}
                    <p className="text-sm text-steel-700 mb-3">{p.pergunta}</p>

                    {/* Resposta */}
                    {p.resposta ? (
                      <div className="ml-4 bg-navy-50 border border-navy-100 rounded-lg p-3 mb-2">
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
                    ) : respondendoId === p.id ? (
                      <div className="ml-4 mt-2">
                        <textarea
                          value={textoResposta}
                          onChange={e => setTextoResposta(e.target.value)}
                          placeholder="Digite sua resposta..."
                          rows={3}
                          className="w-full text-sm border border-steel-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
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
                            disabled={salvando || !textoResposta.trim()}
                            className="px-4 py-1.5 bg-navy-700 text-white text-sm font-medium rounded-lg hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {salvando ? 'Salvando...' : 'Salvar resposta'}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Ações */}
                    <div className="flex gap-3 mt-2">
                      {!p.resposta && respondendoId !== p.id && (
                        <button
                          onClick={() => { setRespondendoId(p.id); setTextoResposta('') }}
                          className="text-xs text-navy-600 hover:text-navy-800 font-medium"
                        >
                          Responder
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletar(p.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
