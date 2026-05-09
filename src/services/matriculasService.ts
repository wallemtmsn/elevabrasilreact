import { supabase } from '@/lib/supabase'
import type { Certificado, Curso, Matricula, MatriculaComCert } from '@/types'

export type { Matricula }

export const matriculasService = {
  // retorna os curso_ids que o aluno tem acesso
  async getCursoIdsByAluno(alunoId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('matriculas')
      .select('curso_id')
      .eq('aluno_id', alunoId)
    if (error) throw new Error(error.message)
    return (data || []).map(m => m.curso_id)
  },

  // retorna os cursos completos que o aluno pode acessar (apenas ativos)
  async getCursosDoAluno(alunoId: string): Promise<Curso[]> {
    const { data: mats, error: mErr } = await supabase
      .from('matriculas')
      .select('curso_id')
      .eq('aluno_id', alunoId)
    if (mErr) throw new Error(mErr.message)
    if (!mats || mats.length === 0) return []

    const ids = mats.map(m => m.curso_id)
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .in('id', ids)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },

  // admin: libera um curso para um aluno
  async liberar(alunoId: string, cursoId: string, liberadoPor: string): Promise<void> {
    const { error } = await supabase
      .from('matriculas')
      .insert({ aluno_id: alunoId, curso_id: cursoId, liberado_por: liberadoPor })
    if (error) throw new Error(error.message)
  },

  // admin: revoga acesso de um aluno a um curso
  async revogar(alunoId: string, cursoId: string): Promise<void> {
    const { error } = await supabase
      .from('matriculas')
      .delete()
      .eq('aluno_id', alunoId)
      .eq('curso_id', cursoId)
    if (error) throw new Error(error.message)
  },

  // admin: conta quantos alunos têm acesso a um curso
  async countPorCurso(cursoId: string): Promise<number> {
    const { count, error } = await supabase
      .from('matriculas')
      .select('id', { count: 'exact', head: true })
      .eq('curso_id', cursoId)
    if (error) throw new Error(error.message)
    return count ?? 0
  },

  // admin: busca todas as matrículas de uma vez (evita N+1)
  async getAllMatriculas(): Promise<{ aluno_id: string; curso_id: string }[]> {
    const { data, error } = await supabase
      .from('matriculas')
      .select('aluno_id, curso_id')
    if (error) throw new Error(error.message)
    return data || []
  },

  // admin: retorna todas as matrículas com dados de aluno, curso e certificado (para tela de upload)
  async getAllMatriculasComCert(): Promise<MatriculaComCert[]> {
    const { data, error } = await supabase
      .from('matriculas')
      .select(`
        id,
        aluno_id,
        curso_id,
        liberado_em,
        certificado_id,
        profiles!aluno_id(nome, cpf),
        cursos!curso_id(titulo, nr_referencia),
        certificados!certificado_id(id, pdf_url, data_emissao)
      `)
      .order('liberado_em', { ascending: false })
    if (error) throw new Error(error.message)

    return ((data || []) as any[]).map(m => ({
      matricula_id: m.id,
      aluno_id: m.aluno_id,
      aluno_nome: m.profiles?.nome ?? '',
      aluno_cpf: m.profiles?.cpf ?? '',
      curso_id: m.curso_id,
      curso_titulo: m.cursos?.titulo ?? '',
      nr_referencia: m.cursos?.nr_referencia ?? null,
      liberado_em: m.liberado_em,
      cert_id: m.certificados?.id ?? null,
      pdf_url: m.certificados?.pdf_url ?? null,
      data_emissao: m.certificados?.data_emissao ?? null,
    })) as MatriculaComCert[]
  },

  // admin: marca prático como concluído e registra data
  async marcarPraticoCompleto(matriculaId: string): Promise<void> {
    const { error } = await supabase
      .from('matriculas')
      .update({ pratico_concluido: true, pratico_data: new Date().toISOString() })
      .eq('id', matriculaId)
    if (error) throw new Error(error.message)
  },

  // admin: marca prático e emite certificado em uma única transação server-side.
  // Se a emissão falhar (teórico pendente, já emitido, etc.), o UPDATE do
  // pratico_concluido é revertido — sem estados inconsistentes.
  async marcarPraticoEEmitir(matriculaId: string): Promise<Certificado> {
    const { data, error } = await supabase.rpc('marcar_pratico_e_emitir', {
      p_matricula_id: matriculaId,
    })
    if (error) throw new Error(error.message)
    return data as Certificado
  },
}
