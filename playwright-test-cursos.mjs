/**
 * Teste Playwright: verifica se os cursos permanecem carregados após troca de aba.
 *
 * Executar:
 *   node playwright-test-cursos.mjs
 *
 * Requer: npx playwright install chromium  (caso os browsers não estejam instalados)
 */

import { chromium } from 'playwright'

const URL  = 'http://localhost:5173/'
const EMAIL = 'noah@noah.com'
const SENHA = 'Noah1310'

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 })
  const context = await browser.newContext()
  const page    = await context.newPage()

  try {
    // ── 1. Abre o app ────────────────────────────────────────────────────────
    console.log('\n→ Abrindo ' + URL)
    await page.goto(URL)

    // ── 2. Abre modal de login ────────────────────────────────────────────────
    console.log('→ Clicando em "Entrar" (navbar)')
    // Pega o primeiro botão visível com texto "Entrar"
    await page.locator('button', { hasText: 'Entrar' }).first().click()
    await page.waitForTimeout(600)

    // ── 3. Preenche credenciais ───────────────────────────────────────────────
    console.log('→ Preenchendo credenciais')
    await page.fill('input[type="email"]',    EMAIL)
    await page.fill('input[type="password"]', SENHA)

    // ── 4. Submete o formulário ───────────────────────────────────────────────
    console.log('→ Submetendo login')
    await page.locator('form').locator('button[type="submit"]').click()

    // ── 5. Aguarda navegação para /painel ─────────────────────────────────────
    console.log('→ Aguardando navegação para /painel...')
    await page.waitForURL('**/painel', { timeout: 15_000 })
    console.log('✅ Login realizado com sucesso')

    // ── 6. Clica em "Cursos" na sidebar ──────────────────────────────────────
    console.log('→ Navegando para seção "Cursos"')
    await page.locator('nav').locator('button', { hasText: 'Cursos' }).click()

    // ── 7. Aguarda heading "Meus Cursos" ──────────────────────────────────────
    console.log('→ Aguardando carregamento dos cursos...')
    await page.waitForSelector('h2:has-text("Meus Cursos")', { timeout: 10_000 })

    // ── 8. Conta os cards antes da troca de aba ───────────────────────────────
    const acessarBtns  = page.locator('button', { hasText: 'Acessar curso' })
    const cursosBefore = await acessarBtns.count()
    const emptyBefore  = await page.locator('text=Nenhum curso disponível').count()

    if (cursosBefore > 0) {
      console.log(`✅ ${cursosBefore} curso(s) carregado(s) antes da troca de aba`)
    } else if (emptyBefore > 0) {
      console.log('⚠️  Nenhum curso disponível para este usuário (estado vazio exibido)')
    } else {
      console.log('⚠️  Heading presente mas sem cards nem mensagem de vazio — loading ainda ativo?')
    }

    // ── 9. Abre nova aba e aguarda 1 segundo ──────────────────────────────────
    console.log('\n→ Abrindo nova aba')
    const novaAba = await context.newPage()
    await novaAba.goto('about:blank')
    await novaAba.waitForTimeout(1_000)

    // ── 10. Volta para a aba dos cursos ───────────────────────────────────────
    console.log('→ Voltando para a aba dos cursos')
    await page.bringToFront()
    await page.waitForTimeout(800)

    // ── 11. Verifica estado após troca de aba ─────────────────────────────────
    const headingAfter = await page.locator('h2:has-text("Meus Cursos")').count()
    const cursosAfter  = await acessarBtns.count()
    const emptyAfter   = await page.locator('text=Nenhum curso disponível').count()

    console.log('\n────────────── RESULTADO ──────────────')

    if (headingAfter > 0) {
      console.log('✅ Heading "Meus Cursos" ainda visível')
    } else {
      console.log('❌ Heading "Meus Cursos" DESAPARECEU')
    }

    if (cursosBefore > 0) {
      if (cursosAfter === cursosBefore) {
        console.log(`✅ Todos os ${cursosAfter} curso(s) mantidos`)
        console.log('\n🎉 PASS — cursos permanecem carregados após troca de aba\n')
      } else if (cursosAfter === 0) {
        console.log('❌ Cursos SUMIRAM após troca de aba (0 cards visíveis)')
        console.log('\n💥 FAIL — página não manteve os cursos carregados\n')
      } else {
        console.log(`⚠️  Cursos parciais: ${cursosAfter} de ${cursosBefore} visíveis`)
      }
    } else if (emptyBefore > 0) {
      if (emptyAfter > 0) {
        console.log('✅ Estado vazio mantido corretamente')
        console.log('\n🎉 PASS — estado mantido após troca de aba\n')
      } else {
        console.log('❌ FAIL — estado vazio desapareceu após troca de aba\n')
      }
    } else {
      if (headingAfter > 0) {
        console.log('✅ PASS — heading presente após troca de aba\n')
      } else {
        console.log('❌ FAIL — a página não exibe nenhum conteúdo após troca de aba\n')
      }
    }

    console.log('→ Feche o navegador manualmente ou pressione Ctrl+C para encerrar.')
    await new Promise(() => {}) // mantém aberto para inspeção visual

  } catch (err) {
    console.error('\n❌ Erro durante o teste:', err.message || err)
    await browser.close()
    process.exit(1)
  }
}

main()
