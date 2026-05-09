import { useState, useEffect, useMemo } from 'react'
import { progressoService } from '@/services/progressoService'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input } from '@/components/ui'
import { formatCPF, formatDate } from '@/utils/formatters'
import type { ProgressoAluno } from '@/types'

type SortKey = 'aluno_nome' | 'progresso_pct' | 'liberado_em'

function statusInfo(row: ProgressoAluno): { label: string; classes: string } {
  if (row.certificado_emitido)
    return { label: 'Concluído', classes: 'bg-green-50 text-green-700' }
  if (row.teorico_concluido)
    return { label: 'Teórico OK', classes: 'bg-amber-100 text-amber-700' }
  if (row.aulas_concluidas > 0)
    return { label: 'Estudando', classes: 'bg-blue-50 text-blue-700' }
  return { label: 'Não iniciado', classes: 'bg-steel-100 text-steel-500' }
}

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 70)  return 'bg-blue-500'
  if (pct >= 30)  return 'bg-amber-400'
  return 'bg-red-400'
}

export function ProgressoAlunos() {
  const { showToast } = useToast()
  const [rows, setRows] = useState<ProgressoAluno[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('aluno_nome')
  const [sortAsc, setSortAsc] = useState(true)

  const load = async () => {
    try {
      const data = await progressoService.getProgressoAlunos()
      setRows(data)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar progresso.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const list = q
      ? rows.filter(r =>
          r.aluno_nome.toLowerCase().includes(q) ||
          r.aluno_cpf.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
        )
      : rows

    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'aluno_nome') cmp = a.aluno_nome.localeCompare(b.aluno_nome, 'pt-BR')
      if (sortKey === 'progresso_pct') cmp = a.progresso_pct - b.progresso_pct
      if (sortKey === 'liberado_em') cmp = a.liberado_em.localeCompare(b.liberado_em)
      return sortAsc ? cmp : -cmp
    })
  }, [rows, search, sortKey, sortAsc])

  // Métricas summary
  const total = rows.length
  const naoIniciados  = rows.filter(r => r.aulas_concluidas === 0 && !r.teorico_concluido).length
  const estudando     = rows.filter(r => r.aulas_concluidas > 0 && !r.teorico_concluido).length
  const concluidos    = rows.filter(r => r.certificado_emitido).length

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return (
      <svg className="w-3 h-3 text-steel-400 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
    return sortAsc ? (
      <svg className="w-3 h-3 text-navy-500 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-navy-500 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-montserrat text-xl font-bold text-steel-800">Progresso dos Alunos</h2>
        <Button size="sm" variant="secondary" onClick={load}>Atualizar</Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total matrículas', value: total,         color: 'text-navy-500',    bg: 'bg-navy-500/10' },
          { label: 'Não iniciados',    value: naoIniciados,  color: 'text-steel-500',   bg: 'bg-steel-100' },
          { label: 'Estudando',        value: estudando,     color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Concluídos',       value: concluidos,    color: 'text-green-600',   bg: 'bg-green-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-steel-200 p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <span className={`text-lg font-bold ${card.color}`}>{card.value}</span>
            </div>
            <p className="text-xs text-steel-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-steel-100">
          <h3 className="font-semibold text-steel-700 text-sm">
            Matrículas ({filtered.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-steel-400 text-sm animate-pulse">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-steel-400 text-sm">
            {search ? 'Nenhum resultado para esta busca.' : 'Nenhuma matrícula encontrada.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-steel-50 text-left">
                  <th
                    className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide cursor-pointer hover:text-steel-700 select-none"
                    onClick={() => toggleSort('aluno_nome')}
                  >
                    Aluno <SortIcon k="aluno_nome" />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide hidden md:table-cell">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">
                    Curso
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide hidden lg:table-cell cursor-pointer hover:text-steel-700 select-none"
                    onClick={() => toggleSort('liberado_em')}
                  >
                    Matriculado <SortIcon k="liberado_em" />
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide cursor-pointer hover:text-steel-700 select-none"
                    onClick={() => toggleSort('progresso_pct')}
                  >
                    Progresso <SortIcon k="progresso_pct" />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {filtered.map(row => {
                  const pct = row.progresso_pct
                  const status = statusInfo(row)
                  return (
                    <tr key={row.matricula_id} className="hover:bg-steel-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-steel-800">{row.aluno_nome}</p>
                        <p className="text-xs text-steel-400 md:hidden">
                          {formatCPF(row.aluno_cpf.replace(/\D/g, ''))}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-steel-500 hidden md:table-cell whitespace-nowrap">
                        {formatCPF(row.aluno_cpf.replace(/\D/g, ''))}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-steel-700">{row.curso_titulo}</p>
                        {row.nr_referencia && (
                          <p className="text-xs text-orange-500 font-medium">{row.nr_referencia}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-steel-500 whitespace-nowrap hidden lg:table-cell">
                        {formatDate(row.liberado_em)}
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-steel-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${barColor(pct)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-steel-600 w-9 text-right shrink-0">
                            {pct}%
                          </span>
                        </div>
                        <p className="text-xs text-steel-400 mt-0.5">
                          {row.aulas_concluidas}/{row.total_aulas} aulas
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.classes}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
