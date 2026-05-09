export interface Profile {
  id: string
  nome: string
  cpf: string
  telefone: string
  empresa?: string | null
  cargo?: string | null
  bio?: string | null
  foto_url?: string | null
  role: 'aluno' | 'admin'
  criado_em: string
  atualizado_em: string
}

export interface ProfileWithEmail extends Profile {
  email: string
}

export interface Curso {
  id: string
  titulo: string
  descricao?: string | null
  carga_horaria?: number | null
  valor?: number | null
  video_url?: string | null
  ativo: boolean
  nr_referencia?: string | null
  exige_pratico: boolean
  validade_meses: number
  conteudo_programatico?: string | null
  criado_em: string
  atualizado_em: string
}

export interface Matricula {
  id: string
  aluno_id: string
  curso_id: string
  liberado_em: string
  liberado_por?: string | null
  teorico_concluido: boolean
  teorico_data?: string | null
  pratico_concluido: boolean
  pratico_data?: string | null
  certificado_emitido: boolean
  certificado_id?: string | null
}

export interface Certificado {
  id: string
  // FKs nulas em certificados presenciais (sem matrícula vinculada)
  matricula_id: string | null
  aluno_id: string | null
  curso_id: string | null
  numero_serie: string
  data_emissao: string
  data_validade?: string | null
  tipo: 'teorico' | 'completo' | 'presencial'
  criado_em: string
  // Snapshot de dados quando tipo='presencial'
  nome_aluno_avulso?: string | null
  cpf_aluno_avulso?: string | null
  nome_curso_avulso?: string | null
  nr_referencia_avulso?: string | null
  carga_horaria_avulso?: number | null
  instrutor_avulso?: string | null
  documento_instrutor_avulso?: string | null
  data_inicio_avulso?: string | null
  data_fim_avulso?: string | null
  conteudo_programatico_avulso?: string | null
  emitido_por?: string | null
  pdf_url?: string | null
}

export interface CertificadoAdmin extends Certificado {
  aluno?: { nome: string; cpf: string; foto_url?: string | null } | null
  curso?: {
    titulo: string
    nr_referencia?: string | null
    carga_horaria?: number | null
    conteudo_programatico?: string | null
  } | null
}

export interface MatriculaComCert {
  matricula_id: string
  aluno_id: string
  aluno_nome: string
  aluno_cpf: string
  curso_id: string
  curso_titulo: string
  nr_referencia?: string | null
  liberado_em: string
  cert_id?: string | null
  pdf_url?: string | null
  data_emissao?: string | null
}

export interface MetricasCertificados {
  total: number
  hoje: number
  esta_semana: number
  este_mes: number
}

export interface MatriculaPendente {
  matricula_id: string
  aluno_id: string
  nome: string
  cpf: string
  email?: string | null
  telefone?: string | null
  curso_id: string
  curso_nome: string
  nr_referencia?: string | null
  teorico_data?: string | null
  dias_aguardando: number
}

export interface MatriculaTeoricoOk {
  matricula_id: string
  aluno_id: string
  nome: string
  cpf: string
  curso_id: string
  curso_nome: string
  nr_referencia?: string | null
  exige_pratico: boolean
  teorico_data?: string | null
  pratico_concluido: boolean
  certificado_emitido: boolean
  certificado_id?: string | null
}

export interface Modulo {
  id: string
  curso_id: string
  titulo: string
  ordem: number
  aulas?: Aula[]
  criado_em: string
  atualizado_em: string
}

export interface Aula {
  id: string
  modulo_id: string
  titulo: string
  descricao?: string | null
  video_url?: string | null
  duracao_min?: number | null
  ordem: number
  criado_em: string
  atualizado_em: string
}

export interface ProgressoAula {
  id: string
  aluno_id: string
  aula_id: string
  concluida: boolean
  concluida_em?: string | null
}

export interface ProgressoAluno {
  aluno_id: string
  aluno_nome: string
  aluno_cpf: string
  matricula_id: string
  curso_id: string
  curso_titulo: string
  nr_referencia: string | null
  liberado_em: string
  total_aulas: number
  aulas_concluidas: number
  progresso_pct: number
  teorico_concluido: boolean
  pratico_concluido: boolean
  certificado_emitido: boolean
}

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

export interface AuthUser {
  id: string
  email: string
}

export interface Prova {
  id: string
  modulo_id: string
  titulo: string
  criado_em: string
  questoes?: Questao[]
}

export interface Questao {
  id: string
  prova_id: string
  enunciado: string
  alternativas: { A: string; B: string; C: string; D: string }
  resposta_certa?: 'A' | 'B' | 'C' | 'D' // só presente no contexto admin; nunca exposto ao aluno
  ordem: number
}

export interface TentativaProva {
  id: string
  aluno_id: string
  prova_id: string
  respostas: Record<string, string>
  acertos: number
  total: number
  aprovado: boolean
  feita_em: string
  questoes_corretas?: string[] // IDs das questões acertadas, retornados pela RPC server-side
}

export interface Pergunta {
  id: string
  aula_id: string
  aluno_id: string
  pergunta: string
  resposta?: string | null
  respondido_por?: string | null
  respondido_em?: string | null
  criado_em: string
  profiles?: { nome: string } | null
  respondido_por_profile?: { nome: string } | null
}
