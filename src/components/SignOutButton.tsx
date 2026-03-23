"use client";

import Image from "next/image";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@heroui/react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const userPhotoURL = user?.photoURL || "";
  const userName = user?.displayName || user?.email || "Usuario";

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          isBordered
          as="button"
          className="transition-transform cursor-pointer"
          color="primary"
          size="sm"
          src={userPhotoURL}
          name={userName}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="Profile Actions" variant="flat">
        <DropdownItem key="profile" className="h-14 gap-2" textValue="Profile">
          <p className="font-semibold">Sesión iniciada como</p>
          <p className="font-semibold">{user?.email}</p>
        </DropdownItem>
        <DropdownItem key="logout" color="danger" onPress={handleSignOut} textValue="Cerrar sesión">
          Cerrar sesión
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
