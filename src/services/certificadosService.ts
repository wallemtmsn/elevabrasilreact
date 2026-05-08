import { supabase } from '@/lib/supabase'
import type {
  Certificado,
  CertificadoAdmin,
  MetricasCertificados,
  MatriculaPendente,
  MatriculaTeoricoOk,
} from '@/types'

export const certificadosService = {
  // Retorna os certificados do aluno logado
  async getMeusCertificados(alunoId: string): Promise<Certificado[]> {
    const { data, error } = await supabase
      .from('certificados')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data_emissao', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },

  // Admin: todos os certificados com dados do aluno e curso
  async getAllCertificados(): Promise<CertificadoAdmin[]> {
    const { data, error } = await supabase
      .from('certificados')
      .select(`
        *,
        aluno:profiles!aluno_id(nome, cpf, foto_url),
        curso:cursos!curso_id(titulo, nr_referencia, carga_horaria, conteudo_programatico)
      `)
      .order('data_emissao', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []) as CertificadoAdmin[]
  },

  // Chama RPC server-side: valida e emite certificado
  async emitirCertificado(alunoId: string, cursoId: string): Promise<Certificado> {
    const { data, error } = await supabase.rpc('emitir_certificado', {
      p_aluno_id: alunoId,
      p_curso_id: cursoId,
    })
    if (error) throw new Error(error.message)
    return data as Certificado
  },

  // Chama RPC server-side: emite certificado presencial (sem matrícula vinculada).
  // Serial gerado via certificados_seq — sem colisão de Math.random().
  async emitirCertificadoPresencial(payload: {
    nome_aluno: string
    nome_curso: string
    instrutor: string
    validade_meses?: number | null
    cpf_aluno?: string | null
    nr_referencia?: string | null
    carga_horaria?: number | null
    documento_instrutor?: string | null
    data_inicio?: string | null
    data_fim?: string | null
    conteudo_programatico?: string | null
  }): Promise<Certificado> {
    const { data, error } = await supabase.rpc('emitir_certificado_presencial', {
      p_nome_aluno:            payload.nome_aluno,
      p_nome_curso:            payload.nome_curso,
      p_instrutor:             payload.instrutor,
      p_validade_meses:        payload.validade_meses ?? null,
      p_cpf_aluno:             payload.cpf_aluno ?? null,
      p_nr_referencia:         payload.nr_referencia ?? null,
      p_carga_horaria:         payload.carga_horaria ?? null,
      p_documento_instrutor:   payload.documento_instrutor ?? null,
      p_data_inicio:           payload.data_inicio ?? null,
      p_data_fim:              payload.data_fim ?? null,
      p_conteudo_programatico: payload.conteudo_programatico ?? null,
    })
    if (error) throw new Error(error.message)
    return data as Certificado
  },

  // Chama RPC que verifica teórico e, se elegível, emite certificado automaticamente
  async verificarTeoricoEEmitir(
    alunoId: string,
    cursoId: string,
    exigePratico: boolean
  ): Promise<{ concluido: boolean; certificado?: Certificado }> {
    const { data: concluido, error: errVerif } = await supabase.rpc(
      'verificar_e_atualizar_teorico',
      { p_aluno_id: alunoId, p_curso_id: cursoId }
    )
    if (errVerif) throw new Error(errVerif.message)

    if (!concluido || exigePratico) {
      return { concluido: !!concluido }
    }

    // Teórico concluído e curso não exige prático → emitir automaticamente
    try {
      const certificado = await certificadosService.emitirCertificado(alunoId, cursoId)
      return { concluido: true, certificado }
    } catch (err) {
      // Se já emitido ou outra condição, não é erro fatal
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('já emitido')) return { concluido: true }
      throw err
    }
  },

  // Admin: métricas agregadas de certificados
  async getMetricas(): Promise<MetricasCertificados> {
    const now = new Date()
    const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const inicioSemana = new Date(now)
    inicioSemana.setDate(now.getDate() - now.getDay())
    inicioSemana.setHours(0, 0, 0, 0)
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count: total, error: e1 } = await supabase
      .from('certificados')
      .select('id', { count: 'exact', head: true })
    if (e1) throw new Error(e1.message)

    const { count: hojeCount, error: e2 } = await supabase
      .from('certificados')
      .select('id', { count: 'exact', head: true })
      .gte('data_emissao', hoje)
    if (e2) throw new Error(e2.message)

    const { count: semanaCount, error: e3 } = await supabase
      .from('certificados')
      .select('id', { count: 'exact', head: true })
      .gte('data_emissao', inicioSemana.toISOString())
    if (e3) throw new Error(e3.message)

    const { count: mesCount, error: e4 } = await supabase
      .from('certificados')
      .select('id', { count: 'exact', head: true })
      .gte('data_emissao', inicioMes)
    if (e4) throw new Error(e4.message)

    return {
      total: total ?? 0,
      hoje: hojeCount ?? 0,
      esta_semana: semanaCount ?? 0,
      este_mes: mesCount ?? 0,
    }
  },

  // Admin: alunos com teórico concluído mas prático pendente (cursos que exigem prático)
  async getPendentesPratico(): Promise<MatriculaPendente[]> {
    const { data, error } = await supabase
      .from('matriculas')
      .select(`
        id,
        aluno_id,
        teorico_data,
        curso_id,
        profiles!aluno_id(nome, cpf, telefone),
        cursos!curso_id(titulo, nr_referencia, exige_pratico)
      `)
      .eq('teorico_concluido', true)
      .eq('pratico_concluido', false)
      .eq('certificado_emitido', false)
      .order('teorico_data', { ascending: true })
    if (error) throw new Error(error.message)

    const agora = Date.now()
    return ((data || []) as any[])
      .filter(m => m.cursos?.exige_pratico)
      .map(m => {
        const teoricoData = m.teorico_data ? new Date(m.teorico_data).getTime() : agora
        const diasAguardando = Math.floor((agora - teoricoData) / (1000 * 60 * 60 * 24))
        return {
          matricula_id: m.id,
          aluno_id: m.aluno_id,
          nome: m.profiles?.nome ?? '',
          cpf: m.profiles?.cpf ?? '',
          telefone: m.profiles?.telefone ?? null,
          curso_id: m.curso_id,
          curso_nome: m.cursos?.titulo ?? '',
          nr_referencia: m.cursos?.nr_referencia ?? null,
          teorico_data: m.teorico_data,
          dias_aguardando: diasAguardando,
        } as MatriculaPendente
      })
  },

  // Admin: todos os alunos com teórico concluído (qualquer curso)
  async getTeoricoConcluido(): Promise<MatriculaTeoricoOk[]> {
    const { data, error } = await supabase
      .from('matriculas')
      .select(`
        id,
        aluno_id,
        curso_id,
        teorico_data,
        pratico_concluido,
        certificado_emitido,
        certificado_id,
        profiles!aluno_id(nome, cpf),
        cursos!curso_id(titulo, nr_referencia, exige_pratico)
      `)
      .eq('teorico_concluido', true)
      .order('teorico_data', { ascending: false })
    if (error) throw new Error(error.message)

    return ((data || []) as any[]).map(m => ({
      matricula_id: m.id,
      aluno_id: m.aluno_id,
      nome: m.profiles?.nome ?? '',
      cpf: m.profiles?.cpf ?? '',
      curso_id: m.curso_id,
      curso_nome: m.cursos?.titulo ?? '',
      nr_referencia: m.cursos?.nr_referencia ?? null,
      exige_pratico: m.cursos?.exige_pratico ?? true,
      teorico_data: m.teorico_data,
      pratico_concluido: m.pratico_concluido,
      certificado_emitido: m.certificado_emitido,
      certificado_id: m.certificado_id,
    })) as MatriculaTeoricoOk[]
  },
}
