import { supabase } from '@/lib/supabase'
import type { Prova, Questao, TentativaProva } from '@/types'

export const provasService = {

  // ── Prova por módulo ────────────────────────────────────────────────────────

  async getProvaByModulo(moduloId: string): Promise<Prova | null> {
    const { data, error } = await supabase
      .from('provas_modulos')
      .select('*, questoes(*)')
      .eq('modulo_id', moduloId)
      .single()

    if (error?.code === 'PGRST116') return null // not found
    if (error) throw new Error(error.message)
    return {
      ...data,
      questoes: ((data.questoes || []) as Questao[]).sort((a, b) => a.ordem - b.ordem),
    }
  },

  // Busca provas de vários módulos de uma vez (evita N+1 no CursoPlayer)
  async getProvasByModulos(moduloIds: string[]): Promise<Prova[]> {
    if (moduloIds.length === 0) return []
    const { data, error } = await supabase
      .from('provas_modulos')
      .select('*')
      .in('modulo_id', moduloIds)

    if (error) throw new Error(error.message)
    return data || []
  },

  // ── Tentativas ──────────────────────────────────────────────────────────────

  async getTentativasAprovadas(alunoId: string, provaIds: string[]): Promise<TentativaProva[]> {
    if (provaIds.length === 0) return []
    const { data, error } = await supabase
      .from('tentativas_prova')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('aprovado', true)
      .in('prova_id', provaIds)

    if (error) throw new Error(error.message)
    return data || []
  },

  async submeterTentativa(
    alunoId: string,
    prova: Prova,
    respostas: Record<string, string>
  ): Promise<TentativaProva> {
    const questoes = prova.questoes || []
    const acertos = questoes.filter(q => respostas[q.id] === q.resposta_certa).length
    const total = questoes.length
    const aprovado = total > 0 && acertos / total >= 0.8

    const { data, error } = await supabase
      .from('tentativas_prova')
      .insert({ aluno_id: alunoId, prova_id: prova.id, respostas, acertos, total, aprovado })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // ── CRUD admin — Prova ──────────────────────────────────────────────────────

  async criarProva(moduloId: string, titulo: string): Promise<Prova> {
    const { data, error } = await supabase
      .from('provas_modulos')
      .insert({ modulo_id: moduloId, titulo })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async atualizarProva(provaId: string, titulo: string): Promise<void> {
    const { error } = await supabase
      .from('provas_modulos')
      .update({ titulo })
      .eq('id', provaId)
    if (error) throw new Error(error.message)
  },

  async deletarProva(provaId: string): Promise<void> {
    const { error } = await supabase
      .from('provas_modulos')
      .delete()
      .eq('id', provaId)
    if (error) throw new Error(error.message)
  },

  // ── CRUD admin — Questão ────────────────────────────────────────────────────

  async criarQuestao(provaId: string, payload: {
    enunciado: string
    alternativas: { A: string; B: string; C: string; D: string }
    resposta_certa: 'A' | 'B' | 'C' | 'D'
    ordem: number
  }): Promise<Questao> {
    const { data, error } = await supabase
      .from('questoes')
      .insert({ prova_id: provaId, ...payload })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async atualizarQuestao(questaoId: string, payload: {
    enunciado?: string
    alternativas?: { A: string; B: string; C: string; D: string }
    resposta_certa?: 'A' | 'B' | 'C' | 'D'
    ordem?: number
  }): Promise<void> {
    const { error } = await supabase
      .from('questoes')
      .update(payload)
      .eq('id', questaoId)
    if (error) throw new Error(error.message)
  },

  async deletarQuestao(questaoId: string): Promise<void> {
    const { error } = await supabase
      .from('questoes')
      .delete()
      .eq('id', questaoId)
    if (error) throw new Error(error.message)
  },
}
