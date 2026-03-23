import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BottomNavigation } from "./BottomNavigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("BottomNavigation", () => {
  it("renders exactly 4 navigation items", () => {
    render(<BottomNavigation />);
    const navItems = screen.getAllByRole("link");
    expect(navItems).toHaveLength(4);
  });

  it("links to correct routes", () => {
    render(<BottomNavigation />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /nueva sesión/i })).toHaveAttribute("href", "/sessions/new");
    expect(screen.getByRole("link", { name: /jugadoras/i })).toHaveAttribute("href", "/players");
    expect(screen.getByRole("link", { name: /reportes/i })).toHaveAttribute("href", "/reports");
  });

  it("marks the active route with aria-current", () => {
    render(<BottomNavigation />);
    const activeLink = screen.getByRole("link", { name: /dashboard/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });
});
