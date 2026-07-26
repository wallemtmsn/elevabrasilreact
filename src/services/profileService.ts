import { supabase } from '@/lib/supabase'
import type { Profile, ProfileWithEmail } from '@/types'

export const profileService = {
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data
  },

  async update(id: string, payload: Partial<Pick<Profile, 'nome' | 'telefone' | 'empresa' | 'cargo' | 'bio'>>): Promise<void> {
    const { error } = await supabase.from('profiles').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async updateAvatar(id: string, fotoUrl: string): Promise<void> {
    const { error } = await supabase.from('profiles').update({ foto_url: fotoUrl }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async updateRole(id: string, role: 'aluno' | 'admin'): Promise<void> {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async delete(id: string): Promise<void> {
    // Exclusão via RPC (não DELETE direto): matriculas/certificados têm FK
    // ON DELETE NO ACTION para profiles, então um DELETE cru falharia por
    // violação de constraint para qualquer aluno com matrícula ou certificado.
    const { error } = await supabase.rpc('excluir_aluno', { p_aluno_id: id })
    if (error) throw new Error(error.message)
  },

  async getAllWithEmail(): Promise<ProfileWithEmail[]> {
    const { data, error } = await supabase.rpc('get_profiles_with_email').order('criado_em', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  },

  async removeAvatar(userId: string): Promise<void> {
    const { error: delErr } = await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.jpeg`, `${userId}/avatar.webp`])
    if (delErr) throw new Error(delErr.message)
    await profileService.updateAvatar(userId, '')
  },
}
