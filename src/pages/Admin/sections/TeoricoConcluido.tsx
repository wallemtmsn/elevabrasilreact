import { useState, useEffect, useMemo } from 'react'
import { certificadosService } from '@/services/certificadosService'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input } from '@/components/ui'
import { formatDate, formatCPF } from '@/utils/formatters'
import type { MatriculaTeoricoOk } from '@/types'

type Situacao = 'todos' | 'certificado_emitido' | 'aguardando_pratico' | 'pratico_ok' | 'cert_pendente'

function getSituacao(m: MatriculaTeoricoOk): Situacao {
  if (m.certificado_emitido) return 'certificado_emitido'
  if (m.exige_pratico && !m.pratico_concluido) return 'aguardando_pratico'
  if (m.exige_pratico && m.pratico_concluido) return 'pratico_ok'
  return 'cert_pendente'
}

const situacaoBadge: Record<Situacao, { label: string; classes: string }> = {
  todos: { label: 'Todos', classes: '' },
  certificado_emitido: { label: 'Certificado Emitido', classes: 'bg-green-100 text-green-700' },
  aguardando_pratico:  { label: 'Aguardando Prático', classes: 'bg-amber-100 text-amber-700' },
  pratico_ok:          { label: 'Prático Concluído', classes: 'bg-blue-100 text-blue-700' },
  cert_pendente:       { label: 'Certificado Pendente', classes: 'bg-steel-100 text-steel-600' },
}

export function TeoricoConcluido() {
  const { showToast } = useToast()
  const [registros, setRegistros] = useState<MatriculaTeoricoOk[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroSit, setFiltroSit] = useState<Situacao>('todos')
  const [emitindo, setEmitindo] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await certificadosService.getTeoricoConcluido()
      setRegistros(data)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar dados.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleEmitir = async (m: MatriculaTeoricoOk) => {
    setEmitindo(m.matricula_id)
    try {
      await certificadosService.emitirCertificado(m.aluno_id, m.curso_id)
      showToast('Certificado emitido com sucesso!', 'success')
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao emitir certificado.', 'error')
    } finally {
      setEmitindo(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return registros.filter(m => {
      const matchSearch = !q || m.nome.toLowerCase().includes(q) || m.cpf.includes(q) || m.curso_nome.toLowerCase().includes(q)
      const matchSit = filtroSit === 'todos' || getSituacao(m) === filtroSit
      return matchSearch && matchSit
    })
  }, [registros, search, filtroSit])

  const contadores = useMemo(() => ({
    certificado_emitido: registros.filter(m => getSituacao(m) === 'certificado_emitido').length,
    aguardando_pratico:  registros.filter(m => getSituacao(m) === 'aguardando_pratico').length,
    pratico_ok:          registros.filter(m => getSituacao(m) === 'pratico_ok').length,
    cert_pendente:       registros.filter(m => getSituacao(m) === 'cert_pendente').length,
  }), [registros])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-montserrat text-xl font-bold text-steel-800">Teórico Concluído</h2>
          <p className="text-sm text-steel-500 mt-0.5">Todos os alunos que concluíram a parte teórica</p>
        </div>
        <Button size="sm" variant="secondary" onClick={load}>Atualizar</Button>
      </div>

      {/* Contadores por situação */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(contadores) as [Situacao, number][]).map(([sit, count]) => (
          <button
            key={sit}
            onClick={() => setFiltroSit(filtroSit === sit ? 'todos' : sit)}
            className={`p-4 rounded-xl border text-left transition-all ${
              filtroSit === sit
                ? 'border-navy-500 bg-navy-500/5 shadow-sm'
                : 'border-steel-200 bg-white hover:border-navy-500/50'
            }`}
          >
            <p className={`text-lg font-bold ${situacaoBadge[sit].classes.split(' ')[1] || 'text-steel-700'}`}>
              {count}
            </p>
            <p className="text-xs text-steel-500 mt-0.5">{situacaoBadge[sit].label}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <Input
        placeholder="Buscar por nome, CPF ou curso..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Tabela */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-steel-200 p-8 text-center text-steel-400 animate-pulse">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-steel-200 p-10 text-center text-steel-400 text-sm">
          Nenhum resultado encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-steel-100">
            <h3 className="font-semibold text-steel-700 text-sm">{filtered.length} registro(s)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-steel-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Aluno</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Curso</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Concluiu em</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Situação</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {filtered.map(m => {
                  const sit = getSituacao(m)
                  const badge = situacaoBadge[sit]
                  const podeEmitir =
                    !m.certificado_emitido &&
                    (!m.exige_pratico || m.pratico_concluido)

                  return (
                    <tr key={m.matricula_id} className="hover:bg-steel-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-steel-800">{m.nome}</p>
                        <p className="text-xs text-steel-400">{formatCPF(m.cpf)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-steel-700">{m.curso_nome}</p>
                        {m.nr_referencia && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            {m.nr_referencia}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-steel-600 whitespace-nowrap">
                        {m.teorico_data ? formatDate(m.teorico_data) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {podeEmitir && (
                          <Button
                            size="sm"
                            loading={emitindo === m.matricula_id}
                            onClick={() => handleEmitir(m)}
                          >
                            Emitir certificado
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
