-- Migration: add_certificados_schema_and_rls
-- Fase 0 — Tarefas 1–5 do Plano de Implementação Eleva Brasil

-- ============================================================
-- NOVOS CAMPOS EM CURSOS
-- ============================================================
ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS nr_referencia  text,
  ADD COLUMN IF NOT EXISTS exige_pratico  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS validade_meses integer NOT NULL DEFAULT 12;

-- ============================================================
-- NOVOS CAMPOS EM MATRICULAS
-- ============================================================
ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS teorico_concluido   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS teorico_data        timestamptz,
  ADD COLUMN IF NOT EXISTS pratico_concluido   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pratico_data        timestamptz,
  ADD COLUMN IF NOT EXISTS certificado_emitido boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificado_id      uuid;

-- ============================================================
-- TABELA CERTIFICADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificados (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id uuid        NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  aluno_id     uuid        NOT NULL REFERENCES public.profiles(id),
  curso_id     uuid        NOT NULL REFERENCES public.cursos(id),
  numero_serie text        UNIQUE NOT NULL,
  data_emissao timestamptz NOT NULL DEFAULT now(),
  data_validade date,
  tipo         text        NOT NULL DEFAULT 'completo'
                           CHECK (tipo IN ('teorico', 'completo')),
  criado_em    timestamptz NOT NULL DEFAULT now()
);

-- FK retroativa: matriculas.certificado_id → certificados
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matriculas_certificado_id_fkey'
  ) THEN
    ALTER TABLE public.matriculas
      ADD CONSTRAINT matriculas_certificado_id_fkey
      FOREIGN KEY (certificado_id) REFERENCES public.certificados(id);
  END IF;
END $$;

-- Sequence para número de série ELEVA-YYYY-NNNNNN
CREATE SEQUENCE IF NOT EXISTS public.certificados_seq START 1;

-- Índices
CREATE INDEX IF NOT EXISTS idx_cert_aluno ON public.certificados(aluno_id);
CREATE INDEX IF NOT EXISTS idx_cert_curso  ON public.certificados(curso_id);
CREATE INDEX IF NOT EXISTS idx_cert_data   ON public.certificados(data_emissao);

-- ============================================================
-- HABILITAR RLS (tabelas antes desprotegidas)
-- ============================================================
ALTER TABLE public.matriculas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES — matriculas
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='matriculas' AND policyname='Aluno vê próprias matrículas') THEN
    CREATE POLICY "Aluno vê próprias matrículas" ON public.matriculas FOR SELECT USING (aluno_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='matriculas' AND policyname='Admin gerencia matrículas') THEN
    CREATE POLICY "Admin gerencia matrículas" ON public.matriculas FOR ALL
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- ============================================================
-- POLICIES — progresso_aulas
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='progresso_aulas' AND policyname='Aluno gerencia próprio progresso') THEN
    CREATE POLICY "Aluno gerencia próprio progresso" ON public.progresso_aulas FOR ALL USING (aluno_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- POLICIES — modulos
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='modulos' AND policyname='Leitura de módulos') THEN
    CREATE POLICY "Leitura de módulos" ON public.modulos FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='modulos' AND policyname='Admin gerencia módulos') THEN
    CREATE POLICY "Admin gerencia módulos" ON public.modulos FOR ALL
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- ============================================================
-- POLICIES — aulas
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='aulas' AND policyname='Leitura de aulas') THEN
    CREATE POLICY "Leitura de aulas" ON public.aulas FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='aulas' AND policyname='Admin gerencia aulas') THEN
    CREATE POLICY "Admin gerencia aulas" ON public.aulas FOR ALL
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- ============================================================
-- POLICIES — certificados
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certificados' AND policyname='Aluno vê próprios certificados') THEN
    CREATE POLICY "Aluno vê próprios certificados" ON public.certificados FOR SELECT USING (aluno_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certificados' AND policyname='Admin gerencia certificados') THEN
    CREATE POLICY "Admin gerencia certificados" ON public.certificados FOR ALL
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;
