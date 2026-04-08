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
  criado_em: string
  atualizado_em: string
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
