import { useState, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { authService } from '@/services/authService'
import { Button, Input } from '@/components/ui'
import { isStrongPassword } from '@/utils/validators'

export function Seguranca() {
  const { profile } = useAuth()
  const { showToast } = useToast()

  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  if (!profile) return null

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.current) e.current = 'Digite a senha atual.'
    if (!isStrongPassword(form.newPass)) e.newPass = 'Mínimo 6 caracteres.'
    if (form.newPass !== form.confirm) e.confirm = 'As senhas não coincidem.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // Re-authenticate with current password before changing
      await authService.reauthenticate(profile.nome, form.current)
      await authService.updatePassword(form.newPass)
      setForm({ current: '', newPass: '', confirm: '' })
      showToast('Senha alterada com sucesso!', 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao alterar senha.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h2 className="font-montserrat text-xl font-bold text-steel-800">Segurança</h2>

      <div className="bg-white rounded-2xl border border-steel-200 p-6">
        <h3 className="font-semibold text-steel-700 mb-4 text-sm">Alterar senha</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Senha atual"
            type="password"
            placeholder="••••••••"
            value={form.current}
            onChange={set('current')}
            error={errors.current}
            autoComplete="current-password"
          />
          <Input
            label="Nova senha"
            type="password"
            placeholder="••••••••"
            value={form.newPass}
            onChange={set('newPass')}
            error={errors.newPass}
            helpText="Mínimo 6 caracteres."
            autoComplete="new-password"
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
            autoComplete="new-password"
          />
          <Button type="submit" loading={loading}>
            Alterar senha
          </Button>
        </form>
      </div>
    </div>
  )
}
