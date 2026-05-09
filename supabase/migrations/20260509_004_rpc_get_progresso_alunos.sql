-- Migration: rpc_get_progresso_alunos
-- C25 — RPC que agrega progresso de cada aluno por matrícula.
--
-- Retorna uma linha por matrícula (aluno × curso) com:
--   - % de aulas concluídas (aulas com progresso_aulas.concluida = true / total de aulas do curso)
--   - flags teorico_concluido, pratico_concluido, certificado_emitido da matrícula
--
-- Apenas admins podem chamar.
-- Hierarquia: Curso → Módulos → Aulas; Progresso em progresso_aulas (LEFT JOIN para
-- alunos que ainda não assistiram nenhuma aula).

CREATE OR REPLACE FUNCTION public.get_progresso_alunos()
RETURNS TABLE (
  aluno_id          uuid,
  aluno_nome        text,
  aluno_cpf         text,
  matricula_id      uuid,
  curso_id          uuid,
  curso_titulo      text,
  nr_referencia     text,
  liberado_em       timestamptz,
  total_aulas       bigint,
  aulas_concluidas  bigint,
  progresso_pct     numeric,
  teorico_concluido boolean,
  pratico_concluido boolean,
  certificado_emitido boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role    text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: somente admin';
  END IF;

  RETURN QUERY
  SELECT
    p.id                                                       AS aluno_id,
    p.nome                                                     AS aluno_nome,
    p.cpf                                                      AS aluno_cpf,
    m.id                                                       AS matricula_id,
    m.curso_id                                                 AS curso_id,
    c.titulo                                                   AS curso_titulo,
    c.nr_referencia                                            AS nr_referencia,
    m.liberado_em                                              AS liberado_em,
    COUNT(a.id)                                                AS total_aulas,
    COUNT(pa.id) FILTER (WHERE pa.concluida = true)           AS aulas_concluidas,
    CASE
      WHEN COUNT(a.id) > 0
        THEN ROUND(
          COUNT(pa.id) FILTER (WHERE pa.concluida = true)::numeric
          / COUNT(a.id) * 100, 0
        )
      ELSE 0
    END                                                        AS progresso_pct,
    m.teorico_concluido                                        AS teorico_concluido,
    m.pratico_concluido                                        AS pratico_concluido,
    m.certificado_emitido                                      AS certificado_emitido
  FROM profiles p
  JOIN matriculas m ON m.aluno_id = p.id
  JOIN cursos c ON c.id = m.curso_id
  JOIN modulos mo ON mo.curso_id = c.id
  JOIN aulas a ON a.modulo_id = mo.id
  LEFT JOIN progresso_aulas pa ON pa.aula_id = a.id AND pa.aluno_id = p.id
  WHERE p.role = 'aluno'
  GROUP BY
    p.id, p.nome, p.cpf,
    m.id, m.curso_id, c.titulo, c.nr_referencia, m.liberado_em,
    m.teorico_concluido, m.pratico_concluido, m.certificado_emitido
  ORDER BY p.nome, c.titulo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_progresso_alunos() TO authenticated;
