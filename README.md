# Eleva Brasil — Plataforma de Treinamentos e Consultorias

Aplicação web da **Eleva Brasil**, empresa especializada em treinamentos e consultorias localizada em São João da Barra – RJ. A plataforma oferece landing page com catálogo de 24 cursos, página de detalhes de curso estilo Udemy, área do aluno com player de aulas e painel administrativo completo.

Desenvolvido por **NEXFORM - Transformação Digital**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite 6 |
| Estilização | Tailwind CSS 3 |
| Roteamento | React Router DOM 6 |
| Backend / Auth / DB | Supabase |
| Ícones | lucide-react |

---

## Estrutura do Projeto

```
public/
└── assets/img/              # Imagens dos cursos, logo e NEXFORM

src/
├── App.tsx                  # Raiz da aplicação (BrowserRouter + Providers)
├── main.tsx                 # Entry point
├── styles/
│   └── globals.css          # Tailwind + classes utilitárias (course-card, course-tab, etc.)
├── components/
│   ├── layout/
│   │   └── Navbar.tsx       # Header fixo: logo, nav, WhatsApp, botão Apoio, auth
│   └── ui/
│       ├── Avatar.tsx
│       ├── Button.tsx
│       ├── Input.tsx        # Suporta suffix (ícone) para toggle de senha
│       └── Modal.tsx
├── contexts/
│   ├── AuthContext.tsx       # Sessão do usuário — getSession + onAuthStateChange + toast expiração
│   └── ToastContext.tsx      # Notificações globais
├── lib/
│   └── supabase.ts          # Cliente Supabase (localStorage para sessão)
├── pages/
│   ├── Home/
│   │   ├── index.tsx        # Landing page completa + CourseModal com info dos cursos
│   │   ├── LoginModal.tsx   # Modal de login com toggle de senha e fluxo "esqueci a senha"
│   │   └── RegisterModal.tsx# Modal de cadastro (CPF, telefone, senha)
│   ├── ResetPassword/       # Redefinição de senha (rota pública /reset-password)
│   │   └── index.tsx        # Aguarda evento PASSWORD_RECOVERY → formulário → confirmação
│   ├── CursoLanding/        # Página de detalhes do curso (pública)
│   │   ├── index.tsx        # Layout estilo Udemy: hero, sidebar, currículo, instrutor
│   │   └── ModuloAccordion.tsx # Accordion de módulos e aulas
│   ├── Painel/              # Área do aluno (rota protegida)
│   │   ├── index.tsx        # Layout com sidebar
│   │   └── sections/
│   │       ├── VisaoGeral.tsx
│   │       ├── Cursos.tsx
│   │       ├── Certificados.tsx
│   │       ├── Perfil.tsx
│   │       └── Seguranca.tsx
│   ├── CursoPlayer/         # Player de aulas (rota protegida)
│   │   ├── index.tsx        # Vídeo + sidebar + Q&A + bloqueio de módulo por avaliação
│   │   └── ProvaModal.tsx   # Modal de avaliação: intro → questões → resultado/gabarito
│   ├── Admin/               # Área administrativa (rota admin)
│   │   ├── index.tsx
│   │   └── sections/
│   │       ├── Dashboard.tsx
│   │       ├── CursosAdmin.tsx
│   │       ├── Alunos.tsx
│   │       ├── MatriculasAdmin.tsx
│   │       ├── ConteudoAdmin.tsx
│   │       ├── PerguntasAdmin.tsx  # Q&A agrupado por curso com resposta inline
│   │       └── ProvasAdmin.tsx     # CRUD de avaliações: criar prova, adicionar/editar/excluir questões
│   └── Privacidade/         # Política de privacidade
├── routes/
│   ├── AppRoutes.tsx        # Definição de rotas (inclui /reset-password)
│   ├── ProtectedRoute.tsx   # Redireciona não autenticados; admins acessam /painel normalmente
│   └── AdminRoute.tsx       # Redireciona não admins
├── services/
│   ├── authService.ts       # Login, cadastro, logout, resetPassword
│   ├── cursosService.ts     # CRUD de cursos
│   ├── matriculasService.ts # Matrículas: liberar, revogar, listar
│   ├── modulosService.ts    # Módulos e aulas: CRUD, progresso, reordenação
│   ├── perguntasService.ts  # Q&A: getByAula, getAll (admin), fazer, responder, deletar
│   ├── profileService.ts    # Atualização de perfil
│   └── provasService.ts     # Avaliações: CRUD de provas/questões, submeter tentativa, histórico
├── types/
│   └── index.ts             # Interfaces: Profile, Curso, Modulo, Aula, Prova, Questao, TentativaProva…
└── utils/
    ├── courseDataMap.ts     # Mapa estático dos 24 cursos (imagem, normas, objetivos por slug)
    ├── formatters.ts        # formatCurrency, buildWhatsAppUrl, formatCPF, formatPhone
    └── validators.ts        # isValidEmail, isValidCPF, isValidPhone, isStrongPassword

avaliações/                  # Documentação e scripts de automação (ver guia dentro)
├── guia-cadastro-questoes.md
├── test_add_questao.mjs     # (gitignored — contém credenciais)
├── test_bulk_questoes.mjs   # (gitignored — contém credenciais)
└── screenshots/             # (gitignored)
```

---

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Landing page completa |
| `/cursos/:id` | Público | Página de detalhes do curso (estilo Udemy) |
| `/politica-de-privacidade` | Público | Política de privacidade |
| `/reset-password` | Público | Redefinição de senha via link de e-mail |
| `/painel` | Autenticado (aluno ou admin) | Dashboard do aluno — admin também acessa e vê botão "Painel Admin" na sidebar |
| `/curso/:id` | Autenticado (aluno ou admin) | Player de aulas do curso |
| `/admin` | Admin autenticado | Painel administrativo — possui link "Painel do aluno" na sidebar |

---

## Funcionalidades do Player de Aulas (`/curso/:id`)

- Player de vídeo com suporte a YouTube, Vimeo e MP4/WebM direto
- Sidebar com currículo completo (módulos + aulas) e progresso individual
- Marcar/desmarcar aulas como concluídas com auto-avanço
- Barra de progresso geral em porcentagem
- **Aba Visão Geral** — descrição do curso, carga horária, nº de módulos e aulas
- **Aba Perguntas e Respostas** — aluno faz perguntas por aula; admin responde pelo painel
- **Avaliações por módulo** — ao concluir todas as aulas de um módulo, a prova é acionada automaticamente. Nota mínima 80% para aprovação. Módulos seguintes ficam bloqueados até aprovação

---

## Painel Administrativo (`/admin`)

| Seção | Descrição |
|---|---|
| **Dashboard** | Métricas gerais (alunos, cursos, matrículas) |
| **Alunos** | Listagem de alunos cadastrados |
| **Cursos** | CRUD de cursos |
| **Conteúdo** | Gerenciamento de módulos e aulas por curso |
| **Matrículas** | Liberar e revogar acesso de alunos aos cursos |
| **Perguntas e Respostas** | Q&A agrupado por curso — responder e excluir perguntas com badge de pendências |
| **Avaliações** | CRUD de provas por módulo: criar prova, adicionar/editar/excluir questões de múltipla escolha |

---

## Página de Detalhes do Curso (`/cursos/:id`)

Página pública inspirada no layout da Udemy.

**Seções:** Hero, sidebar sticky com CTA, "O que você vai aprender", currículo accordion, normas regulamentadoras, card de instrutor, sticky bottom bar (mobile).

**Lógica do botão CTA:**

| Situação | Comportamento |
|---|---|
| Não autenticado | Abre WhatsApp com mensagem de interesse |
| Autenticado + matriculado | Navega para `/curso/:id` (player) |
| Autenticado + não matriculado | Abre WhatsApp para solicitar matrícula |

---

## Seções da Landing Page (`/`)

| Seção | Descrição |
|---|---|
| **Hero** | Badge "Matrículas Abertas", título, CTAs e stats |
| **Sobre** | Texto institucional, diferenciais, Missão/Visão/Valores |
| **Banner de Serviços** | Pessoas e Empresas, Online e Presencial, Certificação, Consultorias |
| **Cursos** | Grid de 24 cursos com filtro por categoria. Clique abre modal com info do curso (descrição, normas, botão de interesse via WhatsApp) |
| **Equipe** | 6 cards de expertise dos instrutores |
| **Contato** | Telefone/email/endereço, redes sociais, formulário WhatsApp, mapa embed |
| **Footer** | 4 colunas: marca, contato, serviços, redes sociais + crédito NEXFORM |

---

## Catálogo de Cursos (24 no total)

### Operacional (12)
Empilhadeira, Guindaste, Guindauto, PEMT, Escavadeira Hidráulica, Pá Carregadeira, Retro Escavadeira, Trator, Mini Escavadeira, Ponte Rolante, Manipulador Telescópico, Jumbo.

### Desenvolvimento (4)
NR-11 Movimentação de Cargas, Rigger Sinaleiro, Inspeção de Acessórios, Carreira Profissional.

### Normas Regulamentadoras (8)
NR-05 CIPA, NR-06 EPI, NR-10 Eletricidade, NR-12 Máquinas, NR-20 Inflamáveis, NR-33 Espaços Confinados, NR-34 Naval, NR-35 Trabalho em Altura.

---

## Modelos de Dados (Supabase)

### `profiles`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Vinculado ao `auth.users` |
| `nome` | string | Nome completo |
| `cpf` | string | CPF único (apenas dígitos) |
| `telefone` | string | Telefone de contato |
| `empresa` | string? | Empresa onde trabalha |
| `cargo` | string? | Cargo atual |
| `bio` | string? | Biografia |
| `foto_url` | string? | URL da foto de perfil |
| `role` | `'aluno' \| 'admin'` | Papel do usuário |

### `cursos`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `titulo` | string | Nome do curso |
| `descricao` | string? | Descrição |
| `carga_horaria` | number? | Duração em horas |
| `valor` | number? | Preço |
| `video_url` | string? | Link do vídeo |
| `ativo` | boolean | Visibilidade na landing page |

### `modulos`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `curso_id` | uuid | FK para `cursos` |
| `titulo` | string | Nome do módulo |
| `ordem` | number | Posição no currículo |

### `aulas`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `modulo_id` | uuid | FK para `modulos` |
| `titulo` | string | Nome da aula |
| `descricao` | string? | Descrição |
| `video_url` | string? | YouTube, Vimeo ou MP4 direto |
| `duracao_min` | number? | Duração em minutos |
| `ordem` | number | Posição no módulo |

### `matriculas`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `aluno_id` | uuid | FK para `profiles` |
| `curso_id` | uuid | FK para `cursos` |
| `liberado_em` | timestamp | Data de liberação pelo admin |

### `progresso_aulas`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `aluno_id` | uuid | FK para `profiles` |
| `aula_id` | uuid | FK para `aulas` |
| `concluida` | boolean | Se a aula foi concluída |
| `concluida_em` | timestamp? | Data de conclusão |

### `perguntas_aulas`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `aula_id` | uuid | FK para `aulas` |
| `aluno_id` | uuid | FK para `profiles` |
| `pergunta` | string | Texto da pergunta |
| `resposta` | string? | Resposta do admin |
| `respondido_por` | uuid? | FK para `profiles` (admin) |
| `respondido_em` | timestamp? | Data da resposta |
| `criado_em` | timestamp | Data da pergunta |

**RLS aplicado:** alunos inserem apenas as próprias perguntas; admins podem responder e deletar qualquer pergunta; todos podem visualizar.

### `provas`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `modulo_id` | uuid | FK para `modulos` (1 prova por módulo) |
| `titulo` | string | Título da prova |
| `criado_em` | timestamp | Data de criação |

### `questoes`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `prova_id` | uuid | FK para `provas` |
| `enunciado` | string | Texto da pergunta |
| `alternativas` | jsonb | `{ A, B, C, D }` — textos das alternativas |
| `resposta_certa` | `'A'\|'B'\|'C'\|'D'` | Gabarito |
| `ordem` | number | Posição na prova |

### `tentativas_provas`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `aluno_id` | uuid | FK para `profiles` |
| `prova_id` | uuid | FK para `provas` |
| `respostas` | jsonb | `{ questao_id: letra }` — respostas do aluno |
| `acertos` | number | Quantidade de acertos |
| `total` | number | Total de questões |
| `aprovado` | boolean | `acertos / total >= 0.8` |
| `feita_em` | timestamp | Data da tentativa |

---

## Configuração do Ambiente

O projeto inclui `.gitignore` na raiz protegendo `.env`, `node_modules/`, `dist/`, pastas externas como `playwright-mcp-main/` e os scripts/screenshots da pasta `avaliações/` (que contêm credenciais hardcoded).

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
VITE_WHATSAPP_NUMBER=5522998588802
```

---

## Scripts

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Pré-visualizar build
npm run preview
```

---

## Notas Técnicas

### Autenticação
- **Login sem travamento** — `LoginModal` aguarda o `user` ser confirmado pelo `AuthContext` via `useEffect` antes de fechar e navegar. Elimina o race condition onde `ProtectedRoute` via `user=null` e redirecionava de volta para `/`
- **Sem loop ao trocar de aba** — `AuthContext.onAuthStateChange` não seta `loading=true` após a carga inicial. Eventos `TOKEN_REFRESHED` (disparados pelo Supabase ao voltar de outra aba) são tratados silenciosamente
- **Token corrompido no localStorage** — `getSession()` tem `.catch()` que chama `signOut()` e desbloqueia o `loading`, evitando que a página trave no spinner caso o refresh token seja inválido
- **Sessão expirada notifica o usuário** — `onAuthStateChange` detecta `SIGNED_OUT` inesperado e exibe um toast informando que a sessão expirou
- **Nunca chamar `signOut()` dentro de `onAuthStateChange`** — corromperia o estado interno do cliente Supabase, travando todas as requisições subsequentes
- **Admin acessa os dois painéis** — `ProtectedRoute` não redireciona mais admins; admins acessam `/painel` normalmente e veem um botão amarelo "Painel Admin" na sidebar. O `LoginModal` navega admins para `/admin` ao logar; o painel admin possui link "Painel do aluno" na sidebar footer
- **Modal de boas-vindas — novo cadastro** — após o registro, `RegisterModal` navega para `/painel` com `state: { novoAluno: true }`; `PainelPage` detecta e exibe modal com spinner e mensagem "Estamos criando seu painel de Aluno" por 2,5 s
- **Modal de boas-vindas — retorno** — no login bem-sucedido, `LoginModal` navega com `state: { bemVindoDeVolta: true }`; `PainelPage` exibe modal com avatar (inicial do nome), "Bem-vindo(a) de volta, [primeiro nome]!" e botão "Continuar" (auto-fecha em 3 s)
- **Race condition no registro** — ao criar conta, `SIGNED_IN` dispara antes do INSERT em `profiles`, fazendo `refreshProfile` retornar cedo (`user` ainda null no estado React). Corrigido em `AuthContext.refreshProfile`: usa `user?.id ?? getSession().user.id` como fallback
- **Sessão armazenada em localStorage** — sem uso de cookies; padrão do Supabase client para SPAs
- **Recuperação de senha** — `authService.resetPassword()` envia link via Supabase; `/reset-password` aguarda evento `PASSWORD_RECOVERY` para exibir o formulário de nova senha

### Painel Admin
- **Criação de aulas sem travamento** — `reloadModulos()` no `ConteudoAdmin` foi desacoplado do bloco `try/finally`, garantindo que `setSaving(false)` sempre execute
- **Avaliações** — `ProvasAdmin` faz uma única query para buscar todas as provas dos módulos do curso (evita N+1). A aprovação do aluno é calculada no cliente: `acertos / total >= 0.8`

### Segurança (auditoria aplicada)
- **Gabarito nunca exposto** — `getProvaByModulo` exclui `resposta_certa` do SELECT público; cálculo de acertos feito server-side via RPC `submeter_tentativa_prova` (Supabase SQL)
- **Reautenticação corrigida** — `Seguranca.tsx` usava `profile.nome` como e-mail; corrigido para `user.email`
- **Content Security Policy** — `<meta http-equiv="Content-Security-Policy">` em `index.html` com `script-src 'self'`, `connect-src *.supabase.co`, `frame-src youtube/vimeo/onedrive`, `object-src 'none'`
- **iframe sandbox** — `VideoPlayer` em `CursoPlayer` inclui `sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-popups allow-forms"` para isolar o conteúdo embutido
- **`.env.example` sem dados reais** — URL do Supabase e número WhatsApp substituídos por placeholders genéricos
- **`.gitignore` ampliado** — `*.mjs`, `**/*.mjs`, `*credentials*`, `*secrets*` para prevenir scripts com credenciais hardcoded

---

## Contato

**Eleva Brasil Treinamentos e Consultorias**
Av. Liberdade, 43 - Grussaí, São João da Barra – RJ
(22) 99858-8802 · elevabrtreinamentos@gmail.com

Site desenvolvido por [NEXFORM - Transformação Digital](https://www.linkedin.com/company/nexformsolu%C3%A7%C3%B5estecnologicas/)
