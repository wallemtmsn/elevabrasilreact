import { useState } from 'react'
import type { Modulo } from '@/types'

interface Props {
  modulos: Modulo[]
}

function formatMinutos(min: number): string {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function ModuloAccordion({ modulos }: Props) {
  const [abertos, setAbertos] = useState<Set<string>>(
    new Set(modulos.slice(0, 2).map(m => m.id))
  )

  const totalAulas = modulos.reduce((acc, m) => acc + (m.aulas?.length ?? 0), 0)
  const totalMinutos = modulos.reduce(
    (acc, m) => acc + (m.aulas?.reduce((a, aula) => a + (aula.duracao_min ?? 0), 0) ?? 0),
    0
  )

  function toggle(id: string) {
    setAbertos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTodos() {
    if (abertos.size === modulos.length) {
      setAbertos(new Set())
    } else {
      setAbertos(new Set(modulos.map(m => m.id)))
    }
  }

  return (
    <div>
      {/* Header com totais */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-steel-600">
          <span className="font-medium text-steel-800">{modulos.length}</span> seções •{' '}
          <span className="font-medium text-steel-800">{totalAulas}</span> aulas •{' '}
          <span className="font-medium text-steel-800">{formatMinutos(totalMinutos)}</span> no total
        </p>
        <button
          onClick={toggleTodos}
          className="text-sm text-navy-600 hover:text-navy-800 underline underline-offset-2 transition-colors"
        >
          {abertos.size === modulos.length ? 'Recolher tudo' : 'Expandir tudo'}
        </button>
      </div>

      {/* Lista de módulos */}
      <div className="border border-steel-200 rounded-xl overflow-hidden divide-y divide-steel-200">
        {modulos.map(modulo => {
          const isAberto = abertos.has(modulo.id)
          const aulasMod = modulo.aulas ?? []
          const minMod = aulasMod.reduce((a, aula) => a + (aula.duracao_min ?? 0), 0)

          return (
            <div key={modulo.id}>
              {/* Cabeçalho do módulo */}
              <button
                onClick={() => toggle(modulo.id)}
                className="w-full flex items-center justify-between px-5 py-4 bg-steel-50 hover:bg-steel-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-steel-500 transition-transform duration-200 ${isAberto ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="font-semibold text-steel-800 font-heading text-sm">
                    {modulo.titulo}
                  </span>
                </div>
                <span className="text-xs text-steel-500 ml-4 shrink-0">
                  {aulasMod.length} aula{aulasMod.length !== 1 ? 's' : ''} • {formatMinutos(minMod)}
                </span>
              </button>

              {/* Lista de aulas */}
              {isAberto && aulasMod.length > 0 && (
                <ul className="divide-y divide-steel-100">
                  {aulasMod.map(aula => (
                    <li
                      key={aula.id}
                      className="flex items-center gap-3 px-5 py-3 bg-white"
                    >
                      {/* Ícone play */}
                      <svg
                        className="w-4 h-4 text-steel-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                        />
                      </svg>
                      <span className="text-sm text-steel-700 flex-1">{aula.titulo}</span>
                      {aula.duracao_min != null && aula.duracao_min > 0 && (
                        <span className="text-xs text-steel-400 shrink-0">
                          {formatMinutos(aula.duracao_min)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isAberto && aulasMod.length === 0 && (
                <div className="px-5 py-4 bg-white text-sm text-steel-400 italic">
                  Nenhuma aula cadastrada neste módulo.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
