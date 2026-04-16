# 🔐 Guia de Correções de Segurança — Eleva Brasil React

> **Para o Claude Code:** Este arquivo contém o contexto completo do projeto e uma lista
> ordenada de problemas de segurança a serem resolvidos. Siga as instruções abaixo
> **rigorosamente**, corrigindo **um problema de cada vez** e aguardando confirmação
> do usuário antes de avançar para o próximo.

---

## 📋 Contexto do Projeto

**Nome:** Eleva Brasil Treinamentos — Plataforma de Cursos Online
**Stack:** React 18 + TypeScript + Vite + Supabase + TailwindCSS
**Repositório:** `wallemtmsn/elevabrasilreact`

### Estrutura relevante

```
src/
  contexts/
    AuthContext.tsx        # Contexto de autenticação global
  services/
    authService.ts         # Funções de login, registro, senha
    profileService.ts      # CRUD de perfis de usuário
    provasService.ts       # Lógica de provas e tentativas
  pages/
    Painel/sections/
      Seguranca.tsx        # Tela de troca de senha
      Perfil.tsx           # Upload de avatar
    CursoPlayer/
      index.tsx            # Player de vídeo (iframe)
      ProvaModal.tsx       # Modal de avaliação
  utils/
    validators.ts          # Validações de CPF, senha, email, etc.
    formatters.ts          # Formatação e sanitização
  routes/
    AdminRoute.tsx         # Proteção de rotas de admin
    ProtectedRoute.tsx     # Proteção de rotas autenticadas
.env.example               # Variáveis de ambiente de exemplo
index.html                 # HTML raiz da aplicação
vite.config.ts             # Configuração do Vite
```

### Tecnologias e dependências principais

- **Supabase JS** `^2.47.0` — autenticação, banco de dados e storage
- **React Router DOM** `^6.28.0` — roteamento SPA
- **Vite** `^6.0.1` — build tool
- **TypeScript** `^5.6.3` com `strict: true`

---

## 🎯 Regras de Comportamento para o Claude Code

1. **Um problema por vez.** Nunca corrija dois problemas na mesma rodada.
2. **Antes de editar**, leia o arquivo completo relevante para entender o contexto.
3. **Após cada correção**, exiba o resumo amigável no formato definido abaixo.
4. **Nunca avance** para o próximo item sem o usuário digitar `ok`, `próximo`,
   `continuar` ou qualquer confirmação explícita.
5. **Se uma correção exigir mudança no Supabase** (RLS, Edge Function), instrua
   o usuário com os passos exatos — você não tem acesso ao dashboard do Supabase.
6. **Não altere** lógica de negócio, estilos ou funcionalidades que não sejam
   relacionadas à correção em andamento.
7. **Ao concluir todos os itens**, exiba o resumo final de encerramento.

---

## 📊 Formato de Confirmação Após Cada Correção

Após cada correção, exiba **exatamente** neste formato:

```
╔══════════════════════════════════════════════════════════════╗
║  ✅  CORREÇÃO [N/13] CONCLUÍDA — [Nome do Problema]         ║
╚══════════════════════════════════════════════════════════════╝

📁 Arquivo(s) alterado(s):
   • src/caminho/arquivo.ts

🔧 O que foi feito:
   Descrição clara em linguagem simples do que foi modificado
   e por que a mudança resolve o problema de segurança.

⚠️  Ação manual necessária (se houver):
   Instrução clara de qualquer passo que o usuário precisa
   fazer fora do código (ex: painel do Supabase).

🧪 Como testar:
   1. Passo a passo simples para validar que a correção funciona.

─────────────────────────────────────────────────────────────
  Digite "próximo" para avançar para a correção [N+1/13] →
─────────────────────────────────────────────────────────────
```

---

## 🛠️ Lista de Correções — Ordem de Prioridade

---

### CORREÇÃO 1 de 13 — 🔴 CRÍTICO — ✅ CONCLUÍDA

> **O que foi feito:**
> - `Seguranca.tsx`: substituído `profile.nome` por `user!.email!` na chamada de `reauthenticate`
> - `AuthContext.tsx`: adicionado `profileLoaded` ref para evitar re-fetches desnecessários
>   em eventos `SIGNED_IN` (reautenticação) e `USER_UPDATED` (troca de senha), corrigindo
>   race condition que impedia o toast de sucesso de ser exibido
>
> **Arquivos alterados:** `src/pages/Painel/sections/Seguranca.tsx`, `src/contexts/AuthContext.tsx`

**Bug: profile.nome usado como e-mail na reautenticação**

**Problema:** Em `src/pages/Painel/sections/Seguranca.tsx`, a função de troca de senha
chama `authService.reauthenticate(profile.nome, form.current)`, passando o **nome do
usuário** onde deveria passar o **e-mail**. O `authService.reauthenticate` usa esse valor
como campo `email` no `signInWithPassword` do Supabase, que falha sempre — pois nenhum
usuário tem o próprio nome como e-mail. Resultado: **a troca de senha nunca funciona.**

**Arquivo:** `src/pages/Painel/sections/Seguranca.tsx`

**O que fazer:**
- Importar `useAuth` e extrair `user` (além do `profile` já existente)
- Substituir `profile.nome` por `user!.email!` na chamada de `reauthenticate`

**Código atual (vulnerável):**
```tsx
const { profile } = useAuth()
// ...
await authService.reauthenticate(profile.nome, form.current)
```

**Código corrigido:**
```tsx
const { profile, user } = useAuth()
// ...
await authService.reauthenticate(user!.email!, form.current)
```

---

### CORREÇÃO 2 de 13 — 🔴 CRÍTICO — ✅ CONCLUÍDA

> **O que foi feito:**
> - `provasService.ts`: `getProvaByModulo` agora usa `select` sem `resposta_certa`; criada
>   `getProvaByModuloAdmin` (com `resposta_certa`) exclusiva para o painel admin
> - `provasService.ts`: `submeterTentativa` agora chama `supabase.rpc('submeter_tentativa_prova')`
>   — cálculo de acertos 100% server-side
> - `ProvaModal.tsx`: gabarito usa `resultado.questoes_corretas` (retornado pela RPC) para ✓/✗
> - `types/index.ts`: `Questao.resposta_certa` tornado opcional; `TentativaProva` recebe
>   `questoes_corretas?: string[]`
> - `ProvasAdmin.tsx`: trocado `getProvaByModulo` por `getProvaByModuloAdmin`
>
> **Ação manual pendente:** criar a RPC `submeter_tentativa_prova` no Supabase SQL Editor
> (SQL completo abaixo, na seção original)
>
> **Arquivos alterados:** `src/services/provasService.ts`, `src/types/index.ts`,
> `src/pages/CursoPlayer/ProvaModal.tsx`, `src/pages/Admin/sections/ProvasAdmin.tsx`

**Validação e correção de provas movida para o servidor**

**Problema:** Em `src/services/provasService.ts`, a query `getProvaByModulo` retorna
ao cliente o campo `resposta_certa` de cada questão (gabarito completo visível no
DevTools). A função `submeterTentativa` calcula `acertos` e `aprovado` **no frontend**
e envia os valores calculados ao banco — permitindo que qualquer aluno intercepte o
request e manipule o resultado.

**Arquivo:** `src/services/provasService.ts`

**O que fazer:**
1. Alterar `getProvaByModulo` para **excluir** `resposta_certa` do select das questões
   (usar `select('*, questoes(id, prova_id, enunciado, alternativas, ordem)')`)
2. Alterar `submeterTentativa` para **não calcular** acertos no cliente — enviar apenas
   as `respostas` brutas do aluno e deixar o banco calcular via Supabase RPC ou aceitar
   a lógica com os dados que chegam do banco (sem expor gabarito)
3. Atualizar o tipo `Questao` em `src/types/index.ts` para tornar `resposta_certa`
   opcional (`resposta_certa?: 'A' | 'B' | 'C' | 'D'`), sinalizando que pode não
   estar presente no contexto do aluno

**Ação manual necessária no Supabase:**
Criar uma RPC (função SQL) chamada `submeter_tentativa_prova` que recebe
`(p_aluno_id uuid, p_prova_id uuid, p_respostas jsonb)`, calcula os acertos server-side
comparando com `resposta_certa` e insere em `tentativas_prova`. Isso garante que o
gabarito **nunca saia do banco**.

Modelo de SQL para a função:
```sql
CREATE OR REPLACE FUNCTION submeter_tentativa_prova(
  p_aluno_id uuid,
  p_prova_id uuid,
  p_respostas jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_questao RECORD;
  v_acertos int := 0;
  v_total   int := 0;
  v_aprovado boolean;
  v_result  json;
BEGIN
  FOR v_questao IN
    SELECT id, resposta_certa FROM questoes WHERE prova_id = p_prova_id
  LOOP
    v_total := v_total + 1;
    IF (p_respostas ->> v_questao.id::text) = v_questao.resposta_certa THEN
      v_acertos := v_acertos + 1;
    END IF;
  END LOOP;

  v_aprovado := v_total > 0 AND (v_acertos::float / v_total) >= 0.8;

  INSERT INTO tentativas_prova (aluno_id, prova_id, respostas, acertos, total, aprovado)
  VALUES (p_aluno_id, p_prova_id, p_respostas, v_acertos, v_total, v_aprovado)
  RETURNING to_json(tentativas_prova.*) INTO v_result;

  RETURN v_result;
END;
$$;
```

---

### CORREÇÃO 3 de 13 — 🟠 ALTO — ✅ CONCLUÍDA

> **O que foi feito:**
> - `.env.example`: URL real do Supabase e número de WhatsApp substituídos por placeholders;
>   comentários explicativos adicionados em cada variável
>
> **Arquivo alterado:** `.env.example`

**Proteção do arquivo .env.example**

**Problema:** O `.env.example` contém a URL real do projeto Supabase
(`https://lksrbemlqbfmstzhjohx.supabase.co`) e o número de telefone WhatsApp real,
expondo o Project ID publicamente no repositório.

**Arquivo:** `.env.example`

**O que fazer:**
- Substituir a URL real por um placeholder genérico
- Substituir o número de WhatsApp por um placeholder
- Adicionar comentários explicativos em cada variável

**Resultado esperado:**
```env
# URL do seu projeto no Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co

# Chave anon/public do Supabase → Settings → API → Project API keys
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Número WhatsApp para contato (somente dígitos, com DDI)
# Exemplo: 5522999998888
VITE_WHATSAPP_NUMBER=55DDDNUMERO
```

---

### CORREÇÃO 4 de 13 — 🟠 ALTO — ✅ CONCLUÍDA

> **O que foi feito:**
> - `index.html`: adicionada `<meta http-equiv="Content-Security-Policy">` com:
>   `script-src 'self'`, `style-src 'self' fonts.googleapis.com 'unsafe-inline'`,
>   `font-src 'self' fonts.gstatic.com`, `connect-src 'self' *.supabase.co wss://*.supabase.co`,
>   `frame-src youtube.com youtube-nocookie.com player.vimeo.com`,
>   `img-src 'self' data: blob: *.supabase.co`, `object-src 'none'`,
>   `base-uri 'self'`, `form-action 'self'`
>
> **Arquivo alterado:** `index.html`

**Content Security Policy (CSP) no index.html**

**Problema:** A aplicação não define nenhuma Content Security Policy, permitindo que
qualquer XSS bem-sucedido execute scripts externos arbitrários, exfiltre tokens de
sessão e faça requisições para qualquer domínio.

**Arquivo:** `index.html`

**O que fazer:**
- Adicionar uma `<meta>` tag de CSP no `<head>` que:
  - Permite scripts apenas do próprio domínio (`'self'`)
  - Permite estilos do domínio + Google Fonts (necessário para Montserrat/Inter)
  - Permite iframes apenas do YouTube e Vimeo (necessário para os vídeos dos cursos)
  - Permite conexões apenas ao domínio do Supabase (API e WebSocket)
  - Permite imagens do Supabase Storage e data URIs

---

### CORREÇÃO 5 de 13 — 🟠 ALTO — ✅ CONCLUÍDA

> **O que foi feito:**
> - `CursoPlayer/index.tsx`: adicionado `sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-popups allow-forms"` no `<iframe>` do `VideoPlayer`
> - `allow-popups` e `allow-forms` foram necessários para o player do OneDrive funcionar (autenticação interna e envio de dados de reprodução)
> - CSP `frame-src` em `index.html` também recebeu `https://1drv.ms https://onedrive.live.com` (vídeos hospedados no OneDrive, não no YouTube/Vimeo)
>
> **Arquivo alterado:** `src/pages/CursoPlayer/index.tsx`

**Atributo sandbox no iframe de vídeo**

**Problema:** O componente `VideoPlayer` em `src/pages/CursoPlayer/index.tsx` renderiza
iframes do YouTube e Vimeo sem o atributo `sandbox`. Isso concede ao conteúdo embutido
acesso irrestrito ao `window.parent` e ao DOM da aplicação.

**Arquivo:** `src/pages/CursoPlayer/index.tsx`

**O que fazer:**
- Localizar o componente `VideoPlayer` (função interna do arquivo)
- Adicionar `sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"`
  no elemento `<iframe>`
- Manter os atributos `allow` e `allowFullScreen` existentes

---

### CORREÇÃO 6 de 13 — 🟠 ALTO
**Validação de tipo MIME no upload de avatar**

**Problema:** Em `src/pages/Painel/sections/Perfil.tsx`, o upload de foto de perfil
valida apenas o tamanho do arquivo (2 MB), mas não verifica o tipo MIME. Um arquivo
malicioso renomeado para `.jpg` passa pela validação sem restrição.

**Arquivo:** `src/pages/Painel/sections/Perfil.tsx`

**O que fazer:**
- Na função `handleAvatarUpload`, adicionar verificação de `file.type` contra a lista
  `['image/jpeg', 'image/png', 'image/webp', 'image/gif']` **antes** da checagem de tamanho
- No elemento `<input type="file">` (buscar pelo `ref={fileRef}`), adicionar o atributo
  `accept="image/jpeg,image/png,image/webp,image/gif"` para filtragem no browser

---

### CORREÇÃO 7 de 13 — 🟠 ALTO
**Headers de segurança HTTP**

**Problema:** Nenhum header HTTP de segurança está configurado: sem `X-Frame-Options`
(clickjacking), sem `X-Content-Type-Options`, sem `Referrer-Policy`.

**Arquivo:** `vite.config.ts` (para ambiente de desenvolvimento)

**O que fazer:**
- Adicionar `server.headers` no `vite.config.ts` com os headers de segurança para dev
- Criar o arquivo `public/_headers` para Netlify **OU** instruir sobre `vercel.json`
  para produção — perguntar ao usuário qual plataforma de deploy está sendo usada

**Headers a configurar:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

### CORREÇÃO 8 de 13 — 🟡 MÉDIO
**Validação matemática completa do CPF**

**Problema:** Em `src/utils/validators.ts`, `isValidCPF` verifica apenas se o CPF tem
11 dígitos. CPFs matematicamente inválidos como `00000000000`, `11111111111` ou
`12345678901` passam na validação.

**Arquivo:** `src/utils/validators.ts`

**O que fazer:**
- Reescrever `isValidCPF` com o algoritmo completo de validação da Receita Federal:
  1. Rejeitar sequências repetidas (000...000, 111...111, ..., 999...999)
  2. Calcular o primeiro dígito verificador (módulo 11 sobre os 9 primeiros dígitos)
  3. Calcular o segundo dígito verificador (módulo 11 sobre os 10 primeiros dígitos)
  4. Comparar com os dígitos reais informados

---

### CORREÇÃO 9 de 13 — 🟡 MÉDIO
**Política de senha mais forte**

**Problema:** Em `src/utils/validators.ts`, `isStrongPassword` aceita qualquer senha
com 6 ou mais caracteres. Senhas como `123456` ou `abcdef` são consideradas válidas.

**Arquivo:** `src/utils/validators.ts`

**O que fazer:**
- Atualizar `isStrongPassword` para exigir: mínimo 8 caracteres, ao menos uma letra
  maiúscula e ao menos um número
- Atualizar a mensagem de `helpText` e `error` em `Seguranca.tsx` e `RegisterModal.tsx`
  para refletir os novos requisitos
- Manter compatibilidade: usuários já cadastrados com senhas antigas não são afetados
  (a validação é apenas no cadastro/alteração)

---

### CORREÇÃO 10 de 13 — 🟡 MÉDIO
**Sanitização de inputs inconsistente**

**Problema:** A função `sanitizeInput` em `src/utils/formatters.ts` escapa HTML entities
manualmente, mas é aplicada de forma inconsistente. O React já escapa texto renderizado
em JSX (`{variavel}`), tornando a `sanitizeInput` redundante onde está aplicada e
criando risco de duplo-escaping (ex: `&amp;lt;` ao invés de `<`).

**Arquivos:** `src/utils/formatters.ts`, `src/pages/Admin/sections/Alunos.tsx`,
`src/pages/Home/RegisterModal.tsx`

**O que fazer:**
- **Remover** a função `sanitizeInput` de `formatters.ts`
- **Remover** todas as chamadas a `sanitizeInput(...)` nos arquivos que a utilizam
  (o React já garante proteção contra XSS ao renderizar `{texto}` em JSX)
- **Remover** a importação de `sanitizeInput` de todos os arquivos que a importam
- Adicionar um comentário explicativo onde a função foi removida, documentando que
  o React protege contra XSS nativamente

---

### CORREÇÃO 11 de 13 — 🟡 MÉDIO — ✅ CONCLUÍDA

> **O que foi feito:**
> - `.gitignore`: regras `avaliações/*.mjs` substituídas por `*.mjs`, `**/*.mjs`,
>   `*credentials*`, `*secrets*` e `avaliações/.env`
> - `avaliações/.env.example`: criado com variáveis `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
>   sem valores reais
>
> **Arquivos alterados:** `.gitignore`, `avaliações/.env.example` (novo)

**Prevenção de scripts de automação com credenciais**

**Problema:** O `.gitignore` documenta que `avaliações/*.mjs` contém credenciais
hardcoded. Isso cria risco latente de vazamento acidental.

**Arquivo:** `.gitignore`

**O que fazer:**
- Adicionar ao `.gitignore` uma seção de proteção mais ampla para evitar vazamentos:
  ```
  # Scripts com credenciais — nunca versionar
  *.mjs
  **/*.mjs
  *credentials*
  *secrets*
  ```
- Criar o arquivo `avaliações/.env.example` com as variáveis que os scripts precisam,
  sem valores reais
- Adicionar `avaliações/.env` no `.gitignore`

---

### CORREÇÃO 12 de 13 — 🔵 BAIXO
**Playwright fora do projeto principal**

**Problema:** `playwright` está nas `devDependencies` do projeto principal, acoplando
uma ferramenta de automação de browser ao código da aplicação.

**Arquivo:** `package.json`

**O que fazer:**
- Remover `"playwright": "^1.59.1"` das `devDependencies` do `package.json`
- Executar `npm install` para atualizar o `package-lock.json`
- Adicionar uma nota no `README.md` explicando que testes E2E estão em pasta separada

---

### CORREÇÃO 13 de 13 — ⚠️ AÇÃO MANUAL
**Auditoria de RLS Policies no Supabase**

**Problema:** Operações críticas como `updateRole` (promoção a admin) e `delete` em
profiles são protegidas apenas pelo frontend. Se as Row Level Security (RLS) policies
do Supabase não estiverem corretas, qualquer usuário autenticado pode chamar a API
diretamente e escalar privilégios.

**Esta correção não envolve código** — requer acesso ao Supabase Dashboard.

**O que fazer (instruir o usuário):**
- Abrir o Supabase Dashboard → Table Editor → `profiles` → RLS Policies
- Verificar e criar as seguintes policies:

```sql
-- Somente admins podem alterar o campo 'role'
CREATE POLICY "Somente admin pode alterar role"
ON profiles FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Somente admins podem deletar profiles (além do próprio)
CREATE POLICY "Somente admin pode deletar"
ON profiles FOR DELETE
USING (
  id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Usuário pode ler apenas o próprio profile; admin lê todos
CREATE POLICY "Leitura de profiles"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

- Verificar também a tabela `questoes`: a coluna `resposta_certa` deve ser inacessível
  para o role `anon` e `authenticated` (apenas `service_role` e a RPC de correção)
- Verificar a tabela `tentativas_prova`: alunos só devem poder inserir registros onde
  `aluno_id = auth.uid()` e nunca atualizar registros existentes

---

## 🏁 Mensagem de Encerramento

Após a **Correção 13**, exibir:

```
╔══════════════════════════════════════════════════════════════════╗
║  🎉  AUDITORIA CONCLUÍDA — TODAS AS CORREÇÕES APLICADAS!       ║
╚══════════════════════════════════════════════════════════════════╝

Parabéns! As 13 correções de segurança foram aplicadas.

📊 Resumo do trabalho realizado:
   ✅  2 vulnerabilidades CRÍTICAS corrigidas
   ✅  5 vulnerabilidades ALTAS corrigidas
   ✅  3 vulnerabilidades MÉDIAS corrigidas
   ✅  1 vulnerabilidade BAIXA corrigida
   ⚠️  2 ações manuais no Supabase Dashboard necessárias

🚀 Próximos passos recomendados:
   1. Executar `npm run build` e verificar que não há erros de TypeScript
   2. Testar o fluxo completo de troca de senha
   3. Testar o fluxo de prova com DevTools aberto — confirmar que
      resposta_certa não aparece mais nas respostas da API
   4. Acessar securityheaders.com com a URL de produção após o deploy
   5. Revisar as RLS policies no Supabase Dashboard (Correção 13)

📄 Relatório PDF de referência: auditoria_seguranca_elevabrasil.pdf

O projeto agora está em condições de ir para produção com segurança.
```

---

## 📝 Notas Técnicas Adicionais

- **Nunca** commite arquivos `.env`, `.env.local` ou similares
- O Supabase anon key é projetada para ser pública, mas **o RLS é obrigatório**
  para que ela seja segura
- A anon key aparece no bundle de produção (VITE_ vars são públicas por design) —
  isso é esperado e seguro **se** o RLS estiver configurado corretamente
- Após rodar `npm run build`, inspecionar o bundle em `dist/assets/*.js` para
  confirmar que nenhuma secret key (service_role) está presente
- O TypeScript com `strict: true` já está configurado — mantê-lo sempre ativo
