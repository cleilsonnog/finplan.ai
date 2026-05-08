Categorias Customizadas para Usuarios Premium

Contexto

Usuarios premium precisam criar categorias personalizadas para organizar melhor suas financas. Hoje as categorias sao um enum fixo  
 (TransactionCategory) com 9 valores. A feature permite categorias customizadas que aparecem em transacoes, orcamento mensal, dashboard e relatorio IA.

Abordagem: Hibrida (enum + CustomCategory model)

Manter o enum existente para categorias padrao e adicionar um model CustomCategory. Quando uma categoria customizada e usada, category = OTHER e
customCategoryId aponta para a categoria. Sem migracao de dados existentes.

---

Fases de Implementacao

Fase 1: Schema + Migration

Arquivo: prisma/schema.prisma

- Criar model CustomCategory (id, userId, name, timestamps, @@unique userId+name)
- Adicionar customCategoryId opcional em Transaction e Budget (com relacao + onDelete: SetNull)
- Atualizar unique constraint do Budget: @@unique([userId, category, customCategoryId, month, year])
- Rodar npx prisma migrate dev --name add-custom-categories

Fase 2: Helpers e Constantes

Novo arquivo: app/\_utils/category.ts

- getCategoryLabel(category, customCategory?) - resolve label para enum ou custom
- getCategoryKey(category, customCategoryId?) - chave unica para agrupamento

Arquivo: app/\_constants/transactions.ts

- Adicionar buildCategoryOptions(customCategories) - merge options default + custom com prefixo custom:<id>

Fase 3: CRUD de Categorias Customizadas

Novos arquivos:

- app/\_actions/custom-categories/index.ts - Server actions: create, update, delete, list
- app/\_actions/custom-categories/schema.ts - Validacao Zod
- app/categories/page.tsx - Pagina dedicada (premium gate)
- app/categories/\_components/category-list.tsx - Lista com criar/editar/deletar
- Adicionar link "Categorias" no navbar (premium only)

Fase 4: Atualizar Fluxo de Transacoes

Arquivos:

- app/\_actions/upsert-transaction/schema.ts - Adicionar customCategoryId opcional
- app/\_actions/upsert-transaction/index.ts - Processar customCategoryId, validar ownership
- app/\_components/upsert-transaction-dialog.tsx - Usar buildCategoryOptions, parse custom:<id> no submit
- app/\_components/add-transaction-button.tsx - Passar customCategories
- app/transactions/page.tsx - Fetch custom categories para premium users
- app/(home)/page.tsx - Idem

Fase 5: Atualizar Exibicao

Arquivos:

- app/transactions/\_columns/index.tsx - Usar getCategoryLabel, incluir customCategory no type
- app/transactions/\_components/transactions-table.tsx - Filtro com custom categories, PDF export
- app/credit-cards/\_components/credit-card-transactions.tsx - Display custom names
- app/\_data/get-dashboard/index.ts - groupBy(["category", "customCategoryId"]) + resolver nomes
- app/\_data/get-dashboard/types.ts - Adicionar customCategoryId/Name no tipo
- app/(home)/\_components/expenses-per-category.tsx - Usar getCategoryLabel

Fase 6: Atualizar Orcamento

Arquivos:

- app/budget/page.tsx - Fetch custom categories, atualizar groupBy, copiar do mes anterior
- app/budget/\_components/budget-form.tsx - Listar custom categories como inputs extras
- app/budget/\_components/budget-progress.tsx - Display com getCategoryLabel
- app/budget/\_actions/upsert-budgets.ts - Suportar customCategoryId no upsert

Fase 7: Atualizar Relatorio IA

Arquivo: app/(home)/\_actions/generate-ai-report/index.ts

- Include customCategory na query, usar getCategoryLabel no prompt

---

Decisoes Tecnicas

- Sentinel value: category = OTHER + customCategoryId quando categoria e customizada
- Prefixo no select: Valores custom usam custom:<uuid> para distinguir de enums no form
- Downgrade: Se usuario perde premium, categorias existentes continuam exibindo. So nao pode criar novas.
- Deletar categoria: onDelete: SetNull - transacoes mostram "Outros"

Verificacao

1.  npx prisma migrate dev roda sem erros
2.  npm run build compila sem erros
3.  Criar categoria custom como premium -> aparece em transacoes e orcamento
4.  Criar transacao com categoria custom -> exibe corretamente na tabela e dashboard
5.  Definir orcamento para categoria custom -> progresso funciona
6.  Deletar categoria -> transacoes mostram "Outros"
7.  Usuario free nao ve opcao de categorias customizadas
