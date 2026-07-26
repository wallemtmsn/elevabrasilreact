import { supabase } from '@/lib/supabase'
import type { Modulo, Aula, ProgressoAula } from '@/types'

// ─── types ───────────────────────────────────────────────────────────────────

type ModuloPayload = { titulo: string; ordem: number }
type AulaPayload = {
  titulo: string
  descricao?: string | null
  video_url?: string | null
  duracao_min?: number | null
  ordem: number
}

// ─── service ─────────────────────────────────────────────────────────────────

export const modulosService = {
  // ── read ─────────────────────────────────────────────────────────────────

  async getModulosByCurso(cursoId: string): Promise<Modulo[]> {
    const { data, error } = await supabase
      .from('modulos')
      .select('*, aulas(*)')
      .eq('curso_id', cursoId)
      .order('ordem', { ascending: true })
      .order('id', { ascending: true })

    if (error) throw new Error(error.message)

    return (data || []).map(m => ({
      ...m,
      aulas: ((m.aulas || []) as Aula[]).sort((a, b) => a.ordem - b.ordem),
    }))
  },

  async getProgresso(alunoId: string, aulaIds: string[]): Promise<ProgressoAula[]> {
    if (aulaIds.length === 0) return []

    const { data, error } = await supabase
      .from('progresso_aulas')
      .select('*')
      .eq('aluno_id', alunoId)
      .in('aula_id', aulaIds)

    if (error) throw new Error(error.message)
    return data || []
  },

  // ── módulo CRUD ───────────────────────────────────────────────────────────

  async createModulo(cursoId: string, payload: ModuloPayload): Promise<void> {
    const { error } = await supabase
      .from('modulos')
      .insert({ curso_id: cursoId, ...payload })
    if (error) throw new Error(error.message)
  },

  async updateModulo(id: string, payload: Partial<ModuloPayload>): Promise<void> {
    const { error } = await supabase
      .from('modulos')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deleteModulo(id: string): Promise<void> {
    const { error } = await supabase.from('modulos').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  // ── aula CRUD ─────────────────────────────────────────────────────────────

  async createAula(moduloId: string, payload: AulaPayload): Promise<void> {
    const { error } = await supabase
      .from('aulas')
      .insert({ modulo_id: moduloId, ...payload })
    if (error) throw new Error(error.message)
  },

  async updateAula(id: string, payload: Partial<AulaPayload>): Promise<void> {
    const { error } = await supabase
      .from('aulas')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deleteAula(id: string): Promise<void> {
    const { error } = await supabase.from('aulas').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  // ── reordering ────────────────────────────────────────────────────────────

  async swapOrdemModulos(a: Modulo, b: Modulo): Promise<void> {
    await Promise.all([
      supabase.from('modulos').update({ ordem: b.ordem }).eq('id', a.id),
      supabase.from('modulos').update({ ordem: a.ordem }).eq('id', b.id),
    ])
  },

  async swapOrdemAulas(a: Aula, b: Aula): Promise<void> {
    await Promise.all([
      supabase.from('aulas').update({ ordem: b.ordem }).eq('id', a.id),
      supabase.from('aulas').update({ ordem: a.ordem }).eq('id', b.id),
    ])
  },

  // ── progresso ─────────────────────────────────────────────────────────────

  async marcarConcluida(aulaId: string): Promise<void> {
    // Validação de pré-requisitos (módulo anterior concluído + prova aprovada,
    // se houver) acontece no servidor — evita bypass via chamada direta à API.
    const { error } = await supabase.rpc('marcar_aula_concluida', { p_aula_id: aulaId })
    if (error) throw new Error(error.message)
  },

  async desmarcarConcluida(alunoId: string, aulaId: string): Promise<void> {
    const { error } = await supabase
      .from('progresso_aulas')
      .upsert(
        { aluno_id: alunoId, aula_id: aulaId, concluida: false, concluida_em: null },
        { onConflict: 'aluno_id,aula_id' }
      )
    if (error) throw new Error(error.message)
  },
}
