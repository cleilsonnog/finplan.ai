"use client";

import { UserButton } from "@clerk/nextjs";
import { MenuIcon, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const Navbar = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (path: string) =>
    pathname === path
      ? "font-bold text-primary"
      : "text-muted-foreground";

  return (
    <nav className="border-b border-solid">
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon-finplanai-pwa.svg"
              width={36}
              height={36}
              alt="FinPlan AI"
            />
            <span className="text-lg font-bold hidden sm:inline">FinPlan.ai</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link href="/" className={linkClass("/")}>
              Dashboard
            </Link>
            <Link href="/transactions" className={linkClass("/transactions")}>
              Transações
            </Link>
            <Link href="/budget" className={linkClass("/budget")}>
              Orçamento
            </Link>
            <Link href="/credit-cards" className={linkClass("/credit-cards")}>
              Cartões
            </Link>
            <Link href="/categories" className={linkClass("/categories")}>
              Categorias
            </Link>
            <Link href="/subscription" className={linkClass("/subscription")}>
              Assinatura
            </Link>
          </div>
        </div>
        <div className="hidden md:block">
          <UserButton showName />
        </div>
        <button
          className="md:hidden text-muted-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-4 border-t px-4 py-4 md:hidden">
          <Link
            href="/"
            className={linkClass("/")}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/transactions"
            className={linkClass("/transactions")}
            onClick={() => setMenuOpen(false)}
          >
            Transações
          </Link>
          <Link
            href="/budget"
            className={linkClass("/budget")}
            onClick={() => setMenuOpen(false)}
          >
            Orçamento
          </Link>
          <Link
            href="/credit-cards"
            className={linkClass("/credit-cards")}
            onClick={() => setMenuOpen(false)}
          >
            Cartões
          </Link>
          <Link
            href="/categories"
            className={linkClass("/categories")}
            onClick={() => setMenuOpen(false)}
          >
            Categorias
          </Link>
          <Link
            href="/subscription"
            className={linkClass("/subscription")}
            onClick={() => setMenuOpen(false)}
          >
            Assinatura
          </Link>
          <div className="pt-2 border-t">
            <UserButton showName />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
