import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { certificadosService } from '@/services/certificadosService'
import { cursosService } from '@/services/cursosService'
import type { Certificado, Curso } from '@/types'

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function DownloadButton({ cert }: { cert: Certificado }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!cert.pdf_url) return
    setLoading(true)
    try {
      const url = await certificadosService.getCertificadoSignedUrl(cert.pdf_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // Falha silenciosa — o link não abre, o usuário pode tentar novamente
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-500 text-white text-sm font-medium hover:bg-navy-600 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
      Baixar Certificado
    </button>
  )
}

export function Certificados() {
  const { user } = useAuth()
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [cursoMap, setCursoMap] = useState<Record<string, Curso>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const all = await certificadosService.getMeusCertificados(user.id)
        // Mostrar apenas certificados com PDF enviado pelo admin
        const comPdf = all.filter(c => c.pdf_url)
        setCertificados(comPdf)

        const cursoIds = [...new Set(comPdf.filter(c => c.curso_id).map(c => c.curso_id!))]
        if (cursoIds.length > 0) {
          const cursos = await Promise.all(cursoIds.map(id => cursosService.getById(id)))
          setCursoMap(Object.fromEntries(cursos.filter(Boolean).map(c => [c!.id, c!])))
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

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
          <p className="font-medium text-steel-600 mb-1">Nenhum certificado disponível</p>
          <p className="text-sm text-steel-400">Seus certificados aparecerão aqui após a emissão pelo admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certificados.map(cert => {
            const curso = cert.curso_id ? cursoMap[cert.curso_id] : undefined

            return (
              <div
                key={cert.id}
                className="bg-white rounded-2xl border border-steel-200 p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 bg-navy-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-navy-500/10 text-navy-500">
                      Certificado
                    </span>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-steel-800 leading-snug">
                    {curso?.titulo ?? '—'}
                  </p>
                  {curso?.nr_referencia && (
                    <span className="text-xs text-orange-500 font-medium">{curso.nr_referencia}</span>
                  )}
                </div>

                <code className="text-xs bg-steel-100 px-3 py-1.5 rounded-lg font-mono text-steel-600 self-start">
                  {cert.numero_serie}
                </code>

                <div className="flex flex-col gap-1 text-xs text-steel-500">
                  <span>Emitido em {formatarData(cert.data_emissao)}</span>
                  <span>Disponível por 6 meses após a emissão</span>
                </div>

                <DownloadButton cert={cert} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
