import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthGuard } from "./AuthGuard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock Firebase auth
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

// Mock our firebase instance
vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
}));

// Mock isAuthorized
vi.mock("@/lib/auth", () => ({
  isAuthorized: vi.fn(),
}));

import { onAuthStateChanged } from "firebase/auth";
import { redirect } from "next/navigation";
import { isAuthorized } from "@/lib/auth";

const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
const mockRedirect = vi.mocked(redirect);
const mockIsAuthorized = vi.mocked(isAuthorized);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthGuard", () => {
  it("shows a loading spinner while auth state is being determined", () => {
    // onAuthStateChanged never calls back → loading state
    mockOnAuthStateChanged.mockImplementation(() => () => {});

    render(
      <AuthGuard>
        <div>contenido protegido</div>
      </AuthGuard>
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("contenido protegido")).not.toBeInTheDocument();
  });

  it("redirects to / when user is not authenticated", async () => {
    // onAuthStateChanged calls back immediately with null
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return () => {};
    });

    render(
      <AuthGuard>
        <div>contenido protegido</div>
      </AuthGuard>
    );

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("renders children when user is authorized", async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback({ uid: "user-123" });
      return () => {};
    });
    mockIsAuthorized.mockResolvedValue(true);

    render(
      <AuthGuard>
        <div>contenido protegido</div>
      </AuthGuard>
    );

    expect(await screen.findByText("contenido protegido")).toBeInTheDocument();
  });

  it("shows access denied when user is not in the authorized list", async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback({ uid: "user-456" });
      return () => {};
    });
    mockIsAuthorized.mockResolvedValue(false);

    render(
      <AuthGuard>
        <div>contenido protegido</div>
      </AuthGuard>
    );

    expect(await screen.findByText("Sin acceso")).toBeInTheDocument();
    expect(screen.queryByText("contenido protegido")).not.toBeInTheDocument();
  });
});
