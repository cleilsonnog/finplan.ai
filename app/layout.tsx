import type { Metadata, Viewport } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import PwaInstallPrompt from "./_components/pwa-install-prompt";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

export const metadata: Metadata = {
  title: "FinPlan.ai",
  description: "Gestão de finanças pessoais com IA",
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
    <html lang="en">
      <body className={`${mulish.className} dark antialiased`}>
        <ClerkProvider appearance={{ baseTheme: dark }}>
          {children}
          <PwaInstallPrompt />
        </ClerkProvider>
      </body>
    </html>
  );
}
