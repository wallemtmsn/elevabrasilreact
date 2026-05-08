import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Svg,
  Path,
  Circle,
} from '@react-pdf/renderer'
import { LOGO_BASE64 } from './logoBase64'
import { ALLURA_BASE64 } from './signatureFontBase64'

// Allura embedded como base64 — evita fetch externo bloqueado por CSP.
Font.register({
  family: 'Allura',
  src: ALLURA_BASE64,
})

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
  documento_instrutor?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  conteudo_programatico?: string | null
}

// Dados fixos da empresa — futuramente viriam de configuração.
const EMPRESA = {
  nome:    'Eleva Brasil Treinamentos',
  cnpj:    '52.124.269/0001-93',
  inscricao: '7781452',
  endereco: 'Av. Liberdade, 43 — Grumari, São João da Barra/RJ',
  telefone: '(22) 9 9858-8802',
  email:   'elevabrasiltreinamentos@gmail.com',
}

const NAVY  = '#1a3a5c'
const ORANGE = '#e67e22'
const TEXT  = '#333333'
const MUTED = '#666666'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: '14mm',
    fontFamily: 'Helvetica',
    position: 'relative',
  },

  // Borda decorativa externa (filete laranja duplo)
  bordaExterna: {
    position: 'absolute',
    top: '8mm',
    left: '8mm',
    right: '8mm',
    bottom: '8mm',
    border: `3px solid ${ORANGE}`,
  },
  bordaInterna: {
    position: 'absolute',
    top: '11mm',
    left: '11mm',
    right: '11mm',
    bottom: '11mm',
    border: `1px solid ${ORANGE}`,
  },

  // Watermark da logo (semi-transparente, atrás do conteúdo)
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '60%',
    height: 'auto',
    opacity: 0.05,
  },

  conteudo: {
    padding: '14mm',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logo: { height: 38, width: 'auto', objectFit: 'contain' },
  registro: {
    fontSize: 9,
    color: MUTED,
  },

  tituloBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 18,
  },
  tituloLinha: {
    flex: 1,
    height: 1,
    backgroundColor: NAVY,
    marginTop: 4,
  },
  tituloTexto: {
    fontSize: 28,
    color: NAVY,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textAlign: 'center',
  },

  corpo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragrafo: {
    fontSize: 13,
    color: TEXT,
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: '85%',
    lineHeight: 1.4,
  },
  destaque: {
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },

  // Rodapé com 2 assinaturas (instrutor + aluno)
  assinaturas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: 14,
  },
  assinaturaCol: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '38%',
  },
  // Nome do instrutor renderizado em fonte caligráfica, simulando assinatura
  assinaturaScript: {
    fontFamily: 'Allura',
    fontSize: 32,
    color: NAVY,
    marginBottom: -2,
    textAlign: 'center',
    lineHeight: 0.95,
  },
  linhaAssinatura: {
    width: '100%',
    borderTop: `1px solid ${TEXT}`,
    marginBottom: 4,
  },
  rotuloRole: {
    fontSize: 10,
    color: TEXT,
    fontFamily: 'Helvetica-Bold',
  },
  rotuloDoc: {
    fontSize: 9,
    color: MUTED,
  },

  // Nº série + selo lateral inferior
  serieText: {
    fontSize: 8,
    color: MUTED,
    position: 'absolute',
    bottom: '10mm',
    left: '14mm',
  },

  // === PÁGINA 2 ===
  topVerso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cargaHorariaTexto: {
    fontSize: 10,
    color: MUTED,
    marginBottom: 6,
  },
  programaContainer: {
    paddingHorizontal: 8,
    marginTop: 8,
    flex: 1,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 6,
  },
  bulletDot: {
    width: 8,
    fontSize: 11,
    color: ORANGE,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.35,
  },
  rodapeVerso: {
    paddingTop: 8,
    borderTop: `1px solid ${ORANGE}`,
    marginTop: 10,
  },
  rodapeLinha: {
    fontSize: 9,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 1,
  },
  rodapeAssinatura: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
})

function formatarDataPDF(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch {
    return iso
  }
}

// Quebra texto livre em itens (1 linha = 1 bullet); ignora linhas vazias.
function parseConteudoProgramatico(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map(s => s.trim().replace(/^[-•·*]\s*/, ''))
    .filter(s => s.length > 0)
}

// Selo circular ornamental (top-right da página 2)
function SeloCargaHoraria() {
  return (
    <Svg width="80" height="80" viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="36" stroke={ORANGE} strokeWidth="2" fill="none" />
      <Circle cx="40" cy="40" r="30" stroke={ORANGE} strokeWidth="0.8" fill="none" />
      <Path d="M 40 16 L 44 32 L 40 38 L 36 32 Z" fill={ORANGE} />
      <Path d="M 40 64 L 44 48 L 40 42 L 36 48 Z" fill={ORANGE} />
    </Svg>
  )
}

export function CertificadoPDF({ dados }: { dados: CertificadoPDFData }) {
  const cargaHorariaText = dados.carga_horaria ? `${dados.carga_horaria}h` : ''
  const itensPrograma = dados.conteudo_programatico
    ? parseConteudoProgramatico(dados.conteudo_programatico)
    : []
  const temVerso = itensPrograma.length > 0

  const periodoTexto = dados.data_inicio && dados.data_fim
    ? `Realizado: ${formatarDataPDF(dados.data_inicio)} a ${formatarDataPDF(dados.data_fim)}.`
    : null

  return (
    <Document
      title={`Certificado — ${dados.nome_aluno}`}
      author={EMPRESA.nome}
    >
      {/* ============================================================ */}
      {/* PÁGINA 1 — FRENTE                                           */}
      {/* ============================================================ */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.bordaExterna} />
        <View style={styles.bordaInterna} />
        <Image src={LOGO_BASE64} style={styles.watermark} />

        <View style={styles.conteudo}>
          <View style={styles.topRow}>
            <Image src={LOGO_BASE64} style={styles.logo} />
            <Text style={styles.registro}>Registro: {dados.numero_serie}</Text>
          </View>

          <View style={styles.tituloBox}>
            <View style={styles.tituloLinha} />
            <Text style={styles.tituloTexto}>CERTIFICADO DE CAPACITAÇÃO</Text>
            <View style={styles.tituloLinha} />
          </View>

          <View style={styles.corpo}>
            <Text style={styles.paragrafo}>
              Certificamos que <Text style={styles.destaque}>{dados.nome_aluno}</Text>
              {dados.cpf_aluno ? `  CPF: ${dados.cpf_aluno}` : ''}
            </Text>

            <Text style={styles.paragrafo}>
              Concluiu o curso de <Text style={styles.destaque}>{dados.nome_curso}</Text>
              {dados.nr_referencia ? `  ${dados.nr_referencia}` : ''}
            </Text>

            {cargaHorariaText && (
              <Text style={styles.paragrafo}>
                Carga horária de <Text style={styles.destaque}>{cargaHorariaText}</Text>
                {' '}na <Text style={styles.destaque}>{EMPRESA.nome}</Text>
              </Text>
            )}

            {periodoTexto && (
              <Text style={styles.paragrafo}>
                {periodoTexto}{' '}
                Concluído {formatarDataPDF(dados.data_fim ?? dados.data_emissao)}
              </Text>
            )}
            {!periodoTexto && (
              <Text style={styles.paragrafo}>
                Concluído em {formatarDataPDF(dados.data_emissao)}
              </Text>
            )}

            {dados.nr_referencia && (
              <Text style={styles.paragrafo}>
                Treinamento em conformidade com a {dados.nr_referencia}
              </Text>
            )}

            <Text style={styles.paragrafo}>Válido em todo território nacional</Text>

            {dados.data_validade && (
              <Text style={[styles.paragrafo, { fontSize: 11, color: MUTED, marginTop: 4 }]}>
                Validade do certificado: {formatarDataPDF(dados.data_validade)}
              </Text>
            )}
          </View>

          <View style={styles.assinaturas}>
            <View style={styles.assinaturaCol}>
              <Text style={styles.assinaturaScript}>{dados.instrutor ?? '—'}</Text>
              <View style={styles.linhaAssinatura} />
              <Text style={styles.rotuloRole}>Instrutor</Text>
              {dados.documento_instrutor && (
                <Text style={styles.rotuloDoc}>{dados.documento_instrutor}</Text>
              )}
            </View>
            <View style={styles.assinaturaCol}>
              <Text style={[styles.assinaturaScript, { color: '#cccccc' }]}> </Text>
              <View style={styles.linhaAssinatura} />
              <Text style={styles.rotuloRole}>Aluno</Text>
            </View>
          </View>
        </View>

        <Text style={styles.serieText}>
          {dados.tipo === 'completo'
            ? 'Certificado Completo (Teórico + Prático)'
            : dados.tipo === 'presencial'
            ? 'Certificado Presencial'
            : 'Certificado Teórico'}
        </Text>
      </Page>

      {/* ============================================================ */}
      {/* PÁGINA 2 — VERSO (só renderiza se houver conteúdo)           */}
      {/* ============================================================ */}
      {temVerso && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.bordaExterna} />
          <View style={styles.bordaInterna} />

          <View style={styles.conteudo}>
            <View style={styles.topVerso}>
              <View style={{ flex: 1 }}>
                <View style={styles.tituloBox}>
                  <View style={styles.tituloLinha} />
                  <Text style={styles.tituloTexto}>CONTEÚDO PROGRAMÁTICO</Text>
                  <View style={styles.tituloLinha} />
                </View>
                {cargaHorariaText && (
                  <Text style={styles.cargaHorariaTexto}>
                    Carga Horária: {cargaHorariaText}
                  </Text>
                )}
                {dados.nr_referencia && (
                  <Text style={[styles.cargaHorariaTexto, { color: ORANGE, fontFamily: 'Helvetica-Bold' }]}>
                    {dados.nr_referencia} — {dados.nome_curso}
                  </Text>
                )}
              </View>
              {dados.carga_horaria && (
                <View style={{ marginRight: 8 }}>
                  <SeloCargaHoraria />
                  <Text style={{ fontSize: 8, color: ORANGE, textAlign: 'center', marginTop: -8 }}>
                    {cargaHorariaText} CERTIFICADO
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.programaContainer}>
              {itensPrograma.map((item, idx) => (
                <View key={idx} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.rodapeAssinatura}>
              <View style={[styles.assinaturaCol, { width: '32%' }]}>
                <Text style={styles.assinaturaScript}>{dados.instrutor ?? '—'}</Text>
                <View style={styles.linhaAssinatura} />
                <Text style={styles.rotuloRole}>Instrutor</Text>
                {dados.documento_instrutor && (
                  <Text style={styles.rotuloDoc}>{dados.documento_instrutor}</Text>
                )}
              </View>
            </View>

            <View style={styles.rodapeVerso}>
              <Text style={styles.rodapeLinha}>
                Treinamento realizado por {EMPRESA.nome}
              </Text>
              <Text style={styles.rodapeLinha}>
                CNPJ: {EMPRESA.cnpj}  ·  Inscrição: {EMPRESA.inscricao}
              </Text>
              <Text style={styles.rodapeLinha}>{EMPRESA.endereco}</Text>
              <Text style={styles.rodapeLinha}>
                {EMPRESA.telefone}  ·  {EMPRESA.email}
              </Text>
            </View>
          </View>
        </Page>
      )}
    </Document>
  )
}
