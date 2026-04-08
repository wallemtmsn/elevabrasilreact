import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { matriculasService } from '@/services/matriculasService'
import { Modal } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'
import type { Curso } from '@/types'

export function Cursos() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Curso | null>(null)

  useEffect(() => {
    if (!user) return
    matriculasService.getCursosDoAluno(user.id)
      .then(setCursos)
      .catch(() => setCursos([]))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 animate-pulse border border-steel-100">
            <div className="h-4 bg-steel-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-steel-200 rounded w-full mb-2" />
            <div className="h-3 bg-steel-200 rounded w-5/6" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <h2 className="font-montserrat text-xl font-bold text-steel-800">Meus Cursos</h2>

        {cursos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-steel-200 p-12 text-center">
            <div className="w-14 h-14 bg-navy-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="font-semibold text-steel-700 mb-1">Nenhum curso disponível</p>
            <p className="text-sm text-steel-400">
              Você ainda não possui cursos liberados. Entre em contato para mais informações.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cursos.map(curso => (
              <div
                key={curso.id}
                className="bg-white rounded-2xl border border-steel-200 hover:border-navy-300 hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-steel-800 leading-snug">{curso.titulo}</h3>
                    {curso.carga_horaria && (
                      <span className="text-xs bg-navy-500/10 text-navy-500 px-2 py-1 rounded-full whitespace-nowrap font-medium flex-shrink-0">
                        {curso.carga_horaria}h
                      </span>
                    )}
                  </div>
                  {curso.descricao && (
                    <p className="text-sm text-steel-500 line-clamp-3">{curso.descricao}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-steel-100">
                    <span className="font-semibold text-navy-500">{formatCurrency(curso.valor)}</span>
                    <div className="flex items-center gap-2">
                      {curso.video_url && (
                        <button
                          onClick={() => setSelected(curso)}
                          className="text-sm text-steel-400 hover:text-steel-600 flex items-center gap-1 transition-colors"
                          title="Pré-visualizar"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/curso/${curso.id}`)}
                        className="flex items-center gap-1.5 text-sm bg-navy-500 text-white px-3 py-1.5 rounded-lg hover:bg-navy-600 transition-colors font-medium"
                      >
                        Acessar curso
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video preview modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.titulo}
        maxWidth="xl"
      >
        {selected?.video_url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={selected.video_url}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={selected.titulo}
            />
          </div>
        )}
        {selected?.descricao && (
          <p className="mt-4 text-sm text-steel-600">{selected.descricao}</p>
        )}
      </Modal>
    </>
  )
}
