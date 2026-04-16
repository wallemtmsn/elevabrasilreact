import { useState, useEffect, FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
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

type View = 'login' | 'forgot'

export function LoginModal({ open, onClose, onSwitchToRegister }: LoginModalProps) {
  const { user, isAdmin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [view, setView] = useState<View>('login')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  useEffect(() => {
    if (user && loading) {
      setLoading(false)
      onClose()
      navigate(isAdmin ? '/admin' : '/painel', { state: { bemVindoDeVolta: true } })
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
    } catch (err: unknown) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : 'Erro ao entrar.'
      showToast(msg.includes('Invalid') ? 'E-mail ou senha incorretos.' : msg, 'error')
    }
  }

  const handleForgot = async (evt: FormEvent) => {
    evt.preventDefault()
    if (!isValidEmail(forgotEmail)) {
      setForgotError('E-mail inválido.')
      return
    }
    setForgotError('')
    setForgotLoading(true)
    try {
      await authService.resetPassword(forgotEmail)
      setForgotSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar.'
      setForgotError(msg)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setErrors({})
    setLoading(false)
    setView('login')
    setForgotEmail('')
    setForgotError('')
    setForgotSent(false)
    onClose()
  }

  const goToForgot = () => {
    setForgotEmail(email) // pré-preenche com o email já digitado, se houver
    setForgotError('')
    setForgotSent(false)
    setView('forgot')
  }

  if (view === 'forgot') {
    return (
      <Modal open={open} onClose={handleClose} title="Recuperar senha">
        {forgotSent ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-steel-600 text-sm">
              Enviamos um link de recuperação para <strong>{forgotEmail}</strong>.
              <br />
              Verifique sua caixa de entrada (e o spam).
            </p>
            <Button type="button" fullWidth onClick={handleClose}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-steel-500">
              Digite seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={forgotEmail}
              onChange={e => { setForgotEmail(e.target.value); setForgotError('') }}
              error={forgotError}
              autoComplete="email"
            />
            <Button type="submit" loading={forgotLoading} fullWidth>
              Enviar link de recuperação
            </Button>
            <p className="text-center text-sm text-steel-500">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-navy-500 font-medium hover:underline"
              >
                Voltar ao login
              </button>
            </p>
          </form>
        )}
      </Modal>
    )
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
        <div className="flex flex-col gap-1">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="text-steel-400 hover:text-steel-600 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={goToForgot}
              className="text-xs text-navy-500 hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

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
