import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui'
import { provasService } from '@/services/provasService'
import { useToast } from '@/contexts/ToastContext'
import type { Prova, TentativaProva } from '@/types'

interface ProvaModalProps {
  prova: Prova
  alunoId: string
  moduloTitulo: string
  onAprovado: () => void   // chamado quando aluno passa — desbloqueia próximo módulo
  onFechar: () => void     // chamado no X (só disponível após resultado)
}

type Fase = 'intro' | 'questoes' | 'resultado'

const LETRA = ['A', 'B', 'C', 'D'] as const

export function ProvaModal({ prova, alunoId, moduloTitulo, onAprovado, onFechar }: ProvaModalProps) {
  const questoes = prova.questoes || []
  const { showToast } = useToast()

  const [fase, setFase] = useState<Fase>('intro')
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [resultado, setResultado] = useState<TentativaProva | null>(null)
  const [submetendo, setSubmetendo] = useState(false)

  const totalRespondidas = Object.keys(respostas).length
  const todasRespondidas = totalRespondidas === questoes.length

  async function submeter() {
    if (!todasRespondidas || submetendo) return
    setSubmetendo(true)
    try {
      const tent = await provasService.submeterTentativa(alunoId, prova.id, respostas)
      setResultado(tent)
      setFase('resultado')
      if (tent.aprovado) onAprovado()
    } catch (err) {
      console.error('[Avaliação] Falha ao submeter tentativa', { provaId: prova.id, alunoId, totalRespostas: Object.keys(respostas).length, error: err })
      showToast(err instanceof Error ? err.message : 'Não foi possível enviar a avaliação. Tente novamente.', 'error')
    } finally {
      setSubmetendo(false)
    }
  }

  function tentarNovamente() {
    setRespostas({})
    setResultado(null)
    setFase('questoes')
  }

  // ── Overlay ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="bg-gradient-to-r from-navy-500 to-navy-600 px-6 py-5 flex items-center gap-4 flex-shrink-0">
          <div className="bg-white/20 rounded-xl p-2.5">
            <ClipboardList className="text-white" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-navy-200 text-xs font-medium uppercase tracking-wide">Avaliação do módulo</p>
            <h2 className="text-white font-bold text-lg leading-tight truncate">{moduloTitulo}</h2>
          </div>
          {fase === 'resultado' && resultado?.aprovado && (
            <button
              onClick={onFechar}
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label="Fechar"
            >
              <XCircle size={22} />
            </button>
          )}
        </div>

        {/* Body scrollável */}
        <div className="flex-1 overflow-y-auto">

          {/* ── INTRO ─────────────────────────────────────────────────────── */}
          {fase === 'intro' && (
            <div className="p-8 flex flex-col items-center text-center gap-6">
              <div className="bg-navy-50 rounded-full p-5">
                <ClipboardList className="text-navy-500" size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-steel-800 mb-2">Você concluiu o módulo!</h3>
                <p className="text-steel-500 text-sm leading-relaxed max-w-md">
                  Para desbloquear o próximo módulo, você precisa ser aprovado na avaliação abaixo.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                <div className="bg-steel-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-navy-500">{questoes.length}</p>
                  <p className="text-xs text-steel-500 mt-0.5">questões</p>
                </div>
                <div className="bg-steel-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-navy-500">80%</p>
                  <p className="text-xs text-steel-500 mt-0.5">para passar</p>
                </div>
                <div className="bg-steel-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-navy-500">∞</p>
                  <p className="text-xs text-steel-500 mt-0.5">tentativas</p>
                </div>
              </div>
              <Button size="lg" onClick={() => setFase('questoes')} className="w-full max-w-xs">
                Iniciar avaliação
              </Button>
            </div>
          )}

          {/* ── QUESTÕES ──────────────────────────────────────────────────── */}
          {fase === 'questoes' && (
            <div className="p-6 flex flex-col gap-6">

              {/* Progresso */}
              <div className="flex items-center justify-between text-xs text-steel-500">
                <span>{totalRespondidas} de {questoes.length} respondidas</span>
                <span className={todasRespondidas ? 'text-green-600 font-medium' : ''}>
                  {todasRespondidas ? 'Pronto para enviar!' : `Faltam ${questoes.length - totalRespondidas}`}
                </span>
              </div>
              <div className="h-1.5 bg-steel-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy-500 rounded-full transition-all duration-300"
                  style={{ width: `${(totalRespondidas / questoes.length) * 100}%` }}
                />
              </div>

              {/* Lista de questões */}
              {questoes.map((q, idx) => (
                <div key={q.id} className="border border-steel-200 rounded-xl overflow-hidden">
                  <div className="bg-steel-50 px-4 py-3 border-b border-steel-200">
                    <p className="text-xs font-semibold text-steel-400 uppercase tracking-wide mb-1">
                      Questão {idx + 1}
                    </p>
                    <p className="text-sm font-medium text-steel-800 leading-snug">{q.enunciado}</p>
                  </div>
                  <div className="divide-y divide-steel-100">
                    {LETRA.map(letra => {
                      const texto = q.alternativas[letra]
                      const selecionada = respostas[q.id] === letra
                      return (
                        <button
                          key={letra}
                          onClick={() => setRespostas(prev => ({ ...prev, [q.id]: letra }))}
                          className={[
                            'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                            selecionada
                              ? 'bg-navy-500 text-white'
                              : 'hover:bg-steel-50 text-steel-700',
                          ].join(' ')}
                        >
                          <span className={[
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border',
                            selecionada
                              ? 'bg-white text-navy-500 border-white'
                              : 'border-steel-300 text-steel-400',
                          ].join(' ')}>
                            {letra}
                          </span>
                          {texto}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              <Button
                onClick={submeter}
                loading={submetendo}
                disabled={!todasRespondidas}
                fullWidth
                size="lg"
                className="mt-2"
              >
                Enviar avaliação
              </Button>
            </div>
          )}

          {/* ── RESULTADO ─────────────────────────────────────────────────── */}
          {fase === 'resultado' && resultado && (
            <div className="p-8 flex flex-col items-center gap-6">

              {resultado.aprovado ? (
                <>
                  <div className="bg-green-50 rounded-full p-5">
                    <CheckCircle2 className="text-green-500" size={48} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-steel-800 mb-1">Aprovado!</h3>
                    <p className="text-steel-500 text-sm">
                      Você acertou <strong className="text-green-600">{resultado.acertos}/{resultado.total}</strong> questões.
                      O próximo módulo foi desbloqueado.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-50 rounded-full p-5">
                    <AlertTriangle className="text-brand-red" size={48} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-steel-800 mb-1">Não aprovado</h3>
                    <p className="text-steel-500 text-sm">
                      Você acertou <strong className="text-brand-red">{resultado.acertos}/{resultado.total}</strong> questões.
                      São necessários pelo menos {Math.ceil(resultado.total * 0.8)} acertos para passar.
                    </p>
                  </div>
                </>
              )}

              {/* Gabarito */}
              <div className="w-full border border-steel-200 rounded-xl overflow-hidden">
                <div className="bg-steel-50 px-4 py-2.5 border-b border-steel-200">
                  <p className="text-xs font-semibold text-steel-500 uppercase tracking-wide">Gabarito</p>
                </div>
                <div className="divide-y divide-steel-100">
                  {(prova.questoes || []).map((q, idx) => {
                    const correta = resultado.questoes_corretas?.includes(q.id) ?? false
                    const respostaAluno = resultado.respostas[q.id] as 'A' | 'B' | 'C' | 'D' | undefined
                    return (
                      <div key={q.id} className="px-4 py-3 flex items-start gap-3">
                        <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${correta ? 'bg-green-100' : 'bg-red-100'}`}>
                          {correta
                            ? <CheckCircle2 size={14} className="text-green-600" />
                            : <XCircle size={14} className="text-red-500" />
                          }
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-steel-600 leading-snug">{idx + 1}. {q.enunciado}</p>
                          {respostaAluno && (
                            <p className={`text-xs mt-0.5 font-medium ${correta ? 'text-green-600' : 'text-red-500'}`}>
                              Sua resposta: {respostaAluno} — {q.alternativas[respostaAluno]}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {resultado.aprovado ? (
                <Button fullWidth size="lg" onClick={onFechar}>
                  Continuar o curso
                </Button>
              ) : (
                <Button fullWidth size="lg" onClick={tentarNovamente}>
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
