import type { Metadata, Viewport } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import PwaInstallPrompt from "./_components/pwa-install-prompt";
import { Toaster } from "sonner";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://finplan.ai";

export const metadata: Metadata = {
  title: {
    default: "FinPlan.ai — Planeje hoje. Garanta amanhã.",
    template: "%s | FinPlan.ai",
  },
  description:
    "Organize suas finanças pessoais com inteligência artificial. Controle transações, orçamentos, cartões de crédito e receba relatórios com insights personalizados.",
  keywords: [
    "finanças pessoais",
    "controle financeiro",
    "orçamento",
    "gestão financeira",
    "inteligência artificial",
    "planejamento financeiro",
    "transações",
    "cartão de crédito",
    "finplan",
    "finplan.ai",
  ],
  authors: [{ name: "FinPlan.ai" }],
  creator: "FinPlan.ai",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "FinPlan.ai",
    title: "FinPlan.ai — Planeje hoje. Garanta amanhã.",
    description:
      "Organize suas finanças pessoais com inteligência artificial. Controle transações, orçamentos e receba relatórios com insights personalizados.",
    images: [
      {
        url: "/finplan-ai.png",
        width: 512,
        height: 512,
        alt: "FinPlan.ai — Gestão de finanças pessoais com IA",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "FinPlan.ai — Planeje hoje. Garanta amanhã.",
    description:
      "Organize suas finanças pessoais com inteligência artificial. Controle transações, orçamentos e receba relatórios com insights.",
    images: ["/finplan-ai.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/icon-finplanai-pwa.svg",
    apple: "/icon-finplanai-pwa.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${mulish.className} dark antialiased h-full`}>
        <ClerkProvider appearance={{ baseTheme: dark }}>
          {children}
          <PwaInstallPrompt />
          <Toaster theme="dark" />
        </ClerkProvider>
      </body>
    </html>
  );
}
