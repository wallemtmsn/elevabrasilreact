-- Migration: schedule_expurgo_certificados
-- Agenda a Edge Function `expurgar-certificados-antigos` para rodar diariamente
-- às 03:00 UTC (00:00 BRT) via pg_cron + pg_net.
--
-- A Edge Function é pública (sem JWT) e idempotente — múltiplas chamadas no
-- mesmo dia não causam efeitos colaterais, pois só remove cert com
-- `criado_em < now() - 6 months`.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expurgar-certificados-6m') THEN
    PERFORM cron.unschedule('expurgar-certificados-6m');
  END IF;
END $$;

SELECT cron.schedule(
  'expurgar-certificados-6m',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://lksrbemlqbfmstzhjohx.supabase.co/functions/v1/expurgar-certificados-antigos',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := '{}'::jsonb
  );
  $$
);
