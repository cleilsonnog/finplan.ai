import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon, ClockIcon, LightbulbIcon, SparklesIcon } from "lucide-react";
import PublicHeader from "../../_components/public-header";
import { SITE_URL } from "../../_lib/site";
import { GUIDES, getGuide } from "../_content/guides";
import RichText from "../_components/rich-text";
import GuideCta from "../_components/guide-cta";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

// Static pages — fast to load and fully rendered for search engines
export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export const generateMetadata = async ({ params }: GuidePageProps): Promise<Metadata> => {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `${SITE_URL}/guias/${guide.slug}`,
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    },
  };
};

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

const GuidePage = async ({ params }: GuidePageProps) => {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      inLanguage: "pt-BR",
      datePublished: guide.published,
      dateModified: guide.updated,
      mainEntityOfPage: `${SITE_URL}/guias/${guide.slug}`,
      author: { "@type": "Organization", name: "FinPlan.ai", url: SITE_URL },
      publisher: { "@type": "Organization", name: "FinPlan.ai", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guias", item: `${SITE_URL}/guias` },
        { "@type": "ListItem", position: 3, name: guide.title, item: `${SITE_URL}/guias/${guide.slug}` },
      ],
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
        <nav aria-label="Trilha" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Início</Link>
          <ChevronRightIcon size={12} />
          <Link href="/guias" className="hover:text-foreground">Guias</Link>
        </nav>

        <article>
          <header className="mb-10">
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{guide.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{guide.description}</p>
            <p className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ClockIcon size={12} /> {guide.readingMinutes} min de leitura</span>
              <span>Atualizado em {formatDate(guide.updated)}</span>
            </p>
          </header>

          <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {guide.blocks.map((block, i) => {
              switch (block.type) {
                case "h2":
                  return <h2 key={i} className="pt-6 text-xl font-bold text-foreground sm:text-2xl">{block.text}</h2>;
                case "p":
                  return <p key={i}><RichText text={block.text} /></p>;
                case "list": {
                  const ListTag = block.ordered ? "ol" : "ul";
                  return (
                    <ListTag key={i} className={`space-y-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"} marker:text-primary`}>
                      {block.items.map((item) => (
                        <li key={item} className="pl-1"><RichText text={item} /></li>
                      ))}
                    </ListTag>
                  );
                }
                case "tip":
                  return (
                    <aside key={i} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <p className="mb-1 flex items-center gap-2 font-semibold text-foreground">
                        <LightbulbIcon size={16} className="text-amber-500" /> {block.title}
                      </p>
                      <p className="text-sm"><RichText text={block.text} /></p>
                    </aside>
                  );
                case "cta":
                  return (
                    <aside key={i} className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
                      <p className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
                        <SparklesIcon size={18} className="text-primary" /> {block.title}
                      </p>
                      <p className="mb-4 text-sm"><RichText text={block.text} /></p>
                      <GuideCta label="Experimentar grátis" />
                    </aside>
                  );
              }
            })}
          </div>
        </article>

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="mb-4 text-lg font-semibold">Leia também</h2>
          <div className="grid gap-3">
            {others.map((g) => (
              <Link key={g.slug} href={`/guias/${g.slug}`} className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <p className="font-medium">{g.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{g.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </div>
  );
};

export default GuidePage;
