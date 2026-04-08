import { supabase } from '@/lib/supabase'

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  },

  async register(email: string, password: string, profileData: {
    nome: string
    cpf: string
    telefone: string
  }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Confirme seu e-mail antes de continuar.')

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user!.id,
      nome: profileData.nome,
      cpf: profileData.cpf.replace(/\D/g, ''),
      telefone: profileData.telefone,
    })

    if (profileError) {
      if (profileError.message.includes('cpf')) throw new Error('CPF já cadastrado.')
      throw new Error(profileError.message)
    }

    return data
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  },

  async reauthenticate(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Senha atual incorreta.')
  },
}
