/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import CommandPalette from "../../src/components/admin/CommandPalette";

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe("CommandPalette", () => {
  it("renders input and list", async () => {
    render(<CommandPalette open={true} onOpenChange={() => {}} />);
    expect(await screen.findByLabelText(/Busca rápida/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite para buscar/i)).toBeInTheDocument();
  });
});
