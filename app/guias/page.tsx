import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import PublicHeader from "../_components/public-header";
import { SITE_URL } from "../_lib/site";
import { GUIDES } from "./_content/guides";

export const metadata: Metadata = {
  title: "Guias de finanças pessoais",
  description:
    "Guias práticos para controlar a fatura do cartão, montar um orçamento, sair das dívidas e organizar o extrato do banco.",
  alternates: { canonical: "/guias" },
};

const GuidesIndex = () => (
  <div className="flex min-h-full flex-col">
    <PublicHeader />
    <main className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-8 sm:py-20">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Guias</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Finanças pessoais sem complicação</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Guias práticos e diretos para colocar o dinheiro em ordem — do cartão de crédito ao orçamento do mês.
      </p>
      <div className="mt-10 grid gap-4">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guias/${g.slug}`}
            className="group rounded-2xl border border-border p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <h2 className="text-lg font-semibold group-hover:text-primary">{g.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{g.excerpt}</p>
            <p className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ClockIcon size={12} /> {g.readingMinutes} min de leitura</span>
              <span className="flex items-center gap-1 font-medium text-primary">
                Ler guia <ArrowRightIcon size={12} />
              </span>
            </p>
          </Link>
        ))}
      </div>
    </main>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: GUIDES.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/guias/${g.slug}`,
            name: g.title,
          })),
        }),
      }}
    />
  </div>
);

export default GuidesIndex;
