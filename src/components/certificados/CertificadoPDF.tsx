import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Dados necessários para renderizar o certificado
export interface CertificadoPDFData {
  nome_aluno: string
  cpf_aluno?: string | null
  foto_url?: string | null
  nome_curso: string
  nr_referencia?: string | null
  carga_horaria?: number | null
  data_emissao: string
  data_validade?: string | null
  numero_serie: string
  tipo: 'teorico' | 'completo' | 'presencial'
  instrutor?: string | null
}

Font.register({
  family: 'Georgia',
  src: 'https://fonts.gstatic.com/s/notoserifsc/v22/H4chBXePl9DZ0Xe7gG9cyOj7mgq0SBnQ9T.woff2',
})

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: '15mm',
    fontFamily: 'Helvetica',
  },
  outer: {
    border: '8px solid #1a3a5c',
    borderRadius: 4,
    padding: '18mm',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  logo: {
    height: 52,
    width: 'auto',
    objectFit: 'contain',
  },
  fotoAluno: {
    width: 64,
    height: 64,
    borderRadius: 32,
    objectFit: 'cover',
    border: '2px solid #1a3a5c',
  },
  titulo: {
    fontSize: 30,
    color: '#1a3a5c',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitulo: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  textoNormal: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 6,
  },
  nomeAluno: {
    fontSize: 26,
    color: '#1a3a5c',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    borderBottom: '2px solid #1a3a5c',
    paddingBottom: 4,
    width: '100%',
  },
  cpf: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 16,
  },
  nomeCurso: {
    fontSize: 19,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 6,
    fontStyle: 'italic' as const,
  },
  nrBadge: {
    fontSize: 13,
    color: '#e67e22',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  datasRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 'auto',
    marginTop: 10,
    alignItems: 'center',
  },
  dataTexto: {
    fontSize: 12,
    color: '#444444',
    textAlign: 'center',
  },
  dataValidade: {
    fontSize: 12,
    color: '#c0392b',
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 'auto',
    paddingTop: 16,
  },
  serieText: {
    fontSize: 9,
    color: '#999999',
  },
  assinaturaBox: {
    alignItems: 'center',
  },
  linhaAssinatura: {
    borderTop: '1px solid #333333',
    width: 180,
    marginBottom: 4,
  },
  assinaturaLabel: {
    fontSize: 11,
    color: '#333333',
    textAlign: 'center',
  },
  assinaturaSubLabel: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  tipoBadge: {
    fontSize: 10,
    color: '#1a3a5c',
    backgroundColor: '#e8eef5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
})

function formatarDataPDF(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

export function CertificadoPDF({ dados }: { dados: CertificadoPDFData }) {
  return (
    <Document
      title={`Certificado — ${dados.nome_aluno}`}
      author="Eleva Brasil Treinamentos"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outer}>

          {/* Cabeçalho: logo + foto */}
          <View style={styles.headerRow}>
            <Image
              src={`${typeof window !== 'undefined' ? window.location.origin : ''}/assets/img/logo.jpg`}
              style={styles.logo}
            />
            {dados.foto_url && (
              <Image
                src={dados.foto_url}
                style={styles.fotoAluno}
              />
            )}
          </View>

          <Text style={styles.titulo}>CERTIFICADO</Text>
          <Text style={styles.subtitulo}>de Conclusão de Treinamento</Text>

          <Text style={styles.textoNormal}>Certificamos que</Text>
          <Text style={styles.nomeAluno}>{dados.nome_aluno}</Text>
          {dados.cpf_aluno && (
            <Text style={styles.cpf}>CPF: {dados.cpf_aluno}</Text>
          )}

          <Text style={styles.textoNormal}>concluiu com êxito o treinamento</Text>
          <Text style={styles.nomeCurso}>{dados.nome_curso}</Text>

          {dados.nr_referencia && (
            <Text style={styles.nrBadge}>
              {dados.nr_referencia}
              {dados.carga_horaria ? `  —  Carga Horária: ${dados.carga_horaria}h` : ''}
            </Text>
          )}
          {!dados.nr_referencia && dados.carga_horaria && (
            <Text style={styles.nrBadge}>Carga Horária: {dados.carga_horaria}h</Text>
          )}

          <View style={styles.datasRow}>
            <Text style={styles.dataTexto}>
              Emitido em {formatarDataPDF(dados.data_emissao)}
            </Text>
            {dados.data_validade && (
              <>
                <Text style={styles.dataTexto}>  |  </Text>
                <Text style={styles.dataTexto}>
                  Válido até{' '}
                  <Text style={styles.dataValidade}>{formatarDataPDF(dados.data_validade)}</Text>
                </Text>
              </>
            )}
          </View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.serieText}>Nº de Série: {dados.numero_serie}</Text>
              <Text style={[styles.tipoBadge, { marginTop: 4 }]}>
                {dados.tipo === 'completo'
                  ? 'Certificado Completo (Teórico + Prático)'
                  : dados.tipo === 'presencial'
                  ? 'Certificado Presencial'
                  : 'Certificado Teórico'}
              </Text>
            </View>
            <View style={styles.assinaturaBox}>
              <View style={styles.linhaAssinatura} />
              <Text style={styles.assinaturaLabel}>
                {dados.instrutor ?? 'Responsável Técnico'}
              </Text>
              <Text style={styles.assinaturaSubLabel}>Eleva Brasil Treinamentos</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  )
}
