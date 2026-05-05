import { useState, useEffect } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useAuth } from '@/contexts/AuthContext'
import { certificadosService } from '@/services/certificadosService'
import { cursosService } from '@/services/cursosService'
import { CertificadoPDF } from '@/components/certificados/CertificadoPDF'
import type { CertificadoPDFData } from '@/components/certificados/CertificadoPDF'
import type { Certificado } from '@/types'

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function isVencido(data?: string | null): boolean {
  if (!data) return false
  return new Date(data) < new Date()
}

export function Certificados() {
  const { user, profile } = useAuth()
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [pdfDataMap, setPdfDataMap] = useState<Record<string, CertificadoPDFData>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const certs = await certificadosService.getMeusCertificados(user.id)
        setCertificados(certs)

        if (certs.length > 0) {
          const cursoIds = [...new Set(certs.map(c => c.curso_id))]
          const cursos = await Promise.all(cursoIds.map(id => cursosService.getById(id)))
          const cursoMap = Object.fromEntries(
            cursos.filter(Boolean).map(c => [c!.id, c!])
          )

          const map: Record<string, CertificadoPDFData> = {}
          for (const cert of certs) {
            const curso = cursoMap[cert.curso_id]
            map[cert.id] = {
              nome_aluno: profile?.nome ?? '',
              cpf_aluno: profile?.cpf ?? '',
              foto_url: profile?.foto_url ?? null,
              nome_curso: curso?.titulo ?? '',
              nr_referencia: curso?.nr_referencia ?? null,
              carga_horaria: curso?.carga_horaria ?? null,
              data_emissao: cert.data_emissao,
              data_validade: cert.data_validade ?? null,
              numero_serie: cert.numero_serie,
              tipo: cert.tipo,
            }
          }
          setPdfDataMap(map)
        }
      } catch {
        // silencioso — estado vazio já trata
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, profile])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-montserrat text-xl font-bold text-steel-800">Meus Certificados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-steel-200 p-5 animate-pulse h-36" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-montserrat text-xl font-bold text-steel-800">Meus Certificados</h2>

      {certificados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-steel-200 p-10 text-center">
          <div className="w-16 h-16 bg-steel-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="font-medium text-steel-600 mb-1">Nenhum certificado ainda</p>
          <p className="text-sm text-steel-400">Complete um curso para receber seu certificado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certificados.map(cert => {
            const vencido = isVencido(cert.data_validade)
            const pdfData = pdfDataMap[cert.id]

            return (
              <div
                key={cert.id}
                className="bg-white rounded-2xl border border-steel-200 p-5 flex flex-col gap-3"
              >
                {/* Header do card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 bg-navy-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cert.tipo === 'completo'
                        ? 'bg-navy-500/10 text-navy-500'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {cert.tipo === 'completo' ? 'Completo' : 'Teórico'}
                    </span>
                    {vencido && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
                        Vencido
                      </span>
                    )}
                  </div>
                </div>

                {/* Nome do curso */}
                <div>
                  <p className="font-semibold text-steel-800 leading-snug">
                    {pdfData?.nome_curso ?? '—'}
                  </p>
                  {pdfData?.nr_referencia && (
                    <span className="text-xs text-orange-500 font-medium">{pdfData.nr_referencia}</span>
                  )}
                </div>

                {/* Nº de série */}
                <code className="text-xs bg-steel-100 px-3 py-1.5 rounded-lg font-mono text-steel-600 self-start">
                  {cert.numero_serie}
                </code>

                {/* Datas */}
                <div className="flex flex-col gap-1 text-xs text-steel-500">
                  <span>Emitido em {formatarData(cert.data_emissao)}</span>
                  {cert.data_validade && (
                    <span className={vencido ? 'text-red-500 font-medium' : ''}>
                      Válido até {formatarData(cert.data_validade)}
                    </span>
                  )}
                </div>

                {/* Botão de download */}
                {pdfData ? (
                  <PDFDownloadLink
                    document={<CertificadoPDF dados={pdfData} />}
                    fileName={`certificado-${cert.numero_serie}.pdf`}
                    className="mt-auto"
                  >
                    {({ loading: pdfLoading }) => (
                      <button
                        disabled={pdfLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-500 text-white text-sm font-medium hover:bg-navy-600 disabled:opacity-50 disabled:cursor-wait transition-colors"
                      >
                        {pdfLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Gerando PDF...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Baixar Certificado PDF
                          </>
                        )}
                      </button>
                    )}
                  </PDFDownloadLink>
                ) : (
                  <div className="h-10 bg-steel-100 rounded-xl animate-pulse mt-auto" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
