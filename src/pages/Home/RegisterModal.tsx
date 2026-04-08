import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { authService } from '@/services/authService'
import { isValidEmail, isValidCPF, isValidPhone, isStrongPassword } from '@/utils/validators'
import { formatCPF, formatPhone, sanitizeInput } from '@/utils/formatters'

interface RegisterModalProps {
  open: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

export function RegisterModal({ open, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { refreshProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ nome: '', email: '', cpf: '', telefone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (field === 'cpf') val = formatCPF(val.replace(/\D/g, ''))
    if (field === 'telefone') val = formatPhone(val)
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.nome.trim()) e.nome = 'Nome obrigatório.'
    if (!isValidEmail(form.email)) e.email = 'E-mail inválido.'
    if (!isValidCPF(form.cpf)) e.cpf = 'CPF deve ter 11 dígitos.'
    if (!isValidPhone(form.telefone)) e.telefone = 'Telefone inválido.'
    if (!isStrongPassword(form.password)) e.password = 'Mínimo 6 caracteres.'
    if (form.password !== form.confirm) e.confirm = 'As senhas não coincidem.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authService.register(form.email, form.password, {
        nome: sanitizeInput(form.nome.trim()),
        cpf: form.cpf,
        telefone: form.telefone,
      })
      await refreshProfile()
      showToast('Cadastro realizado! Bem-vindo(a)!', 'success')
      onClose()
      navigate('/painel')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm({ nome: '', email: '', cpf: '', telefone: '', password: '', confirm: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Criar conta" maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Nome completo" type="text" placeholder="João da Silva" value={form.nome} onChange={set('nome')} error={errors.nome} autoComplete="name" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="CPF" type="text" placeholder="000.000.000-00" value={form.cpf} onChange={set('cpf')} error={errors.cpf} inputMode="numeric" />
          <Input label="Telefone" type="text" placeholder="(22) 99999-9999" value={form.telefone} onChange={set('telefone')} error={errors.telefone} inputMode="tel" />
        </div>

        <Input label="E-mail" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Senha" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
          <Input label="Confirmar senha" type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        </div>

        <Button type="submit" loading={loading} fullWidth className="mt-2">
          Criar conta
        </Button>

        <p className="text-center text-sm text-steel-500">
          Já tem conta?{' '}
          <button
            type="button"
            onClick={() => { handleClose(); onSwitchToLogin() }}
            className="text-navy-500 font-medium hover:underline"
          >
            Entrar
          </button>
        </p>
      </form>
    </Modal>
  )
}
