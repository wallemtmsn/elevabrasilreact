import { supabase } from '@/lib/supabase'
import type { Pergunta } from '@/types'

export interface PerguntaAdmin extends Pergunta {
  aulas: { titulo: string; modulos: { titulo: string; cursos: { id: string; titulo: string } } }
}

export const perguntasService = {
  async getAll(): Promise<PerguntaAdmin[]> {
    const { data, error } = await supabase
      .from('perguntas_aulas')
      .select(`
        *,
        profiles:aluno_id(nome),
        respondido_por_profile:respondido_por(nome),
        aulas(titulo, modulos(titulo, cursos(id, titulo)))
      `)
      .order('criado_em', { ascending: false })
    if (error) throw error
    return (data ?? []) as PerguntaAdmin[]
  },

  async getByAula(aulaId: string): Promise<Pergunta[]> {
    const { data, error } = await supabase
      .from('perguntas_aulas')
      .select('*, profiles:aluno_id(nome), respondido_por_profile:respondido_por(nome)')
      .eq('aula_id', aulaId)
      .order('criado_em', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async fazer(aulaId: string, alunoId: string, pergunta: string): Promise<void> {
    const { error } = await supabase
      .from('perguntas_aulas')
      .insert({ aula_id: aulaId, aluno_id: alunoId, pergunta })
    if (error) throw error
  },

  async responder(id: string, resposta: string, respondidoPor: string): Promise<void> {
    const { error } = await supabase
      .from('perguntas_aulas')
      .update({ resposta, respondido_por: respondidoPor, respondido_em: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('perguntas_aulas')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
