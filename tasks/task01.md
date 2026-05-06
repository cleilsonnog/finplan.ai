Plano: Controle de Cartão de Crédito

Contexto

O usuário precisa de uma funcionalidade para cadastrar e gerenciar cartões de crédito com: limite, últimos 4 dígitos, bandeira, banco, dia de  
 fechamento e dia de vencimento. Segue os mesmos padrões existentes do CRUD de transações.

Arquivos a Criar

1.  Schema Prisma — prisma/schema.prisma

- Adicionar enum CardBrand: VISA, MASTERCARD, ELO, AMEX, HIPERCARD, OTHER
- Adicionar model CreditCard: id, userId, name, lastFourDigits (String), brand, bank, limit (Decimal 10,2), closingDay (Int), dueDay (Int),
  createdAt, updatedAt
- Rodar: npx prisma migrate dev --name add-credit-card

2.  Constantes — app/\_constants/credit-cards.ts (novo)

- CARD_BRAND_LABELS — mapeamento enum → label PT-BR
- CARD_BRAND_OPTIONS — array para Select dropdowns

3.  Server Action Upsert — app/\_actions/upsert-credit-card/ (novo)

- schema.ts — Zod: name (min 1), lastFourDigits (regex 4 dígitos), brand (nativeEnum), bank (min 1), limit (positive), closingDay (1-31), dueDay
  (1-31)
- index.ts — "use server", validate, auth(), create ou update, revalidatePath("/credit-cards")

4.  Server Action Delete — app/\_actions/delete-credit-card/index.ts (novo)

- "use server", auth(), delete por id, revalidatePath("/credit-cards")

5.  Dialog de Formulário — app/\_components/upsert-credit-card-dialog.tsx (novo)

- "use client", react-hook-form + zodResolver
- Campos: nome (Input), últimos 4 dígitos (Input maxLength=4), bandeira (Select), banco (Input), limite (MoneyInput), dia fechamento (Input
  number), dia vencimento (Input number)
- Modo create/update via props

6.  Botão Adicionar — app/\_components/add-credit-card-button.tsx (novo)

- "use client", gerencia estado do dialog, botão "Adicionar cartão"

7.  Página de Cartões — app/credit-cards/page.tsx (novo)

- Server Component, auth check, fetch creditCards, serializar limit (Decimal → number), DataTable

8.  Colunas da Tabela — app/credit-cards/\_columns/index.tsx (novo)

- SerializedCreditCard type (limit: number)
- Colunas: Nome, Final (\*\*\*\*1234), Bandeira, Banco, Limite (BRL), Fechamento, Vencimento, Ações

9.  Botão Editar — app/credit-cards/\_components/edit-credit-card-button.tsx (novo)

- Ícone lápis, abre dialog com defaultValues

10. Botão Deletar — app/credit-cards/\_components/delete-credit-card-button.tsx (novo)

- Ícone lixeira, abre AlertDialog de confirmação antes de deletar

11. Navbar — app/\_components/navbar.tsx (modificar)

- Adicionar link "Cartões" para /credit-cards no menu desktop e mobile

Ordem de Implementação

1.  Schema + migration
2.  Constantes
3.  Server actions (upsert + delete)
4.  Dialog + botão adicionar
5.  Colunas + botões editar/deletar
6.  Página
7.  Navbar

Verificação

- Criar um cartão pelo dialog e verificar no banco (prisma studio)
- Editar um cartão existente
- Deletar com confirmação
- Verificar que a tabela mostra todos os campos corretamente
- Testar responsividade mobile
