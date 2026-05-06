import { useState, useEffect } from 'react'
import { certificadosService } from '@/services/certificadosService'
import { matriculasService } from '@/services/matriculasService'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui'
import { formatDate, formatCPF } from '@/utils/formatters'
import type { MatriculaPendente } from '@/types'

export function PendentesPratico() {
  const { showToast } = useToast()
  const [pendentes, setPendentes] = useState<MatriculaPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmando, setConfirmando] = useState<MatriculaPendente | null>(null)
  const [salvando, setSalvando] = useState(false)

  const load = async () => {
    try {
      const data = await certificadosService.getPendentesPratico()
      setPendentes(data)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar pendentes.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleMarcarPratico = async () => {
    if (!confirmando) return
    setSalvando(true)
    try {
      await matriculasService.marcarPraticoCompleto(confirmando.matricula_id)
      // Tenta emitir certificado automaticamente após marcar prático
      try {
        await certificadosService.emitirCertificado(confirmando.aluno_id, confirmando.curso_id)
        showToast('Prático concluído e certificado emitido!', 'success')
      } catch {
        showToast('Prático concluído! Certificado poderá ser emitido na aba Certificados.', 'success')
      }
      setConfirmando(null)
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao marcar prático.', 'error')
    } finally {
      setSalvando(false)
    }
  }

  const urgentes = pendentes.filter(p => p.dias_aguardando > 30)
  const normais  = pendentes.filter(p => p.dias_aguardando <= 30)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-montserrat text-xl font-bold text-steel-800">Pendentes — Teste Prático</h2>
          <p className="text-sm text-steel-500 mt-0.5">
            Alunos que concluíram o teórico mas ainda não realizaram o teste prático
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={load}>Atualizar</Button>
      </div>

      {urgentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">
            ⚠️ {urgentes.length} aluno(s) aguardando há mais de 30 dias
          </p>
          <p className="text-xs text-red-600">Prioridade alta — entre em contato para agendar o teste prático.</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-steel-200 p-8 text-center text-steel-400 animate-pulse">
          Carregando...
        </div>
      ) : pendentes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-steel-200 p-10 text-center">
          <p className="text-steel-400 text-sm">Nenhum aluno pendente de teste prático.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-steel-100 flex items-center justify-between">
            <h3 className="font-semibold text-steel-700 text-sm">
              {pendentes.length} aluno(s) pendente(s)
            </h3>
            <span className="text-xs text-steel-400">Ordenado por: mais antigos primeiro</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-steel-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Aluno</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Curso / NR</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Conclusão Teórico</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Aguardando</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {[...urgentes, ...normais].map(p => (
                  <tr key={p.matricula_id} className={`hover:bg-steel-50/50 ${p.dias_aguardando > 30 ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-steel-800">{p.nome}</p>
                      <p className="text-xs text-steel-400">{formatCPF(p.cpf)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-steel-700">{p.curso_nome}</p>
                      {p.nr_referencia && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                          {p.nr_referencia}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-steel-600 whitespace-nowrap">
                      {p.teorico_data ? formatDate(p.teorico_data) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        p.dias_aguardando > 30
                          ? 'bg-red-100 text-red-700'
                          : p.dias_aguardando > 14
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {p.dias_aguardando}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        onClick={() => setConfirmando(p)}
                      >
                        Marcar prático
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmação */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-montserrat font-bold text-steel-800 text-lg mb-2">Confirmar prático concluído</h3>
            <p className="text-steel-600 text-sm mb-1">
              Marcar <strong>{confirmando.nome}</strong> como aprovado no teste prático do curso:
            </p>
            <p className="text-navy-500 font-semibold text-sm mb-4">{confirmando.curso_nome}</p>
            <p className="text-xs text-steel-400 mb-6">
              O certificado será emitido automaticamente após a confirmação.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setConfirmando(null)}>Cancelar</Button>
              <Button loading={salvando} onClick={handleMarcarPratico}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
