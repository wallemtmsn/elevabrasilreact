-- Migration: rpc_excluir_aluno
-- Corrige exclusão de aluno no painel Admin: profileService.delete() fazia um
-- DELETE FROM profiles direto, que sempre falhava com violação de FK (matriculas.aluno_id
-- e certificados.aluno_id/emitido_por são ON DELETE NO ACTION) para qualquer aluno com
-- matrícula ou certificado — ou seja, praticamente todo aluno real.
--
-- Bloqueia a exclusão se o aluno tiver certificado(s) vinculado(s) (registro de
-- conclusão/auditoria — deve ser removido explicitamente via excluir_certificado antes).
-- Caso contrário, remove matrículas (dependência bloqueante sem cascade) e limpa
-- perguntas_aulas.respondido_por antes de apagar o perfil. tentativas_prova.aluno_id e
-- perguntas_aulas.aluno_id já são ON DELETE CASCADE.
--
-- Tudo dentro de uma função PL/pgSQL → transação implícita única.
-- Falha em qualquer ponto → rollback completo.

CREATE OR REPLACE FUNCTION public.excluir_aluno(p_aluno_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id          uuid;
  v_role             text;
  v_num_certificados int;
BEGIN
  -- AUTORIZAÇÃO — apenas admins
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: somente admin';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_aluno_id) THEN
    RAISE EXCEPTION 'Aluno não encontrado';
  END IF;

  -- Bloqueia exclusão se houver certificados emitidos (registro de conclusão/auditoria)
  SELECT count(*) INTO v_num_certificados
  FROM certificados
  WHERE aluno_id = p_aluno_id OR emitido_por = p_aluno_id;

  IF v_num_certificados > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir: aluno possui % certificado(s) vinculado(s). Exclua os certificados primeiro.', v_num_certificados;
  END IF;

  -- Limpa dependências que bloqueariam o DELETE (NO ACTION) antes de apagar o perfil
  DELETE FROM matriculas WHERE aluno_id = p_aluno_id;
  UPDATE perguntas_aulas SET respondido_por = NULL WHERE respondido_por = p_aluno_id;

  -- tentativas_prova.aluno_id e perguntas_aulas.aluno_id já são ON DELETE CASCADE
  DELETE FROM profiles WHERE id = p_aluno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.excluir_aluno(uuid) TO authenticated;
