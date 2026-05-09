import { supabase } from '@/lib/supabase'
import type { ProgressoAluno } from '@/types'

export const progressoService = {
  async getProgressoAlunos(): Promise<ProgressoAluno[]> {
    const { data, error } = await supabase.rpc('get_progresso_alunos')
    if (error) throw new Error(error.message)
    return ((data || []) as any[]).map(r => ({
      aluno_id:           r.aluno_id,
      aluno_nome:         r.aluno_nome,
      aluno_cpf:          r.aluno_cpf,
      matricula_id:       r.matricula_id,
      curso_id:           r.curso_id,
      curso_titulo:       r.curso_titulo,
      nr_referencia:      r.nr_referencia ?? null,
      liberado_em:        r.liberado_em,
      total_aulas:        Number(r.total_aulas),
      aulas_concluidas:   Number(r.aulas_concluidas),
      progresso_pct:      Number(r.progresso_pct),
      teorico_concluido:  r.teorico_concluido,
      pratico_concluido:  r.pratico_concluido,
      certificado_emitido: r.certificado_emitido,
    })) as ProgressoAluno[]
  },
}
