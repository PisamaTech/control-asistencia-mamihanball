"use client";

import { HeroUIProvider } from "@heroui/react";
import { I18nProvider } from "@react-aria/i18n";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <HeroUIProvider locale="es-AR">
        <I18nProvider locale="es-AR">
          {children}
        </I18nProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
