-- Migration: rpc_verificar_e_atualizar_teorico
-- Determina automaticamente se o aluno concluiu o teórico:
-- condição 1: todas as aulas do curso marcadas como concluídas
-- condição 2: aluno aprovado em todas as provas do curso (se existirem)
-- Ao confirmar, atualiza matriculas.teorico_concluido = true

CREATE OR REPLACE FUNCTION public.verificar_e_atualizar_teorico(
  p_aluno_id uuid,
  p_curso_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_matricula_id uuid;
  v_total_aulas  int;
  v_aulas_ok     int;
  v_total_provas int;
  v_provas_ok    int;
  v_concluido    boolean;
BEGIN
  SELECT id INTO v_matricula_id
  FROM matriculas
  WHERE aluno_id = p_aluno_id AND curso_id = p_curso_id;

  IF NOT FOUND THEN RETURN false; END IF;

  SELECT COUNT(*) INTO v_total_aulas
  FROM aulas a
  JOIN modulos m ON m.id = a.modulo_id
  WHERE m.curso_id = p_curso_id;

  SELECT COUNT(*) INTO v_aulas_ok
  FROM progresso_aulas pa
  JOIN aulas a ON a.id = pa.aula_id
  JOIN modulos m ON m.id = a.modulo_id
  WHERE pa.aluno_id = p_aluno_id
    AND m.curso_id = p_curso_id
    AND pa.concluida = true;

  SELECT COUNT(*) INTO v_total_provas
  FROM provas_modulos pm
  JOIN modulos m ON m.id = pm.modulo_id
  WHERE m.curso_id = p_curso_id;

  SELECT COUNT(DISTINCT tp.prova_id) INTO v_provas_ok
  FROM tentativas_prova tp
  JOIN provas_modulos pm ON pm.id = tp.prova_id
  JOIN modulos m ON m.id = pm.modulo_id
  WHERE tp.aluno_id = p_aluno_id
    AND m.curso_id = p_curso_id
    AND tp.aprovado = true;

  v_concluido := (v_total_aulas > 0 AND v_aulas_ok = v_total_aulas)
              AND (v_total_provas = 0 OR v_provas_ok = v_total_provas);

  IF v_concluido THEN
    UPDATE matriculas
    SET teorico_concluido = true,
        teorico_data      = now()
    WHERE id = v_matricula_id
      AND teorico_concluido = false;
  END IF;

  RETURN v_concluido;
END;
$$;
