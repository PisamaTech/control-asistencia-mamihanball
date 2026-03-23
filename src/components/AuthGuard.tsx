"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/firebase";
import { isAuthorized } from "@/lib/auth";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "unauthorized" }
  | { status: "authorized"; user: User };

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({ status: "unauthenticated" });
        return;
      }
      try {
        const authorized = await isAuthorized(user.uid);
        setAuthState(authorized ? { status: "authorized", user } : { status: "unauthorized" });
      } catch {
        setAuthState({ status: "unauthorized" });
      }
    });
    return unsubscribe;
  }, []);

  if (authState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span role="status" aria-label="Cargando">
          <svg className="h-8 w-8 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </span>
      </div>
    );
  }

  if (authState.status === "unauthenticated") {
    redirect("/");
  }

  if (authState.status === "unauthorized") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div>
          <h1 className="text-xl font-bold text-danger">Sin acceso</h1>
          <p className="mt-2 text-default-500">Tu cuenta no está autorizada. Contactá a la administradora.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
