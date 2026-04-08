import { supabase } from '@/lib/supabase'
import type { Curso } from '@/types'

export const cursosService = {
  async getById(id: string): Promise<Curso | null> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async getAtivos(): Promise<Curso[]> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },

  async getAll(): Promise<Curso[]> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },

  async countAtivos(): Promise<number> {
    const { count, error } = await supabase
      .from('cursos')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true)
    if (error) throw new Error(error.message)
    return count ?? 0
  },

  async create(payload: Omit<Curso, 'id' | 'criado_em' | 'atualizado_em'>): Promise<void> {
    const { error } = await supabase.from('cursos').insert(payload)
    if (error) throw new Error(error.message)
  },

  async update(id: string, payload: Partial<Omit<Curso, 'id' | 'criado_em' | 'atualizado_em'>>): Promise<void> {
    const { error } = await supabase.from('cursos').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('cursos').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
