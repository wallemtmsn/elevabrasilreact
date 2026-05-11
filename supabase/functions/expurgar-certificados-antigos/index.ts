// Edge Function: expurgar-certificados-antigos
// Remove certificados com mais de 6 meses desde o upload do PDF.
// Para cada cert vencido:
//   1. Deleta o objeto do bucket 'certificados' via Storage API
//   2. Reseta a matrícula (certificado_id = NULL, certificado_emitido = false)
//   3. Deleta o registro da tabela certificados
//
// Idempotente — múltiplas chamadas no mesmo dia não geram efeitos colaterais.
// Agendada via pg_cron + pg_net (rodando diariamente às 03:00 UTC).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const corte = new Date()
  corte.setMonth(corte.getMonth() - 6)

  const { data: certs, error: selErr } = await supabase
    .from('certificados')
    .select('id, pdf_url, matricula_id')
    .not('pdf_url', 'is', null)
    .lt('criado_em', corte.toISOString())

  if (selErr) {
    return new Response(
      JSON.stringify({ error: selErr.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let removidos = 0
  const erros: string[] = []

  for (const cert of certs ?? []) {
    try {
      if (cert.pdf_url) {
        const { error: stErr } = await supabase.storage
          .from('certificados')
          .remove([cert.pdf_url])
        if (stErr) throw new Error(`storage: ${stErr.message}`)
      }

      if (cert.matricula_id) {
        const { error: matErr } = await supabase
          .from('matriculas')
          .update({ certificado_id: null, certificado_emitido: false })
          .eq('id', cert.matricula_id)
        if (matErr) throw new Error(`matricula: ${matErr.message}`)
      }

      const { error: delErr } = await supabase
        .from('certificados')
        .delete()
        .eq('id', cert.id)
      if (delErr) throw new Error(`cert: ${delErr.message}`)

      removidos++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      erros.push(`${cert.id}: ${msg}`)
    }
  }

  return new Response(
    JSON.stringify({ removidos, erros, total_candidatos: certs?.length ?? 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
