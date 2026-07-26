-- Migration: rpc_marcar_aula_concluida
-- Corrige o bypass de avaliação no progresso do aluno: modulosService.marcarConcluida
-- fazia um upsert direto em progresso_aulas sem checar nenhum pré-requisito — a
-- validação de módulo bloqueado existia só no frontend (bloqueio de botões), então
-- qualquer chamada direta à API do Supabase conseguia marcar aulas de um módulo
-- travado como concluídas, pulando a avaliação obrigatória do módulo anterior.
--
-- Esta RPC passa a ser o único caminho para marcar uma aula como concluída e valida
-- no servidor, antes de gravar:
--   1. Todas as aulas do módulo ANTERIOR (no mesmo curso) devem estar concluídas.
--   2. Se o módulo anterior tem avaliação cadastrada, o aluno precisa ter uma
--      tentativa aprovada nela.
-- O "módulo anterior" é definido pelo mesmo desempate (ordem, id) usado no frontend
-- (getModulosByCurso agora ordena por ordem, id), garantindo que a UI e a validação
-- do servidor concordem mesmo quando dois módulos do curso compartilham o mesmo
-- número de "ordem".

CREATE OR REPLACE FUNCTION public.marcar_aula_concluida(p_aula_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aluno_id           uuid;
  v_modulo_id          uuid;
  v_curso_id           uuid;
  v_modulo_ordem       int;
  v_modulo_anterior_id uuid;
BEGIN
  v_aluno_id := auth.uid();
  IF v_aluno_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT a.modulo_id, m.curso_id, m.ordem
  INTO v_modulo_id, v_curso_id, v_modulo_ordem
  FROM aulas a JOIN modulos m ON m.id = a.modulo_id
  WHERE a.id = p_aula_id;

  IF v_modulo_id IS NULL THEN
    RAISE EXCEPTION 'Aula não encontrada';
  END IF;

  -- Módulo imediatamente anterior no curso, com o mesmo desempate (ordem, id)
  -- usado pelo frontend (getModulosByCurso: order by ordem, id)
  SELECT m.id INTO v_modulo_anterior_id
  FROM modulos m
  WHERE m.curso_id = v_curso_id
    AND (m.ordem, m.id) < (v_modulo_ordem, v_modulo_id)
  ORDER BY m.ordem DESC, m.id DESC
  LIMIT 1;

  IF v_modulo_anterior_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM aulas a2
      WHERE a2.modulo_id = v_modulo_anterior_id
        AND NOT EXISTS (
          SELECT 1 FROM progresso_aulas p
          WHERE p.aluno_id = v_aluno_id AND p.aula_id = a2.id AND p.concluida = true
        )
    ) THEN
      RAISE EXCEPTION 'Conclua todas as aulas do módulo anterior antes de continuar';
    END IF;

    IF EXISTS (
      SELECT 1 FROM provas_modulos pm
      WHERE pm.modulo_id = v_modulo_anterior_id
        AND NOT EXISTS (
          SELECT 1 FROM tentativas_prova t
          WHERE t.aluno_id = v_aluno_id AND t.prova_id = pm.id AND t.aprovado = true
        )
    ) THEN
      RAISE EXCEPTION 'Você precisa ser aprovado na avaliação do módulo anterior antes de continuar';
    END IF;
  END IF;

  INSERT INTO progresso_aulas (aluno_id, aula_id, concluida, concluida_em)
  VALUES (v_aluno_id, p_aula_id, true, now())
  ON CONFLICT (aluno_id, aula_id) DO UPDATE SET concluida = true, concluida_em = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_aula_concluida(uuid) TO authenticated;
