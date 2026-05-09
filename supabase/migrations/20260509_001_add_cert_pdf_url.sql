-- Migration: add_cert_pdf_url
-- C24 — Adiciona coluna pdf_url à tabela certificados.
-- Armazena o path relativo do arquivo no bucket Storage 'certificados'
-- (formato: {aluno_id}/{matricula_id}.pdf).
-- Admin faz upload manual; aluno baixa via signed URL gerada no cliente.

ALTER TABLE public.certificados
  ADD COLUMN IF NOT EXISTS pdf_url text;
