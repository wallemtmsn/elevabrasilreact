-- Migration: rpc_expurgar_certificados_antigos
-- A lógica de expurgo agora vive na Edge Function `expurgar-certificados-antigos`
-- porque o Supabase bloqueia DELETE direto em storage.objects (trigger protect_delete).
--
-- Esta migration apenas garante que qualquer função SQL antiga seja removida.

DROP FUNCTION IF EXISTS public.expurgar_certificados_antigos();
