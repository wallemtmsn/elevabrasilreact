# Eleva Brasil — Plataforma de Treinamentos e Consultorias

Aplicação web da **Eleva Brasil**, empresa especializada em treinamentos e consultorias localizada em São João da Barra – RJ. A plataforma oferece landing page com catálogo de 24 cursos, página de detalhes de curso estilo Udemy, área do aluno e painel administrativo.

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
│   ├── AuthContext.tsx       # Sessão do usuário + logout imediato
│   └── ToastContext.tsx      # Notificações globais
├── lib/
│   └── supabase.ts          # Cliente Supabase
├── pages/
│   ├── Home/
│   │   ├── index.tsx        # Landing page completa (ver seções abaixo)
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
│   │   └── index.tsx        # Vídeo + sidebar de currículo com progresso
│   ├── Admin/               # Área administrativa (rota admin)
│   │   ├── index.tsx
│   │   └── sections/
│   │       ├── Dashboard.tsx
│   │       ├── CursosAdmin.tsx
│   │       ├── Alunos.tsx
│   │       ├── Matriculas.tsx
│   │       └── ConteudoAdmin.tsx
│   └── Privacidade/         # Política de privacidade
├── routes/
│   ├── AppRoutes.tsx        # Definição de rotas
│   ├── ProtectedRoute.tsx   # Redireciona não autenticados
│   └── AdminRoute.tsx       # Redireciona não admins
├── services/
│   ├── authService.ts       # Login, cadastro, logout, troca de senha
│   ├── cursosService.ts     # CRUD de cursos (getAll, getAtivos, getById, create, update, delete)
│   ├── matriculasService.ts # Matrículas: liberar, revogar, listar por aluno/curso
│   ├── modulosService.ts    # Módulos e aulas: CRUD, progresso, reordenação
│   └── profileService.ts    # Atualização de perfil
├── types/
│   └── index.ts             # Interfaces: Profile, Curso, Modulo, Aula, ProgressoAula, Toast
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
| `/painel` | Aluno autenticado | Dashboard do aluno |
| `/curso/:id` | Aluno autenticado | Player de aulas do curso |
| `/admin` | Admin autenticado | Painel administrativo |

---

## Página de Detalhes do Curso (`/cursos/:id`)

Página pública inspirada no layout da Udemy, criada a partir dos dados do Supabase combinados com o mapa estático `courseDataMap.ts`.

**Seções:**
- **Hero escuro** — breadcrumb, título, descrição, badges de categoria e carga horária
- **Sidebar sticky** (desktop) — preview do curso, preço, botão CTA, lista de benefícios
- **O que você vai aprender** — grid de 2 colunas com objetivos de aprendizagem
- **Conteúdo do curso** — accordion de módulos e aulas com totalizadores; exibe banner informativo se o currículo ainda não foi cadastrado
- **Normas regulamentadoras** — lista das NRs aplicáveis ao curso
- **Instrutor** — card institucional da Eleva Brasil
- **Sticky bottom bar** (mobile) — preço + CTA de matrícula

**Lógica do botão CTA:**

| Situação | Comportamento |
|---|---|
| Não autenticado | Abre WhatsApp com mensagem de interesse no curso |
| Autenticado + matriculado | Navega para `/curso/:id` (player de aulas) |
| Autenticado + não matriculado | Abre WhatsApp para solicitar matrícula |

---

## Seções da Landing Page (`/`)

| Seção | Descrição |
|---|---|
| **Hero** | Badge "Matrículas Abertas", título com gradiente, CTAs e stats (24 cursos, 10 anos, 200+ alunos, 8 NRs) |
| **Sobre** | Texto institucional com lista de diferenciais e cards de Missão / Visão / Valores |
| **Banner de Serviços** | Faixa navy com ícones: Pessoas e Empresas, Online e Presencial, Certificação, Consultorias |
| **Cursos** | Grid de 24 cursos com filtro por categoria (Todos / Operacional / Desenvolvimento / NR). Clique navega para a página de detalhes `/cursos/:id` |
| **Equipe** | 6 cards de expertise dos instrutores |
| **Contato** | Cards de telefone/email/endereço, redes sociais, formulário que abre WhatsApp preenchido, mapa embed |
| **Footer** | 4 colunas: marca, contato, serviços, redes sociais + crédito NEXFORM |
| **Modais** | ApoioModal (informações da NEXFORM), LoginModal, RegisterModal |
| **Flutuantes** | Botão WhatsApp (canto direito) e Voltar ao topo (canto esquerdo) |

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

---

## Configuração do Ambiente

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

## Contato

**Eleva Brasil Treinamentos e Consultorias**
Av. Liberdade, 43 - Grussaí, São João da Barra – RJ
(22) 99858-8802 · elevabrtreinamentos@gmail.com

Site desenvolvido por [NEXFORM - Transformação Digital](https://www.linkedin.com/company/nexformsolu%C3%A7%C3%B5estecnologicas/)
