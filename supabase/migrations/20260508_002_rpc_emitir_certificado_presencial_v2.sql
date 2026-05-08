-- Migration: rpc_emitir_certificado_presencial_v2
-- C22 — versão atualizada da RPC com 4 parâmetros opcionais novos:
--   p_documento_instrutor (ex: "Tec. Em Segurança do Trabalho")
--   p_data_inicio / p_data_fim (período do treinamento)
--   p_conteudo_programatico (texto livre para a página 2)
--
-- Mantém autorização (admin), validações existentes e geração via certificados_seq.
-- Adiciona validação de período (data_fim >= data_inicio).
-- Persiste nas colunas *_avulso adicionadas em 20260508_001.

CREATE OR REPLACE FUNCTION public.emitir_certificado_presencial(
  p_nome_aluno          text,
  p_nome_curso          text,
  p_instrutor           text,
  p_validade_meses      integer DEFAULT NULL,
  p_cpf_aluno           text    DEFAULT NULL,
  p_nr_referencia       text    DEFAULT NULL,
  p_carga_horaria       integer DEFAULT NULL,
  p_documento_instrutor text    DEFAULT NULL,
  p_data_inicio         date    DEFAULT NULL,
  p_data_fim            date    DEFAULT NULL,
  p_conteudo_programatico text  DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role    text;
  v_serie   text;
  v_val     date;
  v_cid     uuid;
  v_res     json;
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

  -- VALIDAÇÃO DE ENTRADA
  IF p_nome_aluno IS NULL OR length(trim(p_nome_aluno)) = 0 THEN
    RAISE EXCEPTION 'Nome do aluno é obrigatório';
  END IF;
  IF p_nome_curso IS NULL OR length(trim(p_nome_curso)) = 0 THEN
    RAISE EXCEPTION 'Nome do curso é obrigatório';
  END IF;
  IF p_instrutor IS NULL OR length(trim(p_instrutor)) = 0 THEN
    RAISE EXCEPTION 'Nome do instrutor é obrigatório';
  END IF;
  IF p_validade_meses IS NOT NULL AND p_validade_meses < 1 THEN
    RAISE EXCEPTION 'Validade em meses deve ser positiva';
  END IF;
  IF p_carga_horaria IS NOT NULL AND p_carga_horaria < 1 THEN
    RAISE EXCEPTION 'Carga horária deve ser positiva';
  END IF;
  IF p_data_inicio IS NOT NULL AND p_data_fim IS NOT NULL
     AND p_data_fim < p_data_inicio THEN
    RAISE EXCEPTION 'Data fim deve ser maior ou igual à data início';
  END IF;

  -- SERIAL ÚNICO via sequence
  v_serie := 'PRES-' || to_char(now(), 'YYYY') || '-'
           || lpad(nextval('certificados_seq')::text, 6, '0');

  -- VALIDADE
  IF p_validade_meses IS NOT NULL AND p_validade_meses > 0 THEN
    v_val := (now() + (p_validade_meses || ' months')::interval)::date;
  ELSE
    v_val := NULL;
  END IF;

  -- INSERIR
  INSERT INTO certificados (
    matricula_id, aluno_id, curso_id,
    numero_serie, data_validade, tipo,
    nome_aluno_avulso, cpf_aluno_avulso,
    nome_curso_avulso, nr_referencia_avulso,
    carga_horaria_avulso, instrutor_avulso,
    documento_instrutor_avulso,
    data_inicio_avulso, data_fim_avulso,
    conteudo_programatico_avulso,
    emitido_por
  )
  VALUES (
    NULL, NULL, NULL,
    v_serie, v_val, 'presencial',
    trim(p_nome_aluno),
    nullif(trim(coalesce(p_cpf_aluno, '')), ''),
    trim(p_nome_curso),
    nullif(trim(coalesce(p_nr_referencia, '')), ''),
    p_carga_horaria,
    trim(p_instrutor),
    nullif(trim(coalesce(p_documento_instrutor, '')), ''),
    p_data_inicio,
    p_data_fim,
    nullif(trim(coalesce(p_conteudo_programatico, '')), ''),
    v_user_id
  )
  RETURNING id INTO v_cid;

  SELECT row_to_json(c.*) INTO v_res FROM certificados c WHERE c.id = v_cid;
  RETURN v_res;
END;
$$;

-- Drop a versão antiga (7 args) caso ainda exista — nova assinatura tem 11 params.
-- O Postgres trata pela assinatura exata, então a antiga ficaria órfã se não for dropada.
DROP FUNCTION IF EXISTS public.emitir_certificado_presencial(
  text, text, text, integer, text, text, integer
);

GRANT EXECUTE ON FUNCTION public.emitir_certificado_presencial(
  text, text, text, integer, text, text, integer, text, date, date, text
) TO authenticated;
