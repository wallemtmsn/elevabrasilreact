-- Migration: add_presencial_extras_to_certificados
-- C22 — Campos extras para o redesign do PDF estilo Canva:
--   - documento_instrutor_avulso: texto exibido abaixo da assinatura (ex: "Tec. Em Segurança do Trabalho")
--   - data_inicio_avulso / data_fim_avulso: período do treinamento ("Realizado: 28/04 a 30/04")
--   - conteudo_programatico_avulso: texto livre para a página 2 (1 linha = 1 bullet)

ALTER TABLE public.certificados
  ADD COLUMN IF NOT EXISTS documento_instrutor_avulso  text,
  ADD COLUMN IF NOT EXISTS data_inicio_avulso          date,
  ADD COLUMN IF NOT EXISTS data_fim_avulso             date,
  ADD COLUMN IF NOT EXISTS conteudo_programatico_avulso text;

-- Coerência: data_fim deve ser >= data_inicio quando ambos preenchidos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificados_periodo_coerente'
  ) THEN
    ALTER TABLE public.certificados
      ADD CONSTRAINT certificados_periodo_coerente
      CHECK (
        data_inicio_avulso IS NULL
        OR data_fim_avulso IS NULL
        OR data_fim_avulso >= data_inicio_avulso
      );
  END IF;
END $$;

-- Conteúdo programático opcional na tabela cursos (vinculados usam isso para a página 2)
ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS conteudo_programatico text;
