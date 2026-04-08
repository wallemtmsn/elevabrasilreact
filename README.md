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
│       ├── Input.tsx
│       └── Modal.tsx
├── contexts/
│   ├── AuthContext.tsx       # Sessão do usuário — getSession + onAuthStateChange sem double fetch
│   └── ToastContext.tsx      # Notificações globais
├── lib/
│   └── supabase.ts          # Cliente Supabase (localStorage para sessão)
├── pages/
│   ├── Home/
│   │   ├── index.tsx        # Landing page completa + CourseModal com info dos cursos
│   │   ├── LoginModal.tsx   # Modal de login
│   │   └── RegisterModal.tsx# Modal de cadastro (CPF, telefone, senha)
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
│   │   └── index.tsx        # Vídeo + sidebar de currículo + abas Visão Geral e Q&A
│   ├── Admin/               # Área administrativa (rota admin)
│   │   ├── index.tsx
│   │   └── sections/
│   │       ├── Dashboard.tsx
│   │       ├── CursosAdmin.tsx
│   │       ├── Alunos.tsx
│   │       ├── MatriculasAdmin.tsx
│   │       ├── ConteudoAdmin.tsx
│   │       └── PerguntasAdmin.tsx  # Q&A agrupado por curso com resposta inline
│   └── Privacidade/         # Política de privacidade
├── routes/
│   ├── AppRoutes.tsx        # Definição de rotas
│   ├── ProtectedRoute.tsx   # Redireciona não autenticados; admin → /admin
│   └── AdminRoute.tsx       # Redireciona não admins
├── services/
│   ├── authService.ts       # Login, cadastro, logout, troca de senha
│   ├── cursosService.ts     # CRUD de cursos (getAll, getAtivos, getById, create, update, delete)
│   ├── matriculasService.ts # Matrículas: liberar, revogar, listar por aluno/curso
│   ├── modulosService.ts    # Módulos e aulas: CRUD, progresso, reordenação
│   ├── perguntasService.ts  # Q&A: getByAula, getAll (admin), fazer, responder, deletar
│   └── profileService.ts    # Atualização de perfil
├── types/
│   └── index.ts             # Interfaces: Profile, Curso, Modulo, Aula, ProgressoAula, Pergunta, Toast
└── utils/
    ├── courseDataMap.ts     # Mapa estático dos 24 cursos (imagem, normas, objetivos por slug)
    ├── formatters.ts        # formatCurrency, buildWhatsAppUrl, formatCPF, formatPhone
    └── validators.ts        # isValidEmail, isValidCPF, isValidPhone, isStrongPassword
```

---

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Landing page completa |
| `/cursos/:id` | Público | Página de detalhes do curso (estilo Udemy) |
| `/politica-de-privacidade` | Público | Política de privacidade |
| `/painel` | Aluno autenticado | Dashboard do aluno (admin é redirecionado para `/admin`) |
| `/curso/:id` | Aluno autenticado | Player de aulas do curso |
| `/admin` | Admin autenticado | Painel administrativo |

---

## Funcionalidades do Player de Aulas (`/curso/:id`)

- Player de vídeo com suporte a YouTube, Vimeo e MP4/WebM direto
- Sidebar com currículo completo (módulos + aulas) e progresso individual
- Marcar/desmarcar aulas como concluídas com auto-avanço
- Barra de progresso geral em porcentagem
- **Aba Visão Geral** — descrição do curso, carga horária, nº de módulos e aulas
- **Aba Perguntas e Respostas** — aluno faz perguntas por aula; admin responde pelo painel

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

---

## Configuração do Ambiente

O projeto inclui `.gitignore` na raiz protegendo `.env`, `node_modules/`, `dist/` e pastas externas como `playwright-mcp-main/`.

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
- **Sem loop ao trocar de aba** — `AuthContext.onAuthStateChange` não seta `loading=true` após a carga inicial. Eventos `TOKEN_REFRESHED` (disparados pelo Supabase ao voltar de outra aba do navegador) são tratados silenciosamente sem travar a tela
- **Admin redirecionado corretamente** — `ProtectedRoute` detecta `isAdmin` e redireciona para `/admin`; `LoginModal` também navega direto para `/admin` ao logar como admin, sem passar pelo `/painel`
- **Sessão armazenada em localStorage** — sem uso de cookies; padrão do Supabase client para SPAs

### Painel Admin
- **Criação de aulas sem travamento** — `reloadModulos()` no `ConteudoAdmin` foi desacoplado do bloco `try/finally`, garantindo que `setSaving(false)` sempre execute independente do resultado do reload

---

## Contato

**Eleva Brasil Treinamentos e Consultorias**
Av. Liberdade, 43 - Grussaí, São João da Barra – RJ
(22) 99858-8802 · elevabrtreinamentos@gmail.com

Site desenvolvido por [NEXFORM - Transformação Digital](https://www.linkedin.com/company/nexformsolu%C3%A7%C3%B5estecnologicas/)
