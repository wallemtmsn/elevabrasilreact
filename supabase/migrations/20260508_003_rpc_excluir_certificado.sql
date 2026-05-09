-- Migration: rpc_excluir_certificado
-- C23 — permite ao admin excluir um certificado emitido.
--
-- Para certificados vinculados (matricula_id IS NOT NULL):
--   1. Atualiza matriculas: certificado_emitido = false, certificado_id = NULL
--      (NÃO mexe em teorico_concluido/pratico_concluido — admin pode reemitir depois)
--   2. Apaga o certificado
-- Para certificados presenciais (matricula_id IS NULL): só apaga.
--
-- Tudo dentro de uma função PL/pgSQL → transação implícita única.
-- Falha em qualquer ponto → rollback completo.

CREATE OR REPLACE FUNCTION public.excluir_certificado(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid;
  v_role         text;
  v_matricula_id uuid;
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

  -- LOCK + leitura
  SELECT matricula_id INTO v_matricula_id
  FROM certificados
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Certificado não encontrado';
  END IF;

  -- Vinculado: limpa a FK na matrícula antes de apagar (evita FK violation)
  IF v_matricula_id IS NOT NULL THEN
    UPDATE matriculas
    SET certificado_emitido = false,
        certificado_id      = NULL
    WHERE id = v_matricula_id;
  END IF;

  DELETE FROM certificados WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.excluir_certificado(uuid) TO authenticated;
