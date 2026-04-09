# Guia: Cadastro de Questões no Painel Admin

Documentação do processo de cadastro de questões nas avaliações dos módulos do Eleva Brasil.

---

## Pré-requisitos

- Servidor de desenvolvimento rodando: `npm run dev` (padrão: `http://localhost:5173`)
- Conta admin ativa no Supabase
- Para automação: `playwright` instalado no projeto (`npm install --save-dev playwright`)

---

## Via Interface (manual)

### 1. Acessar o painel admin
Navegue para `http://localhost:5173/admin` e faça login com uma conta de administrador.

### 2. Ir para Avaliações
Na barra lateral esquerda, clique em **Avaliações**.

### 3. Selecionar o curso
No dropdown "Curso:", escolha o curso desejado. Os módulos carregam automaticamente no painel esquerdo.

### 4. Selecionar o módulo
Clique no módulo onde deseja cadastrar a avaliação. O painel direito mostrará o editor.

> **Se o módulo não tiver prova:** aparece o botão "Criar prova". Clique nele primeiro para habilitar o cadastro de questões.

### 5. Adicionar questão
- Com questões existentes: clique no botão **"Questão"** no canto superior direito do painel
- Com prova vazia: clique no botão **"Adicionar questão"** no centro da tela

### 6. Preencher o formulário
O modal "Nova questão" contém:
- **Enunciado** — textarea com o texto da pergunta
- **Alternativa A / B / C / D** — um campo de texto para cada opção
- **Resposta correta** — botões A B C D (o selecionado fica verde)

### 7. Salvar
Clique em **"Adicionar questão"** no rodapé do modal. O modal fecha automaticamente ao salvar com sucesso.

> **Recomendação:** cadastre no mínimo 10 questões por módulo. O sistema exibe um aviso enquanto houver menos de 10.

---

## Via Automação (Playwright)

### Script para 1 questão: `test_add_questao.mjs`
Adiciona uma única questão pré-definida no módulo 4 do curso Movimentação de Cargas.

```bash
node avaliações/test_add_questao.mjs
```

### Script para múltiplas questões: `test_bulk_questoes.mjs`
Adiciona um array de questões em sequência. Edite o array `questoes` no início do arquivo para personalizar.

```bash
node avaliações/test_bulk_questoes.mjs
```

### Estrutura de cada questão no array

```js
{
  enunciado: 'Texto da pergunta?',
  A: 'Primeira alternativa',
  B: 'Segunda alternativa',
  C: 'Terceira alternativa',
  D: 'Quarta alternativa',
  resposta: 'B'   // letra maiúscula: 'A' | 'B' | 'C' | 'D'
}
```

### Para adaptar para outro curso/módulo

No `test_bulk_questoes.mjs`, localize as linhas abaixo e ajuste:

```js
// Seleciona curso — regex que casa com o nome do curso
const idx = options.findIndex(o => /movimenta|carga/i.test(o));

// Seleciona módulo pelo índice (0 = primeiro módulo)
const modulo4 = page.locator('div.divide-y button').nth(3); // nth(3) = módulo 4
```

---

## Lições aprendidas

### Seletores que funcionam

| Elemento | Seletor usado |
|---|---|
| Botão "Entrar" na home | `page.locator('button, a').filter({ hasText: /^entrar$/i }).first()` |
| Modal de login | `page.waitForSelector('role=dialog', { state: 'visible' })` |
| Lista de módulos | `page.locator('div.divide-y button')` |
| Textarea do enunciado | `page.locator('textarea').last()` |
| Inputs das alternativas | `page.locator('input[placeholder="Texto da alternativa A"]')` |
| Botões A/B/C/D da resposta | `page.locator('button').filter({ hasText: /^B$/ }).last()` |
| Botão salvar no modal | `page.locator('button').filter({ hasText: /adicionar questão/i }).last()` |

### Armadilhas encontradas

1. **`button[type="submit"]` pega o botão errado** — a página inicial tem um formulário de contato com `type="submit"`. Sempre use o seletor do modal diretamente.

2. **`input[type="text"]` não encontra os inputs das alternativas** — o componente `Input` do projeto não define `type` explicitamente no HTML. Use `placeholder` como seletor.

3. **`supabase.auth.signOut()` dentro de `onAuthStateChange` trava requests** — chamar signOut dentro do callback de mudança de estado corrompe o estado interno do cliente Supabase, fazendo todas as requisições subsequentes travarem indefinidamente. Nunca chame signOut dentro desse callback.

4. **Módulo sem prova bloqueia o botão "Questão"** — se o módulo não tem prova, o botão "Questão" não aparece. É necessário clicar em "Criar prova" primeiro.

5. **Login pode redirecionar para `/painel` em vez de `/admin`** — depende do timing do carregamento do perfil. O script verifica a URL e navega para `/admin` manualmente se necessário.

---

## Referências visuais

| Screenshot | Descrição |
|---|---|
| [screenshots/screenshot_prova_criada.png](screenshots/screenshot_prova_criada.png) | Prova recém-criada, pronta para receber questões |
| [screenshots/screenshot_modal_aberto.png](screenshots/screenshot_modal_aberto.png) | Modal "Nova questão" com campos vazios |
| [screenshots/screenshot_questao_preenchida.png](screenshots/screenshot_questao_preenchida.png) | Formulário preenchido antes de salvar |
| [screenshots/screenshot_10_questoes.png](screenshots/screenshot_10_questoes.png) | Resultado final com 10 questões cadastradas |
