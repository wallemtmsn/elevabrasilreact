-- Migration: rpc_emitir_certificado
-- Emite certificado para um aluno/curso se todas as condições forem atendidas:
-- - teórico concluído
-- - prático concluído (se curso.exige_pratico = true)
-- - certificado ainda não emitido
-- Gera número de série único: ELEVA-YYYY-NNNNNN
-- Atualiza matriculas.certificado_emitido = true

CREATE OR REPLACE FUNCTION public.emitir_certificado(
  p_aluno_id uuid,
  p_curso_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mat    RECORD;
  v_curso  RECORD;
  v_serie  text;
  v_val    date;
  v_cid    uuid;
  v_res    json;
BEGIN
  SELECT * INTO v_mat
  FROM matriculas
  WHERE aluno_id = p_aluno_id AND curso_id = p_curso_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matrícula não encontrada';
  END IF;
  IF v_mat.certificado_emitido THEN
    RAISE EXCEPTION 'Certificado já emitido';
  END IF;
  IF NOT v_mat.teorico_concluido THEN
    RAISE EXCEPTION 'Teórico não concluído';
  END IF;

  SELECT * INTO v_curso FROM cursos WHERE id = p_curso_id;

  IF v_curso.exige_pratico AND NOT v_mat.pratico_concluido THEN
    RAISE EXCEPTION 'Prático não concluído';
  END IF;

  v_serie := 'ELEVA-' || to_char(now(), 'YYYY') || '-'
           || lpad(nextval('certificados_seq')::text, 6, '0');

  v_val := (now() + (v_curso.validade_meses || ' months')::interval)::date;

  INSERT INTO certificados (matricula_id, aluno_id, curso_id, numero_serie, data_validade, tipo)
  VALUES (
    v_mat.id,
    p_aluno_id,
    p_curso_id,
    v_serie,
    v_val,
    CASE WHEN v_curso.exige_pratico THEN 'completo' ELSE 'teorico' END
  )
  RETURNING id INTO v_cid;

  UPDATE matriculas
  SET certificado_emitido = true,
      certificado_id      = v_cid
  WHERE id = v_mat.id;

  SELECT row_to_json(c.*) INTO v_res
  FROM certificados c
  WHERE c.id = v_cid;

  RETURN v_res;
END;
$$;
