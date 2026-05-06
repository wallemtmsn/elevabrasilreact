import { useState, useEffect } from 'react'
import { profileService } from '@/services/profileService'
import { cursosService } from '@/services/cursosService'
import { certificadosService } from '@/services/certificadosService'
import { formatDate } from '@/utils/formatters'
import type { ProfileWithEmail } from '@/types'

export function Dashboard() {
  const [stats, setStats] = useState({ total: 0, ultimos7: 0, ultimos30: 0, cursos: 0, certificados: 0 })
  const [recentes, setRecentes] = useState<ProfileWithEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [profiles, cursosCount, metricas] = await Promise.all([
        profileService.getAllWithEmail(),
        cursosService.countAtivos(),
        certificadosService.getMetricas().catch(() => ({ total: 0, hoje: 0, esta_semana: 0, este_mes: 0 })),
      ])
      const now = Date.now()
      const d7 = now - 7 * 86400000
      const d30 = now - 30 * 86400000
      setStats({
        total: profiles.length,
        ultimos7: profiles.filter(p => new Date(p.criado_em).getTime() > d7).length,
        ultimos30: profiles.filter(p => new Date(p.criado_em).getTime() > d30).length,
        cursos: cursosCount,
        certificados: metricas.total,
      })
      setRecentes(profiles.slice(0, 5))
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 h-24" />
        ))}
      </div>
    )
  }

  const cards = [
    { label: 'Total de alunos', value: stats.total, color: 'text-navy-500', bg: 'bg-navy-500/10' },
    { label: 'Novos (7 dias)', value: stats.ultimos7, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Novos (30 dias)', value: stats.ultimos30, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Cursos ativos', value: stats.cursos, color: 'text-brand-red', bg: 'bg-brand-red/10' },
    { label: 'Certificados emitidos', value: stats.certificados, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-montserrat text-xl font-bold text-steel-800">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-steel-200 p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <span className={`text-lg font-bold ${card.color}`}>{card.value}</span>
            </div>
            <p className="text-xs text-steel-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent signups */}
      <div className="bg-white rounded-2xl border border-steel-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-steel-100">
          <h3 className="font-semibold text-steel-700 text-sm">Cadastros recentes</h3>
        </div>
        <div className="divide-y divide-steel-100">
          {recentes.length === 0 ? (
            <p className="p-5 text-sm text-steel-400">Nenhum cadastro ainda.</p>
          ) : (
            recentes.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-steel-700 truncate">{p.nome}</p>
                  <p className="text-xs text-steel-400 truncate">{p.email}</p>
                </div>
                <span className="text-xs text-steel-400 whitespace-nowrap">{formatDate(p.criado_em)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
