import Image from "next/image";
import Link from "next/link";
import { GUIDES } from "@/app/guias/_content/guides";

/** Footer of the public pages (landing, guides, legal) */
const PublicFooter = () => (
  <footer className="border-t border-border">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-8">
      <div className="flex items-center gap-2">
        <Image src="/icon-finplanai-pwa.svg" width={24} height={24} alt="FinPlan AI" />
        <span className="text-sm font-semibold">FinPlan.ai</span>
      </div>
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <Link href="/guias" className="hover:text-foreground">Guias</Link>
        {GUIDES.slice(0, 3).map((g) => (
          <Link key={g.slug} href={`/guias/${g.slug}`} className="hover:text-foreground">
            {g.title.split(":")[0].split("(")[0].trim()}
          </Link>
        ))}
        <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
        <Link href="/termos" className="hover:text-foreground">Termos de uso</Link>
      </nav>
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} FinPlan.ai. Todos os direitos reservados.
      </p>
    </div>
  </footer>
);

export default PublicFooter;
