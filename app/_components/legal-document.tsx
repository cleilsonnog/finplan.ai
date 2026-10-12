import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import PublicHeader from "./public-header";
import PublicFooter from "./public-footer";
import { LEGAL } from "@/app/_lib/legal";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

interface LegalDocumentProps {
  title: string;
  intro: string;
  sections: LegalSection[];
}

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

/** Layout shared by /privacidade and /termos — same typography as the guides */
const LegalDocument = ({ title, intro, sections }: LegalDocumentProps) => (
  <div className="flex min-h-full flex-col">
    <PublicHeader />
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-8 sm:py-16">
      <nav aria-label="Trilha" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Início</Link>
        <ChevronRightIcon size={12} />
        <span>{title}</span>
      </nav>
      <article>
        <header className="mb-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 text-xs text-muted-foreground">Última atualização: {formatDate(LEGAL.updated)}</p>
          <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{intro}</p>
        </header>
        <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          {sections.map((s, i) => (
            <section key={s.title} className="space-y-3">
              <h2 className="pt-6 text-xl font-bold text-foreground">
                {i + 1}. {s.title}
              </h2>
              {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
              {s.items && (
                <ul className="list-disc space-y-2 pl-5 marker:text-primary">
                  {s.items.map((item) => (
                    <li key={item} className="pl-1">{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <p className="mt-12 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Dúvidas sobre este documento: <a href={`mailto:${LEGAL.email}`} className="text-primary hover:underline">{LEGAL.email}</a>{" "}
          ou WhatsApp <a href={LEGAL.whatsappUrl} className="text-primary hover:underline">{LEGAL.whatsapp}</a>.
        </p>
      </article>
    </main>
    <PublicFooter />
  </div>
);

export default LegalDocument;
