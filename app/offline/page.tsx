"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <WifiOff className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Sem conexão</h1>
      <p className="max-w-sm text-muted-foreground">
        Você está offline. Verifique sua conexão com a internet e tente
        novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Tentar novamente
      </button>
    </div>
  );
}
