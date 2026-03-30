"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from "@heroui/react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (!user) {
    return null;
  }

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          isBordered
          as="button"
          className="transition-transform cursor-pointer"
          src={user.photoURL || undefined}
          name={user.displayName || user.email || "Usuario"}
          size="sm"
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="Opciones de usuario" variant="flat">
        <DropdownItem key="profile" className="h-14 gap-2" textValue="Perfil de usuario">
          <p className="font-semibold">Sesión iniciada como</p>
          <p className="font-semibold">{user.email}</p>
        </DropdownItem>
        <DropdownItem
          key="logout"
          color="danger"
          onPress={handleSignOut}
          textValue="Cerrar sesión"
        >
          Cerrar sesión
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
