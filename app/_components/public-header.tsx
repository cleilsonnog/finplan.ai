"use client";

import Image from "next/image";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "./ui/button";

// Header of the public pages (landing and guides). Section links are absolute so they work
// from any public page.
const PublicHeader = () => (
  <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/icon-finplanai-pwa.svg" width={32} height={32} alt="FinPlan AI" />
        <span className="text-lg font-bold">FinPlan.ai</span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
        <Link href="/#funcionalidades" className="hover:text-foreground">Funcionalidades</Link>
        <Link href="/#planos" className="hover:text-foreground">Planos</Link>
        <Link href="/guias" className="hover:text-foreground">Guias</Link>
        <Link href="/#duvidas" className="hover:text-foreground">Dúvidas</Link>
      </nav>
      <div className="flex items-center gap-2">
        <SignInButton mode="modal">
          <Button size="sm" variant="ghost">Entrar</Button>
        </SignInButton>
        <SignInButton mode="modal">
          <Button size="sm" className="hidden rounded-full sm:inline-flex">Começar grátis</Button>
        </SignInButton>
      </div>
    </div>
  </header>
);

export default PublicHeader;
