import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { CertificadoPDF, type CertificadoPDFData } from './CertificadoPDF'

type Props = {
  pdfData: CertificadoPDFData
  className?: string
  // size compacto exibe só ícone — útil em tabelas; full mostra texto
  variant?: 'compact' | 'full'
}

// Geração lazy: só monta o PDF ao clicar. Evita gerar N PDFs simultâneos
// quando a tabela tem muitas linhas.
export function CertificadoDownloadButton({ pdfData, className, variant = 'compact' }: Props) {
  const [preparando, setPreparando] = useState(false)

  async function handleDownload() {
    setPreparando(true)
    try {
      const blob = await pdf(<CertificadoPDF dados={pdfData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado-${pdfData.numero_serie}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Revoga depois do clique para liberar memória
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setPreparando(false)
    }
  }

  const baseClasses = variant === 'compact'
    ? 'inline-flex items-center justify-center p-2 rounded-lg hover:bg-steel-100 text-steel-600 hover:text-navy-500 transition-colors'
    : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-500 text-white text-sm font-medium hover:bg-navy-600 transition-colors'

  return (
    <button
      type="button"
      onClick={handleDownload}
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
  )
}
