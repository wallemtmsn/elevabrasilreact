import { useState, FormEvent, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { profileService } from '@/services/profileService'
import { Button, Input, Avatar } from '@/components/ui'
import { sanitizeInput } from '@/utils/formatters'

export function Perfil() {
  const { profile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nome: profile?.nome || '',
    telefone: profile?.telefone || '',
    empresa: profile?.empresa || '',
    cargo: profile?.cargo || '',
    bio: profile?.bio || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  if (!profile) return null

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async (evt: FormEvent) => {
    evt.preventDefault()
    if (!form.nome.trim()) { showToast('Nome obrigatório.', 'error'); return }
    setSaving(true)
    try {
      await profileService.update(profile.id, {
        nome: sanitizeInput(form.nome.trim()),
        telefone: form.telefone,
        empresa: sanitizeInput(form.empresa.trim()),
        cargo: sanitizeInput(form.cargo.trim()),
        bio: sanitizeInput(form.bio.trim()),
      })
      await refreshProfile()
      showToast('Perfil atualizado!', 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Imagem muito grande. Máx. 2 MB.', 'error'); return }
    setUploading(true)
    try {
      const url = await profileService.uploadAvatar(profile.id, file)
      await profileService.updateAvatar(profile.id, url)
      await refreshProfile()
      showToast('Foto atualizada!', 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao enviar foto.', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setRemoving(true)
    try {
      await profileService.removeAvatar(profile.id)
      await refreshProfile()
      showToast('Foto removida.', 'info')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover foto.', 'error')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="font-montserrat text-xl font-bold text-steel-800">Meu Perfil</h2>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-steel-200 p-6">
        <h3 className="font-semibold text-steel-700 mb-4 text-sm">Foto de perfil</h3>
        <div className="flex items-center gap-4">
          <Avatar nome={profile.nome} fotoUrl={profile.foto_url} size="xl" />
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <Button size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>
              {uploading ? 'Enviando...' : 'Alterar foto'}
            </Button>
            {profile.foto_url && (
              <Button size="sm" variant="ghost" onClick={handleRemoveAvatar} loading={removing}>
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-steel-200 p-6">
        <h3 className="font-semibold text-steel-700 mb-4 text-sm">Informações pessoais</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="Nome completo" value={form.nome} onChange={set('nome')} />
          <Input label="Telefone" value={form.telefone} onChange={set('telefone')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Empresa" value={form.empresa} onChange={set('empresa')} />
            <Input label="Cargo" value={form.cargo} onChange={set('cargo')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="lbl">Bio</label>
            <textarea
              value={form.bio}
              onChange={set('bio')}
              rows={3}
              className="inp resize-none"
              placeholder="Conte um pouco sobre você..."
            />
          </div>
          <Button type="submit" loading={saving}>
            Salvar alterações
          </Button>
        </form>
      </div>
    </div>
  )
}
