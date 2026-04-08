import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Input } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { authService } from '@/services/authService'
import { isValidEmail } from '@/utils/validators'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export function LoginModal({ open, onClose, onSwitchToRegister }: LoginModalProps) {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!isValidEmail(email)) e.email = 'E-mail inválido.'
    if (!password) e.password = 'Digite sua senha.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authService.login(email, password)
      showToast('Bem-vindo(a) de volta!', 'success')
      onClose()
      navigate('/painel')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar.'
      showToast(msg.includes('Invalid') ? 'E-mail ou senha incorretos.' : msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setErrors({})
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Entrar na sua conta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        <Button type="submit" loading={loading} fullWidth className="mt-2">
          Entrar
        </Button>

        <p className="text-center text-sm text-steel-500">
          Não tem conta?{' '}
          <button
            type="button"
            onClick={() => { handleClose(); onSwitchToRegister() }}
            className="text-navy-500 font-medium hover:underline"
          >
            Cadastre-se
          </button>
        </p>
      </form>
    </Modal>
  )
}
