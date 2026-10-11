import type { Metadata, Viewport } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./_components/theme-provider";
import Providers from "./_components/providers";
import Footer from "./_components/footer";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "./_lib/site";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | FinPlan.ai",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "app de finanças pessoais",
    "controle financeiro",
    "controle de gastos",
    "importar extrato bancário",
    "fatura do cartão de crédito",
    "controle de cartão de crédito",
    "controle de gastos pelo WhatsApp",
    "planilha de gastos",
    "orçamento mensal",
    "previsão financeira",
    "finplan",
  ],
  authors: [{ name: "FinPlan.ai" }],
  creator: "FinPlan.ai",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "FinPlan.ai",
    title: "Saiba hoje se vai sobrar dinheiro no fim do mês — FinPlan.ai",
    description: SITE_DESCRIPTION,
    // Image: app/opengraph-image.tsx (guides have their own)
  },
  twitter: {
    card: "summary_large_image",
    title: "Saiba hoje se vai sobrar dinheiro no fim do mês — FinPlan.ai",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/icon-finplanai-pwa.svg",
    apple: "/icon-finplanai-pwa.svg",
  },
  manifest: "/manifest.json",
  applicationName: "FinPlan.ai",
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
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <body className={`${mulish.className} antialiased h-full flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <div className="flex-1">{children}</div>
            <Footer />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
