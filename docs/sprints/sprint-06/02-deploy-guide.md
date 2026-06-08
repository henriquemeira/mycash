# Guia de Deploy em Producao - Cloudflare

Documento passo-a-passo para implantar o MyCash na infraestrutura da Cloudflare (Workers, D1, R2, Pages).

---

## Prerequisitos

- Conta na Cloudflare (plano gratuito e suficiente)
- Node.js >= 20
- pnpm >= 9.15
- Wrangler CLI autenticado (`wrangler login`)
- Dominio configurado na Cloudflare (opcional, mas recomendado)

---

## Passo 1 - Autenticar o Wrangler

```bash
npx wrangler login
```

Abrira o navegador para autorizar o Wrangler a acessar sua conta Cloudflare. Confirme a autorizacao.

---

## Passo 2 - Criar o Banco de Dados D1

```bash
npx wrangler d1 create mycash-prod
```

O comando retornara algo como:

```
✅ Successfully created DB 'mycash-prod'

[[d1_databases]]
binding = "DB"
database_name = "mycash-prod"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copie o `database_id` gerado e atualize o `apps/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "mycash-prod"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # <-- substitua aqui
migrations_dir = "../../packages/database/drizzle"
```

---

## Passo 3 - Aplicar as Migracoes no D1 de Producao

As migracoes (0000 a 0005) criam as tabelas: `users`, `accounts`, `categories`, `transactions`, `recurrence_rules` e `attachments`.

```bash
npx wrangler d1 migrations apply mycash-prod --remote --config apps/api/wrangler.toml
```

> **Importante:** E necessario passar o caminho do `wrangler.toml` com `--config` (ou executar o comando dentro do diretorio `apps/api/`).

> **Nota:** O Wrangler le automaticamente as migracoes do diretorio configurado em `migrations_dir`.

Para verificar se as tabelas foram criadas:

```bash
npx wrangler d1 execute mycash-prod --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Deve retornar: `users`, `accounts`, `categories`, `transactions`, `recurrence_rules`, `attachments`.

---

## Passo 4 - Criar o Bucket R2

O bucket R2 armazena os anexos (comprovantes) enviados pelos usuarios.

```bash
npx wrangler r2 bucket create mycash-prod
```

> **Nota:** O nome do bucket sera usado na variavel `S3_BUCKET`. Pode ser diferente, mas mantenha consistencia.

### Gerar credenciais de API R2

1. Acesse o [Dashboard Cloudflare](https://dash.cloudflare.com/) > R2 > Gerenciar R2 API
2. Crie uma API Token com permissao de **Object Read & Write** para o bucket `mycash-prod`
3. Anote o **Access Key ID** e **Secret Access Key** gerados
4. Anote o endpoint S3 (formato: `https://<account_id>.r2.cloudflarestorage.com`)

---

## Passo 5 - Configurar as Variaveis de Ambiente Secretas

O Worker usa variaveis secretas que nao devem ser commitadas no codigo. Configure cada uma com:

> **Importante:** Todos os comandos abaixo precisam do `--config apps/api/wrangler.toml` para localizar o worker. Se preferir, execute-os dentro do diretorio `apps/api/` e omita o `--config`.

```bash
# Obrigatorias - Seguranca
npx wrangler secret put JWT_SECRET --config apps/api/wrangler.toml
# Valor: uma string aleatoria de no minimo 32 caracteres. Ex: openssl rand -base64 48

npx wrangler secret put HASHIDS_SALT --config apps/api/wrangler.toml
# Valor: uma string aleatoria. Ex: openssl rand -base64 24

# Obrigatorias - Storage R2
npx wrangler secret put S3_ENDPOINT --config apps/api/wrangler.toml
# Valor: https://<account_id>.r2.cloudflarestorage.com

npx wrangler secret put S3_ACCESS_KEY --config apps/api/wrangler.toml
# Valor: Access Key ID gerado no Passo 4

npx wrangler secret put S3_SECRET_KEY --config apps/api/wrangler.toml
# Valor: Secret Access Key gerado no Passo 4

npx wrangler secret put S3_BUCKET --config apps/api/wrangler.toml
# Valor: mycash-prod (nome do bucket criado no Passo 4)

npx wrangler secret put S3_REGION --config apps/api/wrangler.toml
# Valor: auto

# Obrigatoria - URL da aplicacao (para links em e-mails e CORS)
npx wrangler secret put APP_URL --config apps/api/wrangler.toml
# Valor: https://mycash.seudominio.com (URL do frontend em producao)

# E-mail (escolha seu driver: smtp, sendgrid ou mailersend)
npx wrangler secret put EMAIL_DRIVER --config apps/api/wrangler.toml
# Valor: sendgrid (recomendado para producao)

npx wrangler secret put EMAIL_API_KEY --config apps/api/wrangler.toml
# Valor: SG.xxxxxxxxxxxxxxxxxxxxxx (chave do SendGrid)

npx wrangler secret put EMAIL_FROM_ADDRESS --config apps/api/wrangler.toml
# Valor: noreply@seudominio.com

npx wrangler secret put EMAIL_FROM_NAME --config apps/api/wrangler.toml
# Valor: MyCash App

# Se usar SMTP em vez de SendGrid/Mailersend:
npx wrangler secret put EMAIL_SMTP_HOST --config apps/api/wrangler.toml
npx wrangler secret put EMAIL_SMTP_PORT --config apps/api/wrangler.toml
npx wrangler secret put EMAIL_SMTP_USER --config apps/api/wrangler.toml
npx wrangler secret put EMAIL_SMTP_PASS --config apps/api/wrangler.toml
npx wrangler secret put EMAIL_SMTP_SECURE --config apps/api/wrangler.toml
```

> **Dica:** Para gerar secrets seguros, use `openssl rand -base64 48` no terminal.

---

## Passo 6 - Atualizar o CORS para Producao

Antes do deploy, o CORS no arquivo `apps/api/src/index.ts` esta hardcoded para `localhost`. E necessario torna-lo dinamico usando a variavel `APP_URL`.

Alterar:

```typescript
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
```

Para:

```typescript
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const appUrl = c.env.APP_URL || "http://localhost:5173";
      return [appUrl, "http://localhost:5173"];
    },
    credentials: true,
  })
);
```

Isso permite que tanto o ambiente local quanto o de producao funcionem corretamente.

---

## Passo 7 - Deploy da API (Cloudflare Workers)

```bash
pnpm --filter @mycash/api run deploy
```

Ou, a partir do diretorio `apps/api`:

```bash
npx wrangler deploy
```

Apos o deploy, o Wrangler exibira a URL publica do Worker, por exemplo:

```
Published mycash-api (x.xx sec)
  https://mycash-api.seu-usuario.workers.dev
```

Anote essa URL. Ela sera necessaria para configurar o frontend.

---

## Passo 8 - Build e Deploy do Frontend (Cloudflare Pages)

### 8.1 - Configurar a variavel de API URL

Crie o arquivo `apps/web/.env.production` com a URL da API:

```env
VITE_API_URL=https://mycash-api.seu-usuario.workers.dev
```

> **Nota:** Verifique se o frontend ja esta configurado para usar `VITE_API_URL`. Caso contrario, pode ser necessario ajustar o proxy/Vite config ou a camada de fetch do frontend para usar essa variavel em producao.

### 8.2 - Build do frontend

```bash
pnpm --filter @mycash/web run build
```

### 8.3 - Deploy via Wrangler Pages

```bash
npx wrangler pages deploy apps/web/dist --project-name=mycash-web
```

Na primeira execucao, o Wrangler perguntara se deseja criar o projeto. Confirme.

Apos o deploy, ofrontend estara disponivel em:

```
https://mycash-web.pages.dev
```

### 8.4 - (Opcional) Dominio personalizado

No Dashboard Cloudflare > Pages > mycash-web > Custom domains, adicione seu dominio (ex: `mycash.seudominio.com`).

Se usar dominio personalizado, atualize a variavel `APP_URL`:

```bash
npx wrangler secret put APP_URL --config apps/api/wrangler.toml
# Novo valor: https://mycash.seudominio.com
```

E faca redeploy da API:

```bash
pnpm --filter @mycash/api run deploy
```

---

## Passo 9 - Verificacao Pos-Deploy (Smoke Tests)

### 9.1 - Health Check

```bash
curl https://mycash-api.seu-usuario.workers.dev/health
# Esperado: {"status":"ok","timestamp":"..."}
```

### 9.2 - Registro de Usuario

```bash
curl -X POST https://mycash-api.seu-usuario.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"12345678"}'
```

Verificar se:
- O usuario foi criado no D1
- A conta "CAIXA" e categorias padrao foram geradas automaticamente (onboarding)
- O response contem o token JWT

### 9.3 - Login

```bash
curl -X POST https://mycash-api.seu-usuario.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"12345678"}'
```

### 9.4 - Upload de Anexo

Atraves da interface web, faca upload de um PDF ou imagem e verifique:
- O arquivo foi gravado no bucket R2
- O arquivo pode ser visualizado/baixado

### 9.5 - Recuperacao de Senha

Atraves da interface web, clique em "Esqueci minha senha" e verifique:
- O e-mail foi disparado pelo driver configurado (SendGrid/SMTP)
- O link de recuperacao aponta para o dominio de producao correto

---

## Passo 10 - (Opcional) Configurar CI/CD

Para automatizar deploys futuros via GitHub Actions:

### 10.1 - Secrets do GitHub

No repositorio GitHub > Settings > Secrets and variables > Actions, adicione:

- `CLOUDFLARE_API_TOKEN`: Token de API da Cloudflare com permissao de Workers e Pages
- `CLOUDFLARE_ACCOUNT_ID`: ID da sua conta Cloudflare

### 10.2 - Workflow de exemplo

```yaml
name: Deploy MyCash

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm --filter @mycash/api run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-web:
    runs-on: ubuntu-latest
    needs: deploy-api
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm --filter @mycash/web run build
        env:
          VITE_API_URL: https://mycash-api.seu-usuario.workers.dev
      - run: npx wrangler pages deploy apps/web/dist --project-name=mycash-web
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## Resumo da Topologia em Producao

```
[ Usuario Final ]
       |
       v
 +--------------+      +-------------------------+
 |   Frontend   | ----> |     API (Backend)       |
 |  CF Pages    |      | CF Workers (Edge Node)  |
 +--------------+      +-------------------------+
                                |
              +-----------------+-----------------+
              v                                   v
 +-------------------------+       +-------------------------+
 | Banco de Dados (D1)     |       |   Storage de Anexos     |
 |     Producao Global     |       |       Bucket R2          |
 +-------------------------+       +-------------------------+
```

## Checklist de Deploy

- [ ] Wrangler autenticado (`wrangler login`)
- [ ] Banco D1 criado e `database_id` atualizado no `wrangler.toml`
- [ ] Migracoes aplicadas no D1 remoto
- [ ] Tabelas verificadas no D1
- [ ] Bucket R2 criado
- [ ] Credenciais R2 geradas (Access Key + Secret Key)
- [ ] Secrets configurados no Worker (`wrangler secret put`)
- [ ] CORS atualizado para usar `APP_URL` dinamicamente
- [ ] API publicada no Cloudflare Workers
- [ ] Arquivo `.env.production` do frontend com `VITE_API_URL`
- [ ] Build do frontend realizado
- [ ] Frontend publicado no Cloudflare Pages
- [ ] Health check respondendo OK
- [ ] Registro de usuario com onboarding funcional
- [ ] Login funcional
- [ ] Upload de anexo funcional (R2)
- [ ] Recuperacao de senha funcional (e-mail)
- [ ] Dominio personalizado configurado (opcional)