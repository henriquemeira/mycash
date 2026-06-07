# Revisão da Sprint 02

## Checklist de Implementação vs Planejamento

### US03 - Layout Base Responsivo, Temas e Localização

| Item | Status | Observação |
|---|---|---|
| `react-i18next` instalado e configurado | ✅ | `src/i18n/index.ts` + `pt.json` + `en.json` |
| Dicionários PT/EN com zero strings fixas | ✅ | Todas as strings via `t()` |
| Chaves de erro do backend traduzidas (`errors.*`) | ✅ | Backend retorna chaves, frontend traduz |
| Tema detectado do SO (`prefers-color-scheme`) | ✅ | `ThemeContext.getInitialTheme()` |
| Tema salvo no `localStorage` | ✅ | `localStorage.setItem("theme", theme)` |
| `darkMode: "class"` no Tailwind | ✅ | `tailwind.config.js` |
| Script anti-flash no `<head>` do HTML | ✅ | `index.html` com script inline |
| Alternador Tema (Sol/Lua) no TopBar | ✅ | `Sun` / `Moon` icons |
| Seletor Idioma (PT/EN) no TopBar | ✅ | `Globe` icon + toggle |
| **Bottom Navigation Bar para Mobile** | ❌ | **Não implementada** — apenas TopBar fixo no topo |
| **Header completo para Desktop** | ⚠️ | Parcial — TopBar existe mas sem navegação inferior |

### US04 - Listagem Mensal de Transações

| Item | Status | Observação |
|---|---|---|
| `GET /transactions?month=X&year=Y` | ✅ | Filtra por `dueDate` no mês |
| Resposta JSON com `{ summary, items }` | ✅ | `summary.income`, `summary.expense`, `summary.balance` |
| `POST /transactions` | ✅ | Criação com validação + decodificação hashids |
| `PATCH /transactions/:id/toggle-paid` | ✅ | Com middleware hashid |
| **Paginação / limite de dados** | ❌ | **Não implementado** — retorna todas do mês |
| **Uso do TanStack Table** | ❌ | **Instalado mas não utilizado** — tabela manual |

### 📅 Refinamento da US04

| Item | Status | Observação |
|---|---|---|
| Mês e ano atuais como padrão | ✅ | `new Date().getMonth() + 1` |
| Seletor compacto `[ < ] Junho, 2026 [ > ]` | ✅ | `MonthSelector` componente |
| Disparo de requisição ao mudar mês | ✅ | `useEffect` em `fetchData` |

### 🎨 Design Visual (UI/UX)

| Item | Status | Observação |
|---|---|---|
| Mini-Fita de Balanço (3 blocos lado a lado) | ✅ | `BalanceRibbon` componente |
| Receitas: `text-emerald-600` (light) / `text-emerald-400` (dark) | ✅ | |
| Despesas: `text-rose-600` (light) / `text-rose-400` (dark) | ✅ | |
| Balanço em negrito, cor conforme sinal | ✅ | `font-bold` + cor dinâmica |
| Transação pendente: `opacity-50` / dark `opacity-60` | ✅ | |
| Transição suave: `transition-opacity duration-200` | ✅ | |
| Botão Check: área 44x44px (`h-11 w-11`) | ✅ | |
| Pendente: círculo vazado (`Circle` icon) | ✅ | |
| Pago: círculo preenchido + check branco | ✅ | `Check` icon + cor dinâmica |

### ⚡ Atualização Otimista (Optimistic UI)

| Item | Status | Observação |
|---|---|---|
| Alteração visual imediata no toggle | ✅ | `setItems` antes do fetch |
| Disparo em segundo plano (`PATCH`) | ✅ | `api.togglePaid` após otimismo |
| Reversão em caso de erro | ✅ | Rollback no `catch` |
| **Notificação discreta de erro** | ❌ | Apenas reversão silenciosa, sem toast |

### 📱 Linha de Inserção Rápida

| Item | Status | Observação |
|---|---|---|
| Formulário fixo no topo do grid | ✅ | |
| Inputs sem bordas (clean) | ✅ | `border-none bg-transparent` |
| Navegação por Tab entre campos | ⚠️ | Funciona naturalmente, sem `tabIndex` explícito |
| Enter para submeter | ✅ | `onSubmit` no form |
| Botão `+` discreto | ✅ | `Plus` icon |

### 🗄️ Itens Adicionais Implementados (fora do escopo original)

| Item | Motivo |
|---|---|
| Campo `dueDate` (data de vencimento) | Surgiu durante refinamento do fluxo |
| Tipo `transfer` (transferência entre contas) | Surgiu durante refinamento do fluxo |
| `GET /accounts` e `GET /categories` | Necessário para dropdowns no formulário |
| Agrupamento por data de vencimento | Solicitação do usuário |
| Saldo diário por grupo | Solicitação do usuário |
| Seletor de conta no formulário | Necessário para criar transações |
| `predev` script para migrations automáticas | Corrige problema da sprint 01 |

---

## ⚠️ Não Conformidades e Observações

### 1. TanStack Table não utilizado
**Planejado:** `@tanstack/react-table` para o TransactionGrid.
**Realidade:** Biblioteca instalada mas grid renderizado manualmente com `<table>` JSX puro e `useMemo` para agrupamento.

Funciona perfeitamente para o caso de uso atual, mas perde os benefícios do TanStack (ordenação por coluna, filtros, seleção, paginação). **Sugestão:** Migrar para TanStack Table quando houver necessidade de ordenação interativa ou paginação client-side.

### 2. Sem paginação no backend
**Planejado:** Endpoint com paginação/limite de dados.
**Realidade:** Retorna todas as transações do mês sem limite. Para uso atual (transações mensais) é aceitável, mas com muitos registros pode degradar performance.

### 3. Bottom Navigation Bar não implementada
**Planejado:** Bottom Nav Bar mobile com 3 ações (Transações, Nova Transação, Configurações).
**Realidade:** Apenas TopBar fixa. A navegação inferior não foi construída.

### 4. Sem notificação de erro na optimistic UI
**Planejado:** "Não foi possível salvar. Tentando novamente..."
**Realidade:** Reversão silenciosa sem feedback visual ao usuário.

### 5. Filtro por `dueDate` em vez de `date`
**Planejado (escopo):** Filtrar por `transactions.date`.
**Realidade:** Implementado filtro por `transactions.dueDate`. Mudança de escopo não documentada no planejamento. A intenção foi alinhar a listagem mensal à data de vencimento, que é o campo mais relevante para o usuário.

---

## Resumo

| Métrica | Valor |
|---|---|
| Itens planejados | ~25 |
| Itens implementados | 21 |
| Não implementados | 4 (BottomNav, TanStack Table, paginação, toast de erro) |
| Itens adicionais implementados | 6 (dueDate, transfer, accounts/categories endpoints, agrupamento, saldo diário, seletor de conta) |
| Build | ✅ Passa |
| Typecheck | ✅ Passa |
