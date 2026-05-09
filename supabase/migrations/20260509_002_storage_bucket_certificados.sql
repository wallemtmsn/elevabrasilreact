-- Migration: storage_bucket_certificados
-- C24 — Cria bucket privado 'certificados' e define RLS policies.
-- Path convention: {aluno_id}/{matricula_id}.pdf
-- Admin: pode INSERT, DELETE e SELECT qualquer objeto.
-- Aluno: pode SELECT apenas objetos cujo primeiro segmento do path = seu próprio auth.uid().

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados', 'certificados', false)
ON CONFLICT (id) DO NOTHING;

-- Admin: upload
CREATE POLICY "admin_insert_certs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certificados'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin: sobrescrever (UPDATE necessário para upsert)
CREATE POLICY "admin_update_certs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'certificados'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin: excluir
CREATE POLICY "admin_delete_certs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'certificados'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin: ler tudo
CREATE POLICY "admin_read_certs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificados'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Aluno: ler apenas o próprio cert
CREATE POLICY "aluno_read_own_cert"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificados'
  AND split_part(name, '/', 1) = auth.uid()::text
);
