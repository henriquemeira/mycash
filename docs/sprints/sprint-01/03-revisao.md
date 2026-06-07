# Revisão da Sprint 01

## Checklist de Implementação vs Planejamento

### 🏗️ Infraestrutura
| Item | Status | Observação |
|---|---|---|
| Monorepo pnpm workspaces (`apps/web`, `apps/api`, `packages/database`) | ✅ | Estrutura completa |
| `pnpm-workspace.yaml` configurado | ✅ | |
| `wrangler.toml` com binding D1 local | ✅ | `migrations_dir` aponta para `packages/database/drizzle` |
| `.dev.vars.example` para secrets | ✅ | `JWT_SECRET` e `HASHIDS_SALT` |
| Build e typecheck funcionando | ✅ | `pnpm run build` e `pnpm run typecheck` aprovam |

### 🗄️ Schema do Banco (Drizzle ORM)
| Item | Status | Observação |
|---|---|---|
| Tabela `users` com campos de auditoria | ✅ | `id`, `email`, `password_hash`, `status`, `last_login_at`, `created_at`, `updated_at`, `deleted_at` |
| Tabela `accounts` com FK para users | ✅ | `name`, `type`, `color`, `initial_balance`, `currency` |
| Tabela `categories` com FK para users | ✅ | `name`, `type`, `color`, `icon` |
| Soft delete (`deleted_at`) em todas | ✅ | |
| `ON DELETE CASCADE` nas FKs | ✅ | |
| Índices: `users_email_idx`, `accounts_user_idx`, `categories_user_idx` | ✅ | |
| Migração inicial gerada (`0000_odd_network.sql`) | ✅ | |

### 🔐 IDs e Segurança
| Item | Status | Observação |
|---|---|---|
| SnowflakeID generator | ✅ | 64-bit, worker/datacenter configurável |
| Hashids na camada de transporte | ✅ | Salt via `HASHIDS_SALT`, comprimento 8 |
| Middleware Inbound (decodifica hash → ID) | ✅ | `hashidMiddleware` |
| Serialização Outbound (encode IDs no JSON) | ✅ | Função `encodeId()` + `encodeResponseIds()` |
| IDs expostos como hashids no frontend | ✅ | Nenhum ID numérico cru exposto |

### 👤 Autenticação (US01 - Cadastro)
| Item | Status | Observação |
|---|---|---|
| Validação de formato de e-mail | ✅ | Regex no backend |
| Rejeição de e-mail duplicado (HTTP 409) | ✅ | `"errors.email_already_exists"` |
| Senha mínima 8 caracteres | ✅ | Validado frontend + backend |
| Onboarding automático: conta "CAIXA" | ✅ | Criada no register |
| Onboarding: categorias "RECEITAS"/"DESPESAS" | ✅ | Criadas no register |
| JWT setado como cookie HttpOnly no register | ✅ | |
| Resposta 201 com dados do usuário | ✅ | |

### 🔑 Autenticação (US02 - Login/Sessão)
| Item | Status | Observação |
|---|---|---|
| Login com e-mail + senha | ✅ | |
| Cookie HttpOnly com JWT | ✅ | `Secure`, `SameSite=Strict`, `Max-Age=30d` |
| Mensagem genérica para credenciais inválidas (401) | ✅ | `"errors.invalid_credentials"` |
| Atualização de `last_login_at` | ✅ | |
| Logout com deleção de cookie | ✅ | |
| Rota `/auth/me` protegida | ✅ | |
| Login redireciona para dashboard | ✅ | |

### 🛡️ Segurança
| Item | Status | Observação |
|---|---|---|
| Password hashing com WebCrypto PBKDF2 | ✅ | 100k iterações, SHA-256, salt 16 bytes |
| JWT assinado com HMAC-SHA256 | ✅ | Implementação custom WebCrypto |
| Cookie flags: HttpOnly, Secure, SameSite=Strict | ✅ | |
| Soft delete em todas as tabelas | ✅ | |

### 💻 Frontend
| Item | Status | Observação |
|---|---|---|
| Tela única Login/Registrar com abas | ✅ | `AuthPage.tsx` |
| AuthContext para estado global | ✅ | `AuthContext.tsx` |
| Validação client-side (e-mail, senha) | ✅ | Regex + length check |
| Loading state no submit | ✅ | Botão desabilitado + "Aguarde..." |
| Feedback de erro na tela | ✅ | Mensagem traduzida via i18n |
| Redirecionamento automático pós-login | ✅ | |

---

## ⚠️ Não Conformidades e Observações

### 1. IDs como TEXT em vez de INTEGER/BIGINT
**Planejado (RFC):** IDs como `integer({ mode: 'bigint' })` — colunas `BIGINT` no SQL.
**Implementado:** IDs como `text('id')` — SnowflakeID armazenado como string decimal.

Embora funcionalmente correto (hashids opera sobre strings), fere o spec da proposta de BD. Motivo: o SnowflakeID gerado excede 53 bits (limite do Number JS), então é armazenado como string desde a origem (`newId()` retorna `string`). A decisão é pragmática, mas **deve ser documentada como tech debt** para alinhamento futuro se migrar para PostgreSQL com `BIGINT` nativo.

### 2. `encodeResponseIds` sem middleware global
**Planejado:** Middleware de saída que serializa automaticamente todos os IDs.
**Implementado:** Cada rota chama `encodeId()` manualmente. A função `encodeResponseIds()` existe mas não é usada.

Isso funciona, mas exige que cada nova rota lembre de codificar os IDs manualmente — risco de esquecimento. **Sugestão:** Criar um middleware `encodeResponseMiddleware` que intercepta o `c.json()` e aplica `encodeResponseIds()` automaticamente.

### 3. Migration não integrada ao dev startup
`wrangler d1 migrations apply` não era executado automaticamente no inicio do dev server. Corrigido na Sprint 02 com script `predev`. Na Sprint 01 era necessário executar manualmente.

### 4. Lint não configurado
O script `lint` existe no `package.json` raiz mas nenhum pacote implementa. Apenas `typecheck` é verificado.

### 5. Hashids com singleton global pode causar problemas
O `getHashids()` em `hashid.ts` usa uma variável global `hashids`. Em ambiente multi-tenant ou com recriação de instâncias, o salt carregado na primeira chamada pode persistir incorretamente se o ambiente for reutilizado. Recomendação: recriar a instância por requisição usando o salt do binding.

---

## Resumo

| Métrica | Valor |
|---|---|
| Itens planejados | ~30 |
| Itens implementados | 30 |
| Não conformidades | 2 (TEXT vs BIGINT, sem middleware global encode) |
| Melhorias identificadas | 2 (predev migration, lint) |
| Build | ✅ Passa |
| Typecheck | ✅ Passa |
