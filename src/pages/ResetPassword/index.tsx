import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({})

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const validate = () => {
    const e: typeof errors = {}
    if (newPassword.length < 6) e.newPassword = 'Mínimo de 6 caracteres.'
    if (newPassword !== confirmPassword) e.confirmPassword = 'As senhas não coincidem.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
      setDone(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 via-navy-600 to-navy-500 flex items-center justify-center px-4 py-12">

      {/* Card */}
      <div className="w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/assets/img/logo2.png"
            alt="Eleva Brasil"
            className="h-14 object-contain drop-shadow-lg"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header strip */}
          <div className="bg-gradient-to-r from-navy-500 to-navy-600 px-8 py-6 flex items-center gap-4">
            <div className="bg-white/20 rounded-xl p-3">
              <KeyRound className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-white font-heading font-bold text-xl leading-tight">
                {done ? 'Senha alterada!' : 'Criar nova senha'}
              </h1>
              <p className="text-navy-200 text-sm mt-0.5">
                {done ? 'Tudo pronto para entrar.' : 'Eleva Brasil — Área do Aluno'}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8">

            {/* Sucesso */}
            {done && (
              <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
                <div className="bg-green-50 rounded-full p-4">
                  <CheckCircle2 className="text-green-500" size={48} />
                </div>
                <div>
                  <p className="text-steel-700 font-medium text-lg">Senha atualizada com sucesso!</p>
                  <p className="text-steel-500 text-sm mt-1">
                    Você já pode entrar na sua conta com a nova senha.
                  </p>
                </div>
                <Button fullWidth size="lg" onClick={() => navigate('/')}>
                  Ir para o login
                </Button>
              </div>
            )}

            {/* Aguardando token */}
            {!done && !ready && (
              <div className="flex flex-col items-center gap-4 text-center py-4 animate-fade-in">
                <div className="flex items-center gap-2 text-steel-400">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">Verificando link de recuperação…</span>
                </div>
                <p className="text-steel-400 text-xs">
                  Se chegou aqui por engano,{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-navy-500 hover:underline font-medium"
                  >
                    volte ao início
                  </button>
                  .
                </p>
              </div>
            )}

            {/* Formulário */}
            {!done && ready && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-fade-in" noValidate>
                <p className="text-steel-500 text-sm">
                  Escolha uma senha segura com pelo menos 6 caracteres.
                </p>

                <Input
                  label="Nova senha"
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setErrors(v => ({ ...v, newPassword: undefined })) }}
                  error={errors.newPassword}
                  autoComplete="new-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="text-steel-400 hover:text-steel-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />

                <Input
                  label="Confirmar nova senha"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(v => ({ ...v, confirmPassword: undefined })) }}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="text-steel-400 hover:text-steel-600 focus:outline-none"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />

                <Button type="submit" loading={loading} fullWidth size="lg" className="mt-1">
                  Salvar nova senha
                </Button>
              </form>
            )}

          </div>

          {/* Footer */}
          {!done && (
            <div className="border-t border-steel-100 px-8 py-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-sm text-steel-400 hover:text-navy-500 transition-colors"
              >
                <ArrowLeft size={15} />
                Voltar ao início
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-navy-200/60 text-xs mt-6">
          © {new Date().getFullYear()} Eleva Brasil. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
