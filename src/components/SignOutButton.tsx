"use client";

import { Button } from "@heroui/react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Button size="sm" variant="light" onPress={handleSignOut}>
      Salir
    </Button>
  );
}
