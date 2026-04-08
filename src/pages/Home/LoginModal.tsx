import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { authService } from '@/services/authService'
import { isValidEmail } from '@/utils/validators'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export function LoginModal({ open, onClose, onSwitchToRegister }: LoginModalProps) {
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // Quando o AuthContext confirmar o login (user setado), fecha o modal e redireciona
  useEffect(() => {
    if (user && loading) {
      setLoading(false)
      showToast('Bem-vindo(a) de volta!', 'success')
      onClose()
      navigate(isAdmin ? '/admin' : '/painel')
    }
  }, [user])

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
      // Redirecionamento feito pelo useEffect acima quando user for setado
    } catch (err: unknown) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : 'Erro ao entrar.'
      showToast(msg.includes('Invalid') ? 'E-mail ou senha incorretos.' : msg, 'error')
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setErrors({})
    setLoading(false)
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
