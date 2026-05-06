-- Migration: rpc_marcar_pratico_e_emitir
-- A2 — torna atômica a operação "marcar prático concluído + emitir certificado"
--
-- Antes: o frontend fazia 2 chamadas (UPDATE matriculas, depois RPC emitir).
-- Se a 2ª falhasse, pratico_concluido ficava true sem certificado emitido.
-- Agora: tudo dentro de uma função PL/pgSQL → transação implícita única.
-- Falha em qualquer ponto faz rollback completo.

CREATE OR REPLACE FUNCTION public.marcar_pratico_e_emitir(p_matricula_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  uuid;
  v_role     text;
  v_aluno_id uuid;
  v_curso_id uuid;
  v_pratico  boolean;
  v_cert     json;
BEGIN
  -- ============================================================
  -- AUTORIZAÇÃO — apenas admins
  -- ============================================================
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: somente admin';
  END IF;

  -- ============================================================
  -- LOCK + LEITURA da matrícula (evita race com outro admin)
  -- ============================================================
  SELECT aluno_id, curso_id, pratico_concluido
    INTO v_aluno_id, v_curso_id, v_pratico
  FROM matriculas
  WHERE id = p_matricula_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matrícula não encontrada';
  END IF;

  -- ============================================================
  -- MARCA PRÁTICO (se ainda não marcado)
  -- ============================================================
  IF NOT v_pratico THEN
    UPDATE matriculas
    SET pratico_concluido = true,
        pratico_data      = now()
    WHERE id = p_matricula_id;
  END IF;

  -- ============================================================
  -- EMITE CERTIFICADO (mesma transação)
  -- Se falhar (teórico não concluído, já emitido, etc.) → ROLLBACK
  -- automático e propaga o erro ao client.
  -- ============================================================
  v_cert := emitir_certificado(v_aluno_id, v_curso_id);

  RETURN v_cert;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_pratico_e_emitir(uuid) TO authenticated;
