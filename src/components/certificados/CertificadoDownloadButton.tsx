import { useEffect, useRef, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { CertificadoPDF, type CertificadoPDFData } from './CertificadoPDF'
import { useToast } from '@/contexts/ToastContext'

type Props = {
  pdfData: CertificadoPDFData
  className?: string
  // compact = só ícone (ideal pra tabelas); full = ícone + texto
  variant?: 'compact' | 'full'
}

// Geração lazy: só monta o PDF ao clicar. Evita gerar N PDFs simultâneos
// quando a tabela tem muitas linhas.
//
// Padrão de download:
//   1. clique → pdf().toBlob() (assíncrono)
//   2. blob pronto → seta blobUrl no state → React renderiza <a> real
//   3. useEffect dispara linkRef.click() depois do commit
// Usar <a> renderizado por React (em vez de criado via JS após await)
// evita perda do user gesture context em alguns navegadores.
export function CertificadoDownloadButton({ pdfData, className, variant = 'compact' }: Props) {
  const { showToast } = useToast()
  const [preparando, setPreparando] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const linkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    if (!blobUrl || !linkRef.current) return
    linkRef.current.click()
    const url = blobUrl
    setBlobUrl(null)
    // Revoga depois do clique para liberar memória, com folga para o
    // navegador iniciar o download.
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, [blobUrl])

  async function handleClick() {
    if (preparando) return
    setPreparando(true)
    try {
      const blob = await pdf(<CertificadoPDF dados={pdfData} />).toBlob()
      setBlobUrl(URL.createObjectURL(blob))
    } catch (err) {
      console.error('Erro ao gerar PDF do certificado:', err)
      const msg = err instanceof Error ? err.message : 'desconhecido'
      showToast(`Erro ao preparar PDF: ${msg}`, 'error')
    } finally {
      setPreparando(false)
    }
  }

  const baseClasses = variant === 'compact'
    ? 'inline-flex items-center justify-center p-2 rounded-lg hover:bg-steel-100 text-steel-600 hover:text-navy-500 transition-colors'
    : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-500 text-white text-sm font-medium hover:bg-navy-600 transition-colors'

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={preparando}
        className={`${baseClasses} ${preparando ? 'opacity-50 cursor-wait' : ''} ${className ?? ''}`}
        title="Baixar certificado em PDF"
        aria-label="Baixar certificado em PDF"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {variant === 'full' && <span>{preparando ? 'Preparando…' : 'Baixar PDF'}</span>}
      </button>
      {blobUrl && (
        <a
          ref={linkRef}
          href={blobUrl}
          download={`certificado-${pdfData.numero_serie}.pdf`}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      )}
    </>
  )
}
