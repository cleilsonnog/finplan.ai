"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { DownloadIcon, XIcon } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWA_DISMISSED_KEY = "pwa-install-dismissed";

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Check if already dismissed recently (24h)
    const dismissed = localStorage.getItem(PWA_DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(PWA_DISMISSED_KEY, String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <Image
          src="/icon-finplanai-pwa.svg"
          width={40}
          height={40}
          alt="FinPlan.ai"
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Instalar FinPlan.ai</p>
          <p className="text-xs text-muted-foreground">
            Adicione como app no seu dispositivo para acesso rápido
          </p>
        </div>
        <Button size="sm" onClick={handleInstall} className="shrink-0">
          <DownloadIcon className="mr-1 h-4 w-4" />
          Instalar
        </Button>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
