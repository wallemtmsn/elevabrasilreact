# Eleva Brasil — Plataforma de Treinamentos Online

Plataforma web completa da **Eleva Brasil Treinamentos e Consultorias**, empresa especializada em capacitação profissional e normas regulamentadoras, localizada em São João da Barra – RJ.

A aplicação oferece landing page institucional com catálogo de 24 cursos, página de detalhes estilo Udemy, área do aluno com player de aulas e avaliações, e painel administrativo completo.

Desenvolvido por **[NEXFORM - Transformação Digital](https://www.linkedin.com/company/nexformsolu%C3%A7%C3%B5estecnologicas/)**.

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | React + TypeScript | 18.3.1 / 5.6.3 |
| Bundler | Vite | 6.0.1 |
| Estilização | Tailwind CSS | 3.4.15 |
| Roteamento | React Router DOM | 6.28.0 |
| Backend / Auth / DB / Storage | Supabase | 2.47.0 |
| Ícones | lucide-react | 1.7.0 |

---

## Configuração do Ambiente

### 1. Pré-requisitos

- Node.js 18+
- npm 9+
- Projeto configurado no [Supabase](https://supabase.com)

### 2. Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
VITE_WHATSAPP_NUMBER=55DDDNUMERO
```

As variáveis `VITE_*` ficam expostas no bundle de produção — isso é esperado e seguro **desde que as RLS policies do Supabase estejam configuradas corretamente**.

### 3. Scripts disponíveis

```bash
npm install        # Instalar dependências
npm run dev        # Servidor de desenvolvimento (http://localhost:5173)
npm run build      # Build para produção (saída em dist/)
npm run preview    # Pré-visualizar o build de produção
```

---

## Estrutura do Projeto

```
public/
└── assets/img/              # Imagens dos 24 cursos, logo e marca NEXFORM

src/
├── App.tsx                  # Raiz: BrowserRouter + ToastProvider + AuthProvider + AppRoutes
├── main.tsx                 # Entry point React
│
├── styles/
│   └── globals.css          # Tailwind base + classes utilitárias (course-card, etc.)
│
├── components/
│   ├── layout/
│   │   └── Navbar.tsx       # Header fixo: logo, links de nav, ícone WhatsApp, auth
│   └── ui/
│       ├── Avatar.tsx       # Avatar com fallback de iniciais
│       ├── Button.tsx       # Variantes: primary, secondary, ghost, danger
│       ├── Input.tsx        # Input com suporte a suffix (toggle de senha)
│       ├── Modal.tsx        # Modal com backdrop, fecha com Esc
│       └── index.ts         # Barrel export
│
├── contexts/
│   ├── AuthContext.tsx      # Sessão, perfil, role, refresh, detecção de expiração
│   └── ToastContext.tsx     # Notificações globais (auto-dismiss 3,5s)
│
├── lib/
│   └── supabase.ts          # Cliente Supabase (sessão em localStorage)
│
├── hooks/
│   ├── useRefetchOnFocus.ts # Refetch ao voltar para a aba
│   └── useLoadingTimeout.ts # Loading com timeout máximo
│
├── pages/
│   ├── Home/                # Landing page (pública)
│   │   ├── index.tsx        # Hero, Sobre, Serviços, Cursos, Equipe, Contato, Footer
│   │   ├── LoginModal.tsx   # Modal de login com "esqueci a senha"
│   │   └── RegisterModal.tsx# Cadastro: nome, CPF, telefone, e-mail, senha
│   │
│   ├── CursoLanding/        # Página de detalhes do curso (pública)
│   │   ├── index.tsx        # Layout Udemy: hero, sidebar sticky, currículo, instrutor
│   │   └── ModuloAccordion.tsx
│   │
│   ├── CursoPlayer/         # Player de aulas (autenticado)
│   │   ├── index.tsx        # Vídeo + sidebar de módulos + Q&A + avaliações
│   │   └── ProvaModal.tsx   # Fluxo: intro → questões → resultado + gabarito
│   │
│   ├── Painel/              # Área do aluno (autenticado)
│   │   ├── index.tsx        # Layout com sidebar de navegação
│   │   └── sections/
│   │       ├── VisaoGeral.tsx   # Progresso geral, metas, estatísticas
│   │       ├── Cursos.tsx       # Cursos matriculados com barra de progresso
│   │       ├── Certificados.tsx # Certificados emitidos
│   │       ├── Perfil.tsx       # Editar perfil e avatar
│   │       └── Seguranca.tsx    # Troca de senha (requer reautenticação)
│   │
│   ├── Admin/               # Painel administrativo (role admin)
│   │   ├── index.tsx
│   │   └── sections/
│   │       ├── Dashboard.tsx        # Métricas: alunos, cursos, matrículas
│   │       ├── Alunos.tsx           # Lista de alunos cadastrados
│   │       ├── CursosAdmin.tsx      # CRUD de cursos
│   │       ├── ConteudoAdmin.tsx    # CRUD de módulos e aulas (com reordenação)
│   │       ├── MatriculasAdmin.tsx  # Liberar e revogar matrículas
│   │       ├── PerguntasAdmin.tsx   # Q&A por curso com badge de pendências
│   │       └── ProvasAdmin.tsx      # Builder de avaliações: provas e questões
│   │
│   ├── ResetPassword/       # Redefinição de senha via link de e-mail
│   └── Privacidade/         # Política de privacidade
│
├── routes/
│   ├── AppRoutes.tsx        # Definição centralizada de rotas
│   ├── ProtectedRoute.tsx   # Redireciona não autenticados para /
│   └── AdminRoute.tsx       # Redireciona não admins para /painel
│
├── services/                # Camada de acesso ao Supabase
│   ├── authService.ts       # login, register, logout, resetPassword, reauthenticate
│   ├── cursosService.ts     # CRUD de cursos
│   ├── profileService.ts    # Perfil + upload/remoção de avatar (Storage)
│   ├── modulosService.ts    # Módulos, aulas, progresso, reordenação
│   ├── matriculasService.ts # Liberar, revogar, listar matrículas
│   ├── perguntasService.ts  # Q&A: criar, responder, deletar
│   └── provasService.ts     # Provas, questões, submissão via RPC
│
├── types/
│   └── index.ts             # Interfaces TypeScript de todos os modelos
│
└── utils/
    ├── courseDataMap.ts     # Metadados estáticos dos 24 cursos (imagem, NRs, objetivos)
    ├── formatters.ts        # formatCPF, formatPhone, formatCurrency, buildWhatsAppUrl
    └── validators.ts        # isValidEmail, isValidCPF, isValidPhone, isStrongPassword

avaliações/                  # Scripts de automação e documentação (gitignored)
```

---

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Landing page institucional |
| `/cursos/:id` | Público | Detalhes do curso (estilo Udemy) |
| `/politica-de-privacidade` | Público | Política de privacidade |
| `/reset-password` | Público | Redefinição de senha via link de e-mail |
| `/painel` | Autenticado | Dashboard do aluno (admin também acessa) |
| `/curso/:id` | Autenticado | Player de aulas |
| `/admin` | Admin | Painel administrativo |
| `*` | Público | Fallback para `/` |

---

## Funcionalidades Principais

### Landing Page (`/`)

| Seção | Descrição |
|---|---|
| **Hero** | Badge "Matrículas Abertas", título, CTAs e estatísticas |
| **Sobre** | Missão, Visão, Valores e diferenciais da empresa |
| **Serviços** | Pessoas e Empresas / Online e Presencial / Certificação / Consultorias |
| **Cursos** | Grid com 24 cursos e filtro por categoria; clique abre modal com detalhes |
| **Equipe** | 6 cards de instrutores especializados |
| **Contato** | Telefone, e-mail, endereço, redes sociais e widget WhatsApp |
| **Footer** | Marca, links, serviços e crédito NEXFORM |

**Lógica do botão de interesse nos cursos:**

| Situação | Comportamento |
|---|---|
| Não autenticado | Abre WhatsApp com mensagem de interesse |
| Autenticado + matriculado | Navega para `/curso/:id` (player) |
| Autenticado + não matriculado | Abre WhatsApp para solicitar matrícula |

### Player de Aulas (`/curso/:id`)

- Player com suporte a YouTube, Vimeo, OneDrive e MP4/WebM direto
- Sidebar com currículo completo (módulos → aulas) e checkmarks de progresso
- Marcar/desmarcar aulas como concluídas com auto-avanço para a próxima
- Barra de progresso geral em porcentagem
- **Aba Visão Geral** — descrição, carga horária, nº de módulos e aulas
- **Aba Q&A** — aluno faz perguntas por aula; admin responde pelo painel admin
- **Avaliações por módulo** — prova acionada ao concluir todas as aulas do módulo; nota mínima 80%; módulo seguinte bloqueado até aprovação

### Área do Aluno (`/painel`)

| Seção | Descrição |
|---|---|
| **Visão Geral** | Progresso dos cursos, metas e estatísticas de aprendizado |
| **Meu Perfil** | Editar nome, telefone, empresa, cargo, bio; upload/remoção de avatar |
| **Cursos** | Cursos matriculados com barra de progresso; acesso ao player |
| **Certificados** | Certificados emitidos (com download) |
| **Segurança** | Troca de senha com reautenticação obrigatória |

### Painel Administrativo (`/admin`)

| Seção | Descrição |
|---|---|
| **Dashboard** | Métricas gerais: alunos, cursos, matrículas |
| **Alunos** | Lista de alunos com busca |
| **Cursos** | CRUD completo; toggle de visibilidade (`ativo`) |
| **Conteúdo** | Módulos e aulas por curso com reordenação |
| **Matrículas** | Liberar e revogar acesso de alunos por curso |
| **Perguntas e Respostas** | Q&A agrupado por curso com badge de pendências; resposta inline |
| **Avaliações** | Builder de provas por módulo: criar, editar e excluir questões de múltipla escolha |

---

## Catálogo de Cursos (24 no total)

**Operacional (12):** Empilhadeira, Guindaste, Guindauto, PEMT, Escavadeira Hidráulica, Pá Carregadeira, Retro Escavadeira, Trator, Mini Escavadeira, Ponte Rolante, Manipulador Telescópico, Jumbo.

**Desenvolvimento (4):** NR-11 Movimentação de Cargas, Rigger Sinaleiro, Inspeção de Acessórios, Carreira Profissional.

**Normas Regulamentadoras (8):** NR-05 CIPA, NR-06 EPI, NR-10 Eletricidade, NR-12 Máquinas, NR-20 Inflamáveis, NR-33 Espaços Confinados, NR-34 Naval, NR-35 Trabalho em Altura.

---

## Modelos de Dados (Supabase)

### `profiles`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Vinculado ao `auth.users` |
| `nome` | string | Nome completo |
| `cpf` | string | CPF único (somente dígitos) |
| `telefone` | string | Telefone de contato |
| `empresa` | string? | Empresa onde trabalha |
| `cargo` | string? | Cargo atual |
| `bio` | string? | Biografia |
| `foto_url` | string? | URL da foto de perfil (Supabase Storage) |
| `role` | `'aluno' \| 'admin'` | Papel do usuário no sistema |

### `cursos`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `titulo` | string | Nome do curso |
| `descricao` | string? | Descrição detalhada |
| `carga_horaria` | number? | Duração em horas |
| `valor` | number? | Preço |
| `video_url` | string? | Link do vídeo de apresentação |
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
| `video_url` | string? | YouTube, Vimeo, OneDrive ou MP4 direto |
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
| `respondido_por` | uuid? | FK para `profiles` (admin que respondeu) |
| `respondido_em` | timestamp? | Data da resposta |
| `criado_em` | timestamp | Data da pergunta |

### `provas_modulos`
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
| `prova_id` | uuid | FK para `provas_modulos` |
| `enunciado` | string | Texto da pergunta |
| `alternativas` | jsonb | `{ A, B, C, D }` — textos das alternativas |
| `resposta_certa` | `'A'\|'B'\|'C'\|'D'` | Gabarito (nunca exposto ao aluno) |
| `ordem` | number | Posição na prova |

### `tentativas_prova`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador |
| `aluno_id` | uuid | FK para `profiles` |
| `prova_id` | uuid | FK para `provas_modulos` |
| `respostas` | jsonb | `{ questao_id: letra }` — respostas do aluno |
| `acertos` | number | Quantidade de acertos (calculado server-side) |
| `total` | number | Total de questões |
| `aprovado` | boolean | `acertos / total >= 0.8` |
| `feita_em` | timestamp | Data/hora da tentativa |

---

## Segurança

### Medidas implementadas

| Área | Implementação |
|---|---|
| **Gabarito de provas** | `resposta_certa` nunca retornada ao cliente no contexto do aluno; cálculo de acertos 100% server-side via RPC `submeter_tentativa_prova` |
| **Reautenticação** | Troca de senha exige confirmar a senha atual via `signInWithPassword` antes de executar `updatePassword` |
| **Content Security Policy** | Meta tag CSP em `index.html`: `script-src 'self'`, `connect-src *.supabase.co`, `frame-src youtube/vimeo/onedrive`, `object-src 'none'` |
| **iframe sandbox** | `VideoPlayer` inclui `sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-popups allow-forms"` |
| **Upload de avatar** | Valida tipo MIME (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) e tamanho máximo (2 MB) |
| **Variáveis de ambiente** | `.env.example` sem dados reais; `.gitignore` protege `.env`, `*.mjs`, `*credentials*`, `*secrets*` |

### RPC `submeter_tentativa_prova` (Supabase)

Função SQL necessária para a correção server-side das avaliações:

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

### RLS Policies recomendadas (Supabase Dashboard)

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

-- Somente admins (ou o próprio usuário) podem deletar profiles
CREATE POLICY "Somente admin pode deletar"
ON profiles FOR DELETE
USING (
  id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Aluno lê apenas o próprio perfil; admin lê todos
CREATE POLICY "Leitura de profiles"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

---

## Notas Técnicas

### Autenticação e Sessão

- **Sem race condition no login** — `LoginModal` usa `useEffect` aguardando o `user` ser confirmado pelo `AuthContext` antes de fechar e navegar. Evita `ProtectedRoute` ver `user=null` e redirecionar de volta para `/`
- **Token corrompido no localStorage** — `getSession()` tem `.catch()` que chama `signOut()` graciosamente, evitando trava infinita no spinner
- **Sem loop ao trocar de aba** — `onAuthStateChange` não seta `loading=true` após a carga inicial; eventos `TOKEN_REFRESHED` são tratados silenciosamente
- **Sessão expirada** — `SIGNED_OUT` inesperado exibe toast informando o usuário
- **Race condition no registro** — `refreshProfile` usa `user?.id ?? getSession().user.id` como fallback porque `SIGNED_IN` pode disparar antes do INSERT em `profiles` concluir
- **Recuperação de senha** — `authService.resetPassword()` envia link via Supabase; `/reset-password` aguarda evento `PASSWORD_RECOVERY` para exibir o formulário

### Admin

- **Dual access** — Admin acessa `/painel` (visão aluno) e `/admin` via sidebar. `ProtectedRoute` não redireciona admins; o `LoginModal` navega admins para `/admin`
- **Sem N+1 nas avaliações** — `getProvasByModulos()` busca todas as provas dos módulos em uma única query

### Build

- TypeScript com `strict: true` — manter sempre ativo
- Após `npm run build`, verificar `dist/assets/*.js` para confirmar que nenhuma `service_role` key está presente
- Variáveis `VITE_*` aparecem no bundle — isso é esperado; a segurança é garantida pelo RLS

---

## Contato

**Eleva Brasil Treinamentos e Consultorias**
Av. Liberdade, 43 - Grussaí, São João da Barra – RJ
(22) 99858-8802 · elevabrtreinamentos@gmail.com

Desenvolvido por [NEXFORM - Transformação Digital](https://www.linkedin.com/company/nexformsolu%C3%A7%C3%B5estecnologicas/)
