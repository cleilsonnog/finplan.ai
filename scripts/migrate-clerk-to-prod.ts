/**
 * One-off migration: production ran on Clerk's *development* instance (pk_test). Moving to the
 * production instance gives every user a new Clerk id, and all app data is keyed by that id.
 * For each email given, this script:
 *   1. finds the user in the dev instance (old id, metadata: plan, lifetime, Stripe/MP ids)
 *   2. finds or creates the user in the prod instance with the same email and metadata
 *      (no password — they sign in with Google; Clerk links the Google account by email)
 *   3. rewrites the old id to the new one in every table that stores a user id, in a single
 *      database transaction
 * Users not listed (test accounts) are left behind on the dev id.
 *
 * Usage (dry-run by default — prints what would change, creates nothing):
 *   CLERK_PROD_SECRET_KEY=sk_live_... npx tsx --env-file=.env scripts/migrate-clerk-to-prod.ts a@x.com b@y.com
 *   CLERK_PROD_SECRET_KEY=sk_live_... npx tsx --env-file=.env scripts/migrate-clerk-to-prod.ts a@x.com b@y.com --apply
 *
 * CLERK_SECRET_KEY (from .env) must be the dev instance key (sk_test_...).
 * DATABASE_URL decides which database is migrated — run against the local copy first.
 */
import { createClerkClient, type User } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const emails = args.filter((a) => !a.startsWith("--")).map((e) => e.trim().toLowerCase());

const devKey = process.env.CLERK_SECRET_KEY ?? "";
const prodKey = process.env.CLERK_PROD_SECRET_KEY ?? "";
if (!devKey.startsWith("sk_test_")) throw new Error("CLERK_SECRET_KEY must be the dev instance key (sk_test_)");
if (!prodKey.startsWith("sk_live_")) throw new Error("CLERK_PROD_SECRET_KEY must be the prod instance key (sk_live_)");
if (emails.length === 0) throw new Error("Pass the emails to migrate");

const dev = createClerkClient({ secretKey: devKey });
const prod = createClerkClient({ secretKey: prodKey });

// Every column holding a Clerk user id (see prisma/schema.prisma)
const COLUMNS = [
  ["transaction", "userId"],
  ["creditCard", "userId"],
  ["creditCardBill", "userId"],
  ["budget", "userId"],
  ["customCategory", "userId"],
  ["userCategoryLabel", "userId"],
  ["categoryRule", "userId"],
  ["importBatch", "userId"],
  ["recurringExpense", "userId"],
  ["recurringIncome", "userId"],
  ["whatsAppLink", "userId"],
  ["pushSubscription", "userId"],
  ["shoppingListItem", "userId"],
  ["accountShare", "ownerId"],
  ["accountShare", "memberId"],
  ["accountShareInvite", "ownerId"],
] as const;

type Delegate = {
  count: (a: { where: Record<string, string> }) => Promise<number>;
  updateMany: (a: { where: Record<string, string>; data: Record<string, string> }) => Promise<{ count: number }>;
};
const model = (client: object, name: string) => (client as Record<string, Delegate>)[name];

const findByEmail = async (client: typeof dev, email: string): Promise<User | null> => {
  const { data } = await client.users.getUserList({ emailAddress: [email] });
  return data[0] ?? null;
};

const countRows = async (userId: string) => {
  const counts: string[] = [];
  let total = 0;
  for (const [name, column] of COLUMNS) {
    const n = await model(db, name).count({ where: { [column]: userId } });
    if (n > 0) counts.push(`${name}.${column}=${n}`);
    total += n;
  }
  return { total, summary: counts.join(", ") || "nenhum dado" };
};

const main = async () => {
  const dbHost = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/[/?].*$/, "");
  console.log(apply ? "== APPLY ==" : "== DRY-RUN (nada é criado nem alterado) ==");
  console.log(`Banco: ${dbHost}`);
  const pairs: { email: string; oldId: string; newId: string | null }[] = [];

  for (const email of emails) {
    const old = await findByEmail(dev, email);
    if (!old) throw new Error(`${email}: não existe na instância dev`);
    const rows = await countRows(old.id);
    let target = await findByEmail(prod, email);

    console.log(`\n${email}`);
    console.log(`  dev  ${old.id} — ${rows.summary}`);
    console.log(`  meta public=${JSON.stringify(old.publicMetadata)} private=${JSON.stringify(old.privateMetadata)}`);

    if (target) {
      // Someone already signed in on prod: their new id must not own data yet, or ids would mix
      const existing = await countRows(target.id);
      if (existing.total > 0) throw new Error(`${email}: usuário prod ${target.id} já tem dados (${existing.summary})`);
      console.log(`  prod ${target.id} (já existe)`);
    } else if (apply) {
      target = await prod.users.createUser({
        emailAddress: [email],
        firstName: old.firstName ?? undefined,
        lastName: old.lastName ?? undefined,
        externalId: old.id,
        publicMetadata: old.publicMetadata,
        privateMetadata: old.privateMetadata,
        skipPasswordRequirement: true,
      });
      console.log(`  prod ${target.id} (criado)`);
    } else {
      console.log("  prod (seria criado)");
    }

    if (target && apply) {
      // A prod user who signed in before the migration still gets the plan/lifetime flags
      await prod.users.updateUserMetadata(target.id, {
        publicMetadata: old.publicMetadata,
        privateMetadata: old.privateMetadata,
      });
    }
    pairs.push({ email, oldId: old.id, newId: target?.id ?? null });
  }

  if (!apply) {
    console.log("\nDry-run concluído. Rode com --apply para criar os usuários e trocar os ids no banco.");
    return;
  }

  // All or nothing: one transaction for every table and user
  await db.$transaction(
    async (tx) => {
      for (const { email, oldId, newId } of pairs) {
        const changed: string[] = [];
        for (const [name, column] of COLUMNS) {
          const { count } = await model(tx, name).updateMany({
            where: { [column]: oldId },
            data: { [column]: newId! },
          });
          if (count > 0) changed.push(`${name}.${column}=${count}`);
        }
        console.log(`\n${email}: ${oldId} → ${newId}\n  ${changed.join(", ") || "nenhum dado"}`);
      }
    },
    { timeout: 120_000 },
  );

  console.log("\nMigração aplicada.");
};

main()
  .catch((err) => {
    console.error("\nERRO:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
