-- Migration: rpc_emitir_certificado_upload
-- C24 — RPC para o admin registrar o upload de um PDF como certificado de uma matrícula.
--
-- Fluxo:
--   1. Admin faz upload do PDF para Storage (path: {aluno_id}/{matricula_id}.pdf)
--   2. Chama esta RPC passando matricula_id e o path relativo
--   3. Se já existe cert para a matrícula → atualiza pdf_url
--      Se não existe → cria novo cert (numero_serie via certificados_seq)
--   4. Atualiza matriculas: certificado_emitido = true, certificado_id = cert.id
--   5. Retorna o JSON do certificado

CREATE OR REPLACE FUNCTION public.emitir_certificado_upload(
  p_matricula_id uuid,
  p_pdf_url      text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_role      text;
  v_aluno_id  uuid;
  v_curso_id  uuid;
  v_cert_id   uuid;
  v_serie     text;
  v_res       json;
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

  -- VALIDAÇÃO
  IF p_pdf_url IS NULL OR length(trim(p_pdf_url)) = 0 THEN
    RAISE EXCEPTION 'URL do PDF é obrigatória';
  END IF;

  -- LOCK + leitura da matrícula
  SELECT aluno_id, curso_id INTO v_aluno_id, v_curso_id
  FROM matriculas
  WHERE id = p_matricula_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matrícula não encontrada';
  END IF;

  -- Verifica se já existe certificado para esta matrícula
  SELECT id INTO v_cert_id
  FROM certificados
  WHERE matricula_id = p_matricula_id;

  IF FOUND THEN
    -- Atualiza pdf_url no cert existente
    UPDATE certificados
    SET pdf_url = p_pdf_url
    WHERE id = v_cert_id;
  ELSE
    -- Cria novo certificado
    v_serie := 'UPLOAD-' || to_char(now(), 'YYYY') || '-'
             || lpad(nextval('certificados_seq')::text, 6, '0');

    INSERT INTO certificados (
      matricula_id, aluno_id, curso_id,
      numero_serie, tipo, pdf_url, emitido_por
    )
    VALUES (
      p_matricula_id, v_aluno_id, v_curso_id,
      v_serie, 'completo', p_pdf_url, v_user_id
    )
    RETURNING id INTO v_cert_id;

    -- Atualiza matrícula
    UPDATE matriculas
    SET certificado_emitido = true,
        certificado_id      = v_cert_id
    WHERE id = p_matricula_id;
  END IF;

  SELECT row_to_json(c.*) INTO v_res FROM certificados c WHERE c.id = v_cert_id;
  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.emitir_certificado_upload(uuid, text) TO authenticated;
