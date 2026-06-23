"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import PushNotificationPrompt from "./push-notification-prompt";
import PwaInstallPrompt from "./pwa-install-prompt";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      appearance={resolvedTheme === "dark" ? { baseTheme: dark } : undefined}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      {children}
      <PwaInstallPrompt />
      <PushNotificationPrompt />
      <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} />
    </ClerkProvider>
  );
};

export default Providers;
