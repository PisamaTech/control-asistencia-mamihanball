"use client";

import { HeroUIProvider } from "@heroui/react";
import { I18nProvider } from "@react-aria/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider locale="es-AR">
      <I18nProvider locale="es-AR">
        {children}
      </I18nProvider>
    </HeroUIProvider>
  );
}
