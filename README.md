# MyCash

Sistema de controle financeiro pessoal leve, rápido e focado em edição inline de transações com motor robusto de recorrências.

## Objetivo

Aplicação de finanças pessoais desenhada sob a filosofia **Plug-and-Play** com infraestrutura descentralizada na borda (*Edge Computing*), minimizando dependência de serviços externos pagos. Implantável na camada gratuita da Cloudflare ou em servidor doméstico.

## Features

- Autenticação nativa com WebCrypto API (PBKDF2)
- Onboarding automatizado (conta "CAIXA" + categorias padrão)
- IDs ofuscados via SnowflakeID + Hashids (segurança contra enumeração)
- API RESTful com Hono.js no Cloudflare Workers
- Frontend React com edição inline via TanStack Table
- Banco de dados compatível com Cloudflare D1, PostgreSQL ou SQLite
- Storage S3-compatible (Cloudflare R2 ou MinIO)
- Soft delete para preservação de histórico

## Stack Tecnológica

### Frontend
- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **TanStack Table** (grid de transações)

### Backend
- **Hono.js** (framework web ultra-rápido)
- **Cloudflare Workers** (runtime V8 Isolation)
- **Drizzle ORM** (abstração SQL)
- **WebCrypto API** (hash de senhas)

### Infraestrutura
- **Cloudflare D1** (banco SQLite na borda)
- **Cloudflare R2** (storage S3-compatible)
- **pnpm workspaces** (monorepo)

## Estrutura do Projeto

```
mycash/
  apps/
    api/              # Backend Hono.js (Cloudflare Workers)
    web/              # Frontend React + Vite
  packages/
    database/         # Schema Drizzle ORM compartilhado
  docs/               # Documentação técnica
```

## Pré-requisitos

- **Node.js** >= 20
- **pnpm** >= 9.15
- **Cloudflare Wrangler** (para deploy)

## Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/mycash.git
cd mycash

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente da API
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

Edite `apps/api/.dev.vars` com suas chaves:

```env
JWT_SECRET=sua-chave-secreta-jwt-minimo-32-caracteres
HASHIDS_SALT=salt-para-ofuscacao-de-ids
```

## Desenvolvimento Local

```bash
# Gerar migrações do banco
pnpm db:generate

# Rodar em modo desenvolvimento (API + Frontend)
pnpm dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:8787

### Scripts Disponíveis

```bash
pnpm dev              # Dev paralelo (API + Web)
pnpm build            # Build de produção
pnpm typecheck        # Verificação de tipos TypeScript
pnpm lint             # Linting do código
pnpm db:generate      # Gerar migrações Drizzle
pnpm db:migrate       # Aplicar migrações no banco
```

## Configuração

### Variáveis de Ambiente (API)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `JWT_SECRET` | Chave secreta para assinatura de tokens JWT | Sim |
| `HASHIDS_SALT` | Salt para ofuscação de IDs via Hashids | Sim |
| `S3_ENDPOINT` | Endpoint do storage S3-compatible (R2/MinIO) | Não |
| `S3_ACCESS_KEY` | Access key do storage | Não |
| `S3_SECRET_KEY` | Secret key do storage | Não |

### Banco de Dados

O schema está em `packages/database/src/schema.ts`. Tabelas principais:

- **users** - Contas de acesso (email único, senha hasheada)
- **accounts** - Contas financeiras (CAIXA, bancos, carteiras)
- **categories** - Categorias de transações (income/expense)
- **transactions** - Lançamentos financeiros
- **recurrence_rules** - Regras de recorrência

## Deploy

### Cloudflare Workers

```bash
# Login no Cloudflare
wrangler login

# Deploy da API
pnpm --filter @mycash/api run deploy

# Criar banco D1
wrangler d1 create mycash

# Atualizar wrangler.toml com o database_id gerado

# Aplicar migrações
wrangler d1 execute mycash --file=packages/database/drizzle/*.sql
```

### Self-Hosting

Para execução local com Node.js/Bun:

```bash
# Build do frontend
pnpm --filter @mycash/web run build

# Servir frontend (ex: nginx, caddy)
# Rodar API com Bun ou Node
cd apps/api && bun run src/index.ts
```

Configure variáveis de ambiente no servidor e use PostgreSQL/SQLite local.

## Segurança

### Arquitetura de IDs

- **Backend:** SnowflakeID (64-bit baseado em timestamp)
- **Frontend:** Hashids (strings alfanuméricas ofuscadas)
- **Proteção:** Impede ataques de enumeração (IDOR)

### Autenticação

- **Senhas:** PBKDF2 via WebCrypto API (100.000 iterações, SHA-256)
- **Sessão:** JWT em cookies `HttpOnly`, `Secure`, `SameSite=Strict`
- **Validação:** Email único (HTTP 409), senha mínima 8 caracteres

### Soft Delete

Campo `deleted_at` em todas as tabelas principais para preservação de histórico e recuperação de dados.

## Documentação

- [Guia Arquitetural Completo](docs/guia.md)
- [Sprint 01 - Planejamento](docs/sprints/sprint-01/01-planejamento.md)
- [Sprint 01 - Proposta BD](docs/sprints/sprint-01/02-proposta-bd.md)

## Contribuição

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona X'`)
4. Push (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Diretrizes

- Navegação por teclado obrigatória em componentes de grid
- Testes unitários (Vitest) para lógica de recorrência
- Typecheck deve passar (`pnpm typecheck`)
- IDs sempre ofuscados via Hashids no frontend

## Licença

MIT