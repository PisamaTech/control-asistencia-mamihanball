import { AuthGuard } from "@/components/AuthGuard";
import { BottomNavigation } from "@/components/BottomNavigation";
import { SignOutButton } from "@/components/SignOutButton";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-default-200 px-4 py-3">
          <span className="font-bold text-primary">MamiHandball</span>
          <SignOutButton />
        </header>
        <main className="flex-1 pb-20">{children}</main>
        <BottomNavigation />
      </div>
    </AuthGuard>
  );
}
