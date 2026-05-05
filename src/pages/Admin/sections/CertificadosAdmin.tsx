import { useState, useEffect } from 'react'
import { certificadosService } from '@/services/certificadosService'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import type { CertificadoAdmin, MetricasCertificados } from '@/types'

export function CertificadosAdmin() {
  const { showToast } = useToast()
  const [certificados, setCertificados] = useState<CertificadoAdmin[]>([])
  const [metricas, setMetricas] = useState<MetricasCertificados | null>(null)
  const [loading, setLoading] = useState(true)
  const [emitindo, setEmitindo] = useState<string | null>(null)

  const load = async () => {
    try {
      const [certs, mets] = await Promise.all([
        certificadosService.getAllCertificados(),
        certificadosService.getMetricas(),
      ])
      setCertificados(certs)
      setMetricas(mets)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar certificados.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleEmitirManual = async (cert: CertificadoAdmin) => {
    setEmitindo(cert.id)
    try {
      await certificadosService.emitirCertificado(cert.aluno_id, cert.curso_id)
      showToast('Certificado emitido com sucesso!', 'success')
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao emitir certificado.', 'error')
    } finally {
      setEmitindo(null)
    }
  }

  const metCards = metricas
    ? [
        { label: 'Total emitidos', value: metricas.total, color: 'text-navy-500', bg: 'bg-navy-500/10' },
        { label: 'Este mês', value: metricas.este_mes, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Esta semana', value: metricas.esta_semana, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Hoje', value: metricas.hoje, color: 'text-brand-red', bg: 'bg-brand-red/10' },
      ]
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-montserrat text-xl font-bold text-steel-800">Certificados</h2>
        <Button size="sm" variant="secondary" onClick={load}>Atualizar</Button>
      </div>

      {/* Métricas */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl border border-steel-200 p-5 h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metCards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-steel-200 p-5">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <span className={`text-lg font-bold ${card.color}`}>{card.value}</span>
              </div>
              <p className="text-xs text-steel-500">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-steel-100">
          <h3 className="font-semibold text-steel-700 text-sm">
            Certificados emitidos ({certificados.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-steel-400 text-sm animate-pulse">Carregando...</div>
        ) : certificados.length === 0 ? (
          <div className="p-8 text-center text-steel-400 text-sm">Nenhum certificado emitido ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-steel-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Aluno</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Curso</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Nº Série</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Emissão</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Validade</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {certificados.map(cert => (
                  <tr key={cert.id} className="hover:bg-steel-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-steel-800">{cert.aluno?.nome ?? '—'}</p>
                      <p className="text-xs text-steel-400">{cert.aluno?.cpf ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-steel-700">{cert.curso?.titulo ?? '—'}</p>
                      {cert.curso?.nr_referencia && (
                        <p className="text-xs text-orange-500 font-medium">{cert.curso.nr_referencia}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-steel-100 px-2 py-0.5 rounded font-mono text-steel-600">
                        {cert.numero_serie}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-steel-600 whitespace-nowrap">{formatDate(cert.data_emissao)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cert.data_validade ? (
                        <span className={`text-xs font-medium ${
                          new Date(cert.data_validade) < new Date()
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {formatDate(cert.data_validade)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cert.tipo === 'completo'
                          ? 'bg-navy-500/10 text-navy-500'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {cert.tipo === 'completo' ? 'Completo' : 'Teórico'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ação manual oculta — botão de emergência para re-emitir */}
      {certificados.some(c => !c.numero_serie) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-medium mb-2">Certificados com dados incompletos:</p>
          {certificados.filter(c => !c.numero_serie).map(cert => (
            <div key={cert.id} className="flex items-center justify-between gap-2 py-1">
              <span>{cert.aluno?.nome} — {cert.curso?.titulo}</span>
              <Button
                size="sm"
                loading={emitindo === cert.id}
                onClick={() => handleEmitirManual(cert)}
              >
                Emitir
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
