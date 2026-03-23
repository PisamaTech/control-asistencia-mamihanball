import Image from "next/image";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNavigation } from "@/components/BottomNavigation";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-default-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/Erik-Erikson-Logo.webp"
              alt="Erik Erikson Logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="font-bold text-primary">Control de Asistencias - Mamihandball</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 pb-20">{children}</main>
        <BottomNavigation />
      </div>
    </AuthGuard>
  );
}
