import { useState, useEffect, useRef } from 'react'
import { certificadosService } from '@/services/certificadosService'
import { matriculasService } from '@/services/matriculasService'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input, Modal } from '@/components/ui'
import { formatCPF, formatDate } from '@/utils/formatters'
import type { MatriculaComCert } from '@/types'

export function CertificadosAdmin() {
  const { showToast } = useToast()
  const [matriculas, setMatriculas] = useState<MatriculaComCert[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  // Exclusão
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<MatriculaComCert | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const load = async () => {
    try {
      const data = await matriculasService.getAllMatriculasComCert()
      setMatriculas(data)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar matrículas.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = matriculas.filter(m => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return m.aluno_nome.toLowerCase().includes(q) || m.aluno_cpf.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
  })

  // Disparado quando o admin clica em "Enviar PDF" numa linha
  function handleUploadClick(matriculaId: string) {
    setUploadingId(matriculaId)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reseta o input para permitir re-upload do mesmo arquivo
    e.target.value = ''

    if (!file || !uploadingId) return

    if (file.type !== 'application/pdf') {
      showToast('Selecione um arquivo PDF.', 'error')
      setUploadingId(null)
      return
    }

    const mat = matriculas.find(m => m.matricula_id === uploadingId)
    if (!mat) return

    try {
      await certificadosService.uploadCertificadoPDF(uploadingId, file, mat.aluno_id)
      showToast('Certificado enviado com sucesso!', 'success')
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao enviar certificado.', 'error')
    } finally {
      setUploadingId(null)
    }
  }

  async function handleConfirmarExclusao() {
    if (!confirmandoExclusao?.cert_id) return
    setExcluindo(true)
    try {
      await certificadosService.excluirCertificado(confirmandoExclusao.cert_id)
      showToast('Certificado excluído.', 'success')
      setConfirmandoExclusao(null)
      await load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir certificado.', 'error')
    } finally {
      setExcluindo(false)
    }
  }

  async function handleDownload(mat: MatriculaComCert) {
    if (!mat.pdf_url) return
    try {
      const url = await certificadosService.getCertificadoSignedUrl(mat.pdf_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao gerar link de download.', 'error')
    }
  }

  const totalEmitidos = matriculas.filter(m => m.pdf_url).length
  const totalAguardando = matriculas.length - totalEmitidos

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-montserrat text-xl font-bold text-steel-800">Certificados</h2>
        <Button size="sm" variant="secondary" onClick={load}>Atualizar</Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-steel-200 p-5">
          <div className="w-10 h-10 bg-navy-500/10 rounded-xl flex items-center justify-center mb-3">
            <span className="text-lg font-bold text-navy-500">{matriculas.length}</span>
          </div>
          <p className="text-xs text-steel-500">Total de matrículas</p>
        </div>
        <div className="bg-white rounded-2xl border border-steel-200 p-5">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
            <span className="text-lg font-bold text-green-600">{totalEmitidos}</span>
          </div>
          <p className="text-xs text-steel-500">Com certificado</p>
        </div>
        <div className="bg-white rounded-2xl border border-steel-200 p-5">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <span className="text-lg font-bold text-amber-600">{totalAguardando}</span>
          </div>
          <p className="text-xs text-steel-500">Aguardando upload</p>
        </div>
      </div>

      {/* Busca */}
      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Input de arquivo oculto — compartilhado por todas as linhas */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

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
            {search ? 'Nenhum resultado para esta busca.' : 'Nenhuma matrícula cadastrada.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-steel-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Aluno</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Curso</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide hidden md:table-cell">Matriculado em</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide">Certificado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {filtered.map(mat => {
                  const isUploading = uploadingId === mat.matricula_id
                  return (
                    <tr key={mat.matricula_id} className="hover:bg-steel-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-steel-800">{mat.aluno_nome}</p>
                        <p className="text-xs text-steel-400">{formatCPF(mat.aluno_cpf.replace(/\D/g, ''))}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-steel-700">{mat.curso_titulo}</p>
                        {mat.nr_referencia && (
                          <p className="text-xs text-orange-500 font-medium">{mat.nr_referencia}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-steel-500 text-xs whitespace-nowrap hidden md:table-cell">
                        {formatDate(mat.liberado_em)}
                      </td>
                      <td className="px-4 py-3">
                        {mat.pdf_url ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Emitido
                            </span>
                            {mat.data_emissao && (
                              <p className="text-xs text-steel-400 mt-0.5">{formatDate(mat.data_emissao)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Aguardando
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Botão de download — só aparece se cert com PDF */}
                          {mat.pdf_url && (
                            <button
                              type="button"
                              onClick={() => handleDownload(mat)}
                              className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-blue-50 text-steel-400 hover:text-blue-600 transition-colors"
                              title="Baixar certificado"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          )}

                          {/* Botão de upload */}
                          <button
                            type="button"
                            onClick={() => handleUploadClick(mat.matricula_id)}
                            disabled={isUploading}
                            className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-navy-50 text-steel-400 hover:text-navy-600 transition-colors disabled:opacity-50"
                            title={mat.pdf_url ? 'Substituir PDF' : 'Enviar PDF'}
                          >
                            {isUploading ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                              </svg>
                            )}
                          </button>

                          {/* Botão de exclusão — só se tiver cert */}
                          {mat.cert_id && (
                            <button
                              type="button"
                              onClick={() => setConfirmandoExclusao(mat)}
                              className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-red-50 text-steel-400 hover:text-red-600 transition-colors"
                              title="Excluir certificado"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal — Confirmação de exclusão */}
      <Modal
        open={!!confirmandoExclusao}
        onClose={() => !excluindo && setConfirmandoExclusao(null)}
        title="Excluir certificado"
        maxWidth="sm"
      >
        {confirmandoExclusao && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-steel-700">
              Tem certeza que deseja excluir o certificado de{' '}
              <strong>{confirmandoExclusao.aluno_nome}</strong>?
            </p>
            <div className="bg-steel-50 rounded-lg p-3 text-sm space-y-1">
              <p>
                <span className="font-semibold text-steel-700">Aluno:</span>{' '}
                {confirmandoExclusao.aluno_nome}
              </p>
              <p>
                <span className="font-semibold text-steel-700">CPF:</span>{' '}
                {formatCPF(confirmandoExclusao.aluno_cpf.replace(/\D/g, ''))}
              </p>
              <p>
                <span className="font-semibold text-steel-700">Curso:</span>{' '}
                {confirmandoExclusao.curso_titulo}
              </p>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              ⚠️ O progresso do aluno (teórico/prático) é preservado. O admin poderá
              enviar um novo PDF depois.
            </p>
            <p className="text-xs text-red-600">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setConfirmandoExclusao(null)} disabled={excluindo}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarExclusao}
                loading={excluindo}
                className="!bg-red-600 hover:!bg-red-700"
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
