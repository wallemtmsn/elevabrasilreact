-- Migration: add_presencial_support_to_certificados
-- C1 — Persiste certificados presenciais no mesmo banco
--
-- Mudanças:
--   1. matricula_id, aluno_id, curso_id passam a ser nullable (presencial não tem matrícula)
--   2. Novos campos *_avulso com snapshot dos dados informados manualmente
--   3. emitido_por: rastreia o admin que emitiu o certificado
--   4. CHECK em tipo agora aceita 'presencial'
--   5. CHECK que garante coerência: vinculado (matricula) XOR avulso (presencial)

-- ============================================================
-- 1. RELAXAR NOT NULL EM FKs (necessário para tipo='presencial')
-- ============================================================
ALTER TABLE public.certificados
  ALTER COLUMN matricula_id DROP NOT NULL,
  ALTER COLUMN aluno_id     DROP NOT NULL,
  ALTER COLUMN curso_id     DROP NOT NULL;

-- ============================================================
-- 2. NOVOS CAMPOS — snapshot do certificado presencial
-- ============================================================
ALTER TABLE public.certificados
  ADD COLUMN IF NOT EXISTS nome_aluno_avulso     text,
  ADD COLUMN IF NOT EXISTS cpf_aluno_avulso      text,
  ADD COLUMN IF NOT EXISTS nome_curso_avulso     text,
  ADD COLUMN IF NOT EXISTS nr_referencia_avulso  text,
  ADD COLUMN IF NOT EXISTS carga_horaria_avulso  integer,
  ADD COLUMN IF NOT EXISTS instrutor_avulso      text,
  ADD COLUMN IF NOT EXISTS emitido_por           uuid REFERENCES public.profiles(id);

-- ============================================================
-- 3. ATUALIZAR CHECK CONSTRAINT EM tipo (incluir 'presencial')
-- ============================================================
ALTER TABLE public.certificados
  DROP CONSTRAINT IF EXISTS certificados_tipo_check;

ALTER TABLE public.certificados
  ADD CONSTRAINT certificados_tipo_check
  CHECK (tipo IN ('teorico', 'completo', 'presencial'));

-- ============================================================
-- 4. CONSTRAINT DE COERÊNCIA
-- ============================================================
-- Garante que:
--   - tipo='presencial': sem FKs, com nome_aluno_avulso e nome_curso_avulso preenchidos
--   - tipo IN ('teorico','completo'): com matricula_id, aluno_id e curso_id preenchidos
ALTER TABLE public.certificados
  DROP CONSTRAINT IF EXISTS certificados_presencial_xor_vinculado;

ALTER TABLE public.certificados
  ADD CONSTRAINT certificados_presencial_xor_vinculado
  CHECK (
    (tipo = 'presencial'
      AND matricula_id IS NULL
      AND aluno_id     IS NULL
      AND curso_id     IS NULL
      AND nome_aluno_avulso IS NOT NULL
      AND nome_curso_avulso IS NOT NULL)
    OR
    (tipo IN ('teorico','completo')
      AND matricula_id IS NOT NULL
      AND aluno_id     IS NOT NULL
      AND curso_id     IS NOT NULL)
  );

-- ============================================================
-- 5. ÍNDICES PARA BUSCA POR DADOS AVULSOS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cert_cpf_avulso ON public.certificados(cpf_aluno_avulso)
  WHERE cpf_aluno_avulso IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cert_emitido_por ON public.certificados(emitido_por)
  WHERE emitido_por IS NOT NULL;

-- ============================================================
-- 6. POLICY ADICIONAL — RLS já cobre presencial
-- ============================================================
-- A policy "Aluno vê próprios certificados" usa aluno_id = auth.uid().
-- Para presencial (aluno_id IS NULL), a comparação retorna NULL → linha
-- invisível para alunos. Apenas admins enxergam. Comportamento correto.
