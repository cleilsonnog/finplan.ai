Plano: Integração Cartão de Crédito + Transações + Dashboard

Contexto

O CRUD de cartões de crédito já existe. Agora precisamos:

1.  Vincular transações a cartões (obrigatório quando paymentMethod = CREDIT_CARD)
2.  Calcular faturas por ciclo de fechamento
3.  Exibir dados consolidados + individuais no dashboard

---

Fase 1 — Vincular Transação ao Cartão

1.1 Schema Prisma — prisma/schema.prisma

- Adicionar campo opcional creditCardId String? no model Transaction
- Adicionar relação: creditCard CreditCard? @relation(fields: [creditCardId], references: [id])
- No model CreditCard, adicionar: transactions Transaction[]
- Migration: npx prisma migrate dev --name add-credit-card-relation

  1.2 Zod Schema — app/\_actions/upsert-transaction/schema.ts

- Adicionar creditCardId: z.string().optional() ao schema
- Adicionar .refine(): se paymentMethod === CREDIT_CARD, creditCardId é obrigatório

  1.3 Server Action — app/\_actions/upsert-transaction/index.ts

- Adicionar creditCardId?: string na interface UpsertTransactionParams
- Passar creditCardId no create/update (ou null se não for cartão)

  1.4 Dialog de Transação — app/\_components/add-transaction-button.tsx

- Adicionar prop creditCards (lista de cartões do usuário) ao UpsertTransactionDialog
- Quando paymentMethod === CREDIT_CARD: mostrar Select com os cartões do usuário
- Quando mudar de CREDIT_CARD para outro método: limpar creditCardId
- Usar form.watch("paymentMethod") para controlar visibilidade

  1.5 Página de Transações — app/transactions/page.tsx

- Buscar creditCards do usuário e passar ao AddTransactionButton

  1.6 Botão Adicionar Transação — app/\_components/upsert-transaction-dialog.tsx

- Receber e repassar creditCards ao dialog

  1.7 Colunas de Transações — app/transactions/\_columns/index.tsx

- Atualizar SerializedTransaction para incluir creditCardId e creditCard (nome)
- Na coluna "Método de Pagamento", mostrar nome do cartão quando for CREDIT_CARD

  1.8 Botão Editar Transação — app/transactions/\_components/edit-transaction-button.tsx

- Passar creditCards ao dialog de edição

  1.9 Dashboard — app/(home)/page.tsx e app/(home)/\_components/summary-cards.tsx

- Buscar creditCards do usuário e passar ao SummaryCards e ao AddTransactionButton embutido

---

Fase 2 — Cálculo de Fatura por Ciclo de Fechamento

2.1 Função de dados — app/\_data/get-credit-card-summary/index.ts (novo)

- getCreditCardSummary(month: string) — retorna para cada cartão:
  - card: dados do cartão (name, lastFourDigits, brand, limit, closingDay, dueDay)
  - invoiceTotal: soma das transações no ciclo de fechamento
  - availableLimit: limit - invoiceTotal
  - usagePercent: (invoiceTotal / limit) \* 100
- Cálculo do ciclo: dado closingDay e o month selecionado:
  - Data início: dia (closingDay + 1) do mês anterior
  - Data fim: dia closingDay do mês atual
  - Buscar transações com creditCardId = card.id e date dentro do intervalo
- Retorna também totais consolidados:
  - totalInvoice: soma de todas as faturas
  - totalLimit: soma de todos os limites
  - totalAvailable: totalLimit - totalInvoice
  - totalUsagePercent: (totalInvoice / totalLimit) \* 100

---

Fase 3 — Dashboard com Cartões

3.1 Data fetching — app/\_data/get-dashboard/index.ts

- Chamar getCreditCardSummary(month) e incluir no retorno do getDashboard

  3.2 Componente consolidado — app/(home)/\_components/credit-cards-summary.tsx (novo)

- Card com título "Cartões de Crédito"
- Total de faturas, limite total, disponível total
- Barra de progresso (Progress component) mostrando % de uso

  3.3 Componente individual — app/(home)/\_components/credit-card-item.tsx (novo)

- Card compacto por cartão: nome, \*\*\*\*últimos4, bandeira
- Fatura atual, limite disponível, barra de uso %
- Dias de fechamento e vencimento

  3.4 Layout Dashboard — app/(home)/page.tsx

- Adicionar seção de cartões abaixo dos summary cards existentes (coluna esquerda)
- Consolidado no topo + scroll horizontal/vertical com cards individuais
- Responsivo: empilha em mobile

---

Arquivos Modificados

┌──────────────────────────────────────────────────────────┬──────────────────────────────────────────────┐
│ Arquivo │ Ação │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ prisma/schema.prisma │ Adicionar relação Transaction ↔ CreditCard │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/\_actions/upsert-transaction/schema.ts │ creditCardId + refine │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/\_actions/upsert-transaction/index.ts │ creditCardId no params │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/\_components/add-transaction-button.tsx │ Select de cartão condicional │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/\_components/upsert-transaction-dialog.tsx │ Repassar creditCards │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/transactions/page.tsx │ Buscar creditCards │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/transactions/\_columns/index.tsx │ Mostrar nome do cartão │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/transactions/\_components/edit-transaction-button.tsx │ Passar creditCards │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/(home)/page.tsx │ Integrar seção de cartões │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/(home)/\_components/summary-cards.tsx │ Repassar creditCards ao AddTransactionButton │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ app/\_data/get-dashboard/index.ts │ Incluir dados de cartões │
└──────────────────────────────────────────────────────────┴──────────────────────────────────────────────┘

Arquivos Novos

┌─────────────────────────────────────────────────┬───────────────────────────────┐
│ Arquivo │ Descrição │
├─────────────────────────────────────────────────┼───────────────────────────────┤
│ app/\_data/get-credit-card-summary/index.ts │ Cálculo de fatura por ciclo │
├─────────────────────────────────────────────────┼───────────────────────────────┤
│ app/(home)/\_components/credit-cards-summary.tsx │ Card consolidado no dashboard │
├─────────────────────────────────────────────────┼───────────────────────────────┤
│ app/(home)/\_components/credit-card-item.tsx │ Card individual por cartão │
└─────────────────────────────────────────────────┴───────────────────────────────┘

Ordem de Implementação

1.  Schema + migration (relação)
2.  Função getCreditCardSummary
3.  Server action + Zod (upsert-transaction com creditCardId)
4.  Dialog de transação (campo condicional de cartão)
5.  Página de transações + colunas (mostrar cartão)
6.  Componentes do dashboard (consolidado + individual)
7.  Integrar no layout do dashboard

Verificação

- Criar transação com cartão de crédito → campo de cartão aparece e é obrigatório
- Criar transação com PIX → campo de cartão não aparece
- Editar transação que tem cartão → cartão pre-selecionado no dialog
- No dashboard, verificar card consolidado com soma correta
- Verificar cards individuais com fatura calculada pelo ciclo de fechamento
- Deletar cartão que tem transações → verificar se precisa tratar (ON DELETE SET NULL)
- Testar responsividade mobile
