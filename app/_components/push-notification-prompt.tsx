"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { BellIcon, XIcon } from "lucide-react";

const PUSH_DISMISSED_KEY = "push-notification-dismissed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PushNotificationPrompt = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("PushManager" in window) || !("serviceWorker" in navigator)) return;

    // Don't show if already subscribed or permission denied
    if (Notification.permission === "denied") return;
    if (Notification.permission === "granted") {
      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) return; // Already subscribed
          setShowBanner(true);
        });
      });
      return;
    }

    // Check if dismissed recently (7 days)
    const dismissed = localStorage.getItem(PUSH_DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    setShowBanner(true);
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShowBanner(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
        ),
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setShowBanner(false);
    } catch (err) {
      console.error("Push subscription failed:", err);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(PUSH_DISMISSED_KEY, String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <BellIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Ativar notificacoes</p>
          <p className="text-xs text-muted-foreground">
            Receba lembretes de contas a vencer no seu celular
          </p>
        </div>
        <Button size="sm" onClick={handleEnable} className="shrink-0">
          Ativar
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

export default PushNotificationPrompt;
