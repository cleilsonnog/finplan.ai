Plano: Compartilhamento de Conta

Contexto

Permitir que o usuário convide outra pessoa (ex: cônjuge) para compartilhar o controle financeiro. Ambos podem lançar e visualizar transações, cartões,
orçamentos e categorias.

Abordagem

1.  Schema (Prisma)

Adicionar 2 modelos + 1 enum em prisma/schema.prisma:

- AccountShare: id, ownerId, memberId (@unique), createdAt — vínculo ativo entre dono e membro
- AccountShareInvite: id, ownerId, invitedEmail, status (PENDING/ACCEPTED/REJECTED), createdAt, updatedAt
- Constraint: memberId é @unique (um user só pode ser membro de 1 conta)

2.  Helper getEffectiveUserId()

Novo arquivo: app/\_lib/get-effective-user-id.ts

- Se o user é membro de uma conta compartilhada → retorna o ownerId
- Senão → retorna o próprio userId
- Usa cache() do React para evitar queries duplicadas no mesmo render
- Retorna: { effectiveUserId, realUserId, isSharedMember }

3.  Substituir auth() por getEffectiveUserId()

Em todos os locais que buscam/gravam dados financeiros:

Data helpers (4 arquivos):

- app/\_data/get-dashboard/index.ts
- app/\_data/get-current-month-transactions/index.ts
- app/\_data/can-user-add-transaction/index.ts (checar plano do owner)
- app/\_data/get-credit-card-summary/index.ts

Server actions (6 arquivos):

- app/\_actions/upsert-transaction/index.ts
- app/\_actions/delete-transaction/index.ts
- app/\_actions/upsert-credit-card/index.ts
- app/\_actions/delete-credit-card/index.ts
- app/\_actions/custom-categories/index.ts
- app/budget/\_actions/upsert-budgets.ts

Pages (5 arquivos):

- app/(home)/page.tsx
- app/transactions/page.tsx
- app/credit-cards/page.tsx
- app/budget/page.tsx
- app/categories/page.tsx

NÃO alterar (mantém auth() direto): login, subscription, stripe checkout.

4.  Server Actions de Compartilhamento

Novo: app/\_actions/account-sharing/index.ts

- sendShareInvite(email) — só premium, valida que não tem share ativo
- acceptInvite(inviteId) — verifica email do user, cria AccountShare
- rejectInvite(inviteId) — marca como REJECTED
- revokeShare() — owner remove o membro
- leaveShare() — membro sai da conta

5.  Data Helper

Novo: app/\_data/get-share-status/index.ts

- getShareStatus() — retorna role (owner/member/none) + info do parceiro
- getPendingInvitesForCurrentUser() — busca convites pelo email do user

6.  UI

Botão de compartilhar no Dashboard (app/(home)/\_components/share-account-button.tsx):

- Ícone UserPlus, ao lado do AiReportButton
- Abre dialog: se premium → input de email + botão enviar; se não → link para assinatura
- Se já compartilha → mostra membro atual + botão revogar

Banner de convite pendente (app/\_components/pending-invites-banner.tsx):

- Aparece no dashboard quando há convite pendente para o user
- "{Nome} convidou você para compartilhar a conta" + Aceitar/Recusar
- Aviso: "Ao aceitar, você visualizará os dados financeiros de {nome}"

Badge de conta compartilhada (app/\_components/shared-account-badge.tsx):

- Indicador visual no dashboard quando está em conta compartilhada
- "Compartilhando com {nome}" + botão Sair

7.  Regras de Negócio

- Só premium pode compartilhar
- Máximo 1 membro por conta
- Membro vê dados do owner, dados próprios ficam preservados mas não visíveis
- Check de plano usa effectiveUserId (plano do owner vale para o membro)

Ordem de Implementação

1.  Schema + migrate
2.  getEffectiveUserId() helper
3.  getShareStatus() data helper
4.  Server actions de convite
5.  Substituir auth() nos data helpers e actions
6.  Substituir auth() nas pages
7.  Componentes UI (botão, banner, badge)
8.  Integrar no dashboard

Verificação

- Testar como owner: convidar, ver dados, revogar
- Testar como membro: aceitar convite, ver dados do owner, adicionar transação, sair
- Testar edge cases: não-premium tenta compartilhar, membro tenta compartilhar, email inválido
