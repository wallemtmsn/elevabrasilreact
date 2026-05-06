import { useState, useEffect } from 'react'
import { pdf } from '@react-pdf/renderer'
import { certificadosService } from '@/services/certificadosService'
import { useToast } from '@/contexts/ToastContext'
import { Button, Input, Modal } from '@/components/ui'
import { formatCPF, formatDate } from '@/utils/formatters'
import { isValidCPF } from '@/utils/validators'
import { CertificadoPDF } from '@/components/certificados/CertificadoPDF'
import type { CertificadoPDFData } from '@/components/certificados/CertificadoPDF'
import { CertificadoDownloadButton } from '@/components/certificados/CertificadoDownloadButton'
import type { CertificadoAdmin, MetricasCertificados } from '@/types'

type FormPresencial = {
  nome_aluno: string
  cpf_aluno: string
  nome_curso: string
  nr_referencia: string
  carga_horaria: string
  instrutor: string
  validade_meses: string
}

const emptyForm: FormPresencial = {
  nome_aluno: '', cpf_aluno: '', nome_curso: '',
  nr_referencia: '', carga_horaria: '', instrutor: '', validade_meses: '12',
}

// Serial e data_validade são gerados server-side pela RPC emitir_certificado_presencial
// (sequence única + validação de meses), eliminando colisão de Math.random e
// validades negativas. Ver migration 20260506_002_rpc_emitir_certificado_presencial.

export function CertificadosAdmin() {
  const { showToast } = useToast()
  const [certificados, setCertificados] = useState<CertificadoAdmin[]>([])
  const [metricas, setMetricas] = useState<MetricasCertificados | null>(null)
  const [loading, setLoading] = useState(true)
  const [emitindo, setEmitindo] = useState<string | null>(null)

  // Modal emissão presencial
  const [modalPresencial, setModalPresencial] = useState(false)
  const [form, setForm] = useState<FormPresencial>(emptyForm)
  const [pdfData, setPdfData] = useState<CertificadoPDFData | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [preparando, setPreparando] = useState(false)

  // Gera o blob em background assim que pdfData é definido
  useEffect(() => {
    if (!pdfData) {
      setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
      return
    }
    setPreparando(true)
    pdf(<CertificadoPDF dados={pdfData} />)
      .toBlob()
      .then(blob => {
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
      })
      .catch(() => showToast('Erro ao preparar PDF. Tente novamente.', 'error'))
      .finally(() => setPreparando(false))

    return () => setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
  }, [pdfData])

  const setField = (f: keyof FormPresencial) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  // Aplica máscara 000.000.000-00 conforme o admin digita
  const setCpfField = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, cpf_aluno: formatCPF(e.target.value.replace(/\D/g, '').slice(0, 11)) }))

  const [emitindoPresencial, setEmitindoPresencial] = useState(false)

  function abrirModal() {
    setForm(emptyForm)
    setPdfData(null)
    setModalPresencial(true)
  }

  function fecharModal() {
    setModalPresencial(false)
    setPdfData(null)
  }

  // Aceita string vazia (→ null) ou inteiro >= 1. Caso contrário, retorna 'invalido'
  // — impede que parseInt('-5') ou parseInt('abc') passem direto à RPC.
  function parseInteiroPositivoOpcional(raw: string): number | null | 'invalido' {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    if (!Number.isInteger(n) || n < 1) return 'invalido'
    return n
  }

  // Persiste o certificado via RPC e, com a resposta server-side (serial único +
  // data_validade calculada), monta o pdfData para renderização local do PDF.
  async function gerarPDF() {
    if (!form.nome_aluno.trim()) { showToast('Nome do aluno obrigatório.', 'error'); return }
    if (!form.nome_curso.trim()) { showToast('Nome do curso obrigatório.', 'error'); return }
    if (!form.instrutor.trim()) { showToast('Nome do instrutor obrigatório.', 'error'); return }

    // CPF é opcional, mas se preenchido precisa ser válido (algoritmo da Receita)
    const cpfTrim = form.cpf_aluno.trim()
    if (cpfTrim && !isValidCPF(cpfTrim)) {
      showToast('CPF do aluno inválido.', 'error'); return
    }

    const validadeMesesNum = parseInteiroPositivoOpcional(form.validade_meses)
    if (validadeMesesNum === 'invalido') {
      showToast('Validade (meses) deve ser um inteiro positivo.', 'error'); return
    }
    const cargaHorariaNum = parseInteiroPositivoOpcional(form.carga_horaria)
    if (cargaHorariaNum === 'invalido') {
      showToast('Carga horária deve ser um inteiro positivo.', 'error'); return
    }

    setEmitindoPresencial(true)
    try {
      const cert = await certificadosService.emitirCertificadoPresencial({
        nome_aluno:     form.nome_aluno.trim(),
        nome_curso:     form.nome_curso.trim(),
        instrutor:      form.instrutor.trim(),
        cpf_aluno:      form.cpf_aluno.trim() || null,
        nr_referencia:  form.nr_referencia.trim() || null,
        carga_horaria:  cargaHorariaNum,
        validade_meses: validadeMesesNum,
      })

      setPdfData({
        nome_aluno:     cert.nome_aluno_avulso     ?? form.nome_aluno.trim(),
        cpf_aluno:      cert.cpf_aluno_avulso      ?? null,
        nome_curso:     cert.nome_curso_avulso     ?? form.nome_curso.trim(),
        nr_referencia:  cert.nr_referencia_avulso  ?? null,
        carga_horaria:  cert.carga_horaria_avulso  ?? null,
        instrutor:      cert.instrutor_avulso      ?? form.instrutor.trim(),
        data_emissao:   cert.data_emissao,
        data_validade:  cert.data_validade ?? null,
        numero_serie:   cert.numero_serie,
        tipo:           'presencial',
      })

      showToast('Certificado presencial registrado!', 'success')
      // Atualiza a tabela em background — o admin pode continuar baixando o PDF.
      load()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao emitir certificado.', 'error')
    } finally {
      setEmitindoPresencial(false)
    }
  }

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
    if (!cert.aluno_id || !cert.curso_id) {
      showToast('Certificado presencial não pode ser reemitido por aqui.', 'error')
      return
    }
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-montserrat text-xl font-bold text-steel-800">Certificados</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={load}>Atualizar</Button>
          <Button size="sm" onClick={abrirModal}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Emitir Presencial
          </Button>
        </div>
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
                  <th className="px-4 py-3 text-xs font-semibold text-steel-500 uppercase tracking-wide text-center">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {certificados.map(cert => {
                  // Presencial: dados vivem nos campos *_avulso (snapshot no momento da emissão)
                  // Vinculado: dados vêm dos joins aluno/curso
                  const ehPresencial = cert.tipo === 'presencial'
                  const nomeAluno   = ehPresencial ? cert.nome_aluno_avulso    : cert.aluno?.nome
                  const cpfAluno    = ehPresencial ? cert.cpf_aluno_avulso     : cert.aluno?.cpf
                  const nomeCurso   = ehPresencial ? cert.nome_curso_avulso    : cert.curso?.titulo
                  const nrRef       = ehPresencial ? cert.nr_referencia_avulso : cert.curso?.nr_referencia
                  const cargaH      = ehPresencial ? cert.carga_horaria_avulso : cert.curso?.carga_horaria

                  const tipoBadge = {
                    completo:   { label: 'Completo',   classes: 'bg-navy-500/10 text-navy-500' },
                    teorico:    { label: 'Teórico',    classes: 'bg-blue-50 text-blue-600' },
                    presencial: { label: 'Presencial', classes: 'bg-purple-50 text-purple-700' },
                  }[cert.tipo] ?? { label: cert.tipo, classes: 'bg-steel-100 text-steel-600' }

                  const pdfData: CertificadoPDFData = {
                    nome_aluno:    nomeAluno   ?? '—',
                    cpf_aluno:     cpfAluno    ?? null,
                    foto_url:      ehPresencial ? null : (cert.aluno?.foto_url ?? null),
                    nome_curso:    nomeCurso   ?? '—',
                    nr_referencia: nrRef       ?? null,
                    carga_horaria: cargaH      ?? null,
                    data_emissao:  cert.data_emissao,
                    data_validade: cert.data_validade ?? null,
                    numero_serie:  cert.numero_serie,
                    tipo:          cert.tipo,
                    instrutor:     ehPresencial ? cert.instrutor_avulso : null,
                  }

                  return (
                    <tr key={cert.id} className="hover:bg-steel-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-steel-800">{nomeAluno ?? '—'}</p>
                        <p className="text-xs text-steel-400">{cpfAluno ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-steel-700">{nomeCurso ?? '—'}</p>
                        {nrRef && (
                          <p className="text-xs text-orange-500 font-medium">{nrRef}</p>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadge.classes}`}>
                          {tipoBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CertificadoDownloadButton pdfData={pdfData} />
                      </td>
                    </tr>
                  )
                })}
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

      {/* Modal — Emissão Presencial */}
      <Modal
        open={modalPresencial}
        onClose={fecharModal}
        title="Emitir Certificado Presencial"
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do aluno *"
              value={form.nome_aluno}
              onChange={setField('nome_aluno')}
              placeholder="Nome completo"
            />
            <Input
              label="CPF do aluno"
              value={form.cpf_aluno}
              onChange={setCpfField}
              placeholder="000.000.000-00"
              helpText="Opcional, mas se preenchido precisa ser válido"
              inputMode="numeric"
            />
          </div>
          <Input
            label="Nome do curso *"
            value={form.nome_curso}
            onChange={setField('nome_curso')}
            placeholder="Ex: NR-10 — Segurança em Instalações Elétricas"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="NR de referência"
              value={form.nr_referencia}
              onChange={setField('nr_referencia')}
              placeholder="Ex: NR-10"
            />
            <Input
              label="Carga horária (h)"
              type="number"
              min="1"
              value={form.carga_horaria}
              onChange={setField('carga_horaria')}
              placeholder="40"
            />
            <Input
              label="Validade (meses)"
              type="number"
              min="1"
              value={form.validade_meses}
              onChange={setField('validade_meses')}
              placeholder="12"
            />
          </div>
          <Input
            label="Nome do instrutor *"
            value={form.instrutor}
            onChange={setField('instrutor')}
            placeholder="Aparece na linha de assinatura do certificado"
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={fecharModal}>
              Cancelar
            </Button>
            {!pdfData ? (
              <Button onClick={gerarPDF} loading={emitindoPresencial}>
                Gerar Certificado
              </Button>
            ) : preparando ? (
              <Button loading disabled>
                Preparando PDF...
              </Button>
            ) : blobUrl ? (
              <a
                href={blobUrl}
                download={`certificado-${pdfData.numero_serie}.pdf`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-500 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar PDF
              </a>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  )
}
