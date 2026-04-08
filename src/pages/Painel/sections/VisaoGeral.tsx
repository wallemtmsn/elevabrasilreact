import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui'
import { formatDate } from '@/utils/formatters'

interface VisaoGeralProps {
  onNavigate: (section: string) => void
}

export function VisaoGeral({ onNavigate }: VisaoGeralProps) {
  const { profile } = useAuth()
  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome card */}
      <div className="bg-gradient-to-r from-navy-500 to-navy-600 rounded-2xl p-6 text-white flex items-center gap-4">
        <Avatar nome={profile.nome} fotoUrl={profile.foto_url} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-sm">Bem-vindo(a) de volta,</p>
          <h2 className="font-montserrat text-xl font-bold truncate">{profile.nome}</h2>
          <p className="text-white/60 text-xs mt-1">Aluno desde {formatDate(profile.criado_em)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Cursos Disponíveis', icon: '📚', action: () => onNavigate('cursos') },
          { label: 'Certificados', icon: '🎓', action: () => onNavigate('certificados') },
          { label: 'Meu Perfil', icon: '👤', action: () => onNavigate('perfil') },
        ].map(item => (
          <button
            key={item.label}
            onClick={item.action}
            className="bg-white rounded-xl p-5 border border-steel-200 hover:border-navy-300 hover:shadow-sm transition-all text-left"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-sm font-medium text-steel-700">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Profile info preview */}
      <div className="bg-white rounded-2xl border border-steel-200 p-6">
        <h3 className="font-semibold text-steel-800 mb-4">Seus dados</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: 'E-mail', value: '••••••••' },
            { label: 'CPF', value: profile.cpf ? `***.***.${profile.cpf.slice(-6, -2)}-**` : '—' },
            { label: 'Telefone', value: profile.telefone || '—' },
            { label: 'Empresa', value: profile.empresa || '—' },
          ].map(row => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <dt className="text-steel-400 text-xs">{row.label}</dt>
              <dd className="text-steel-700 font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        <button
          onClick={() => onNavigate('perfil')}
          className="mt-4 text-sm text-navy-500 font-medium hover:underline"
        >
          Editar perfil →
        </button>
      </div>
    </div>
  )
}
