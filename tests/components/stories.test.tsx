import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

// Ensure components compiled with the classic runtime find React on the global scope during tests.
(globalThis as unknown as { React?: typeof React }).React = React;

import StoriesBar from "@/components/StoriesBar";
import type { Story } from "@/components/StoriesViewer";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    loader: _loader,
    fill: _fill,
    priority: _priority,
    ...rest
  }: {
    src: string;
    alt: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

const stories: Story[] = [
  {
    id: "aurora",
    title: "Aurora",
    slides: [
      {
        id: "aurora-1",
        title: "Aurora brincando",
        description: "Aurora explorando enriquecimento ambiental.",
        imageUrl: "/aurora.jpg",
      },
    ],
  },
  {
    id: "gaia",
    title: "Gaia",
    slides: [
      {
        id: "gaia-1",
        title: "Gaia em socialização",
        description: "Gaia em momento de socialização com outros cães.",
        imageUrl: "/gaia.jpg",
      },
    ],
  },
];

describe("StoriesBar + StoriesViewer", () => {
  it("abre story e fecha com tecla Escape", async () => {
    const user = userEvent.setup();
    render(<StoriesBar stories={stories} />);

    const openAurora = screen.getAllByRole("button", { name: /Abrir story de Aurora/i });
    await user.click(openAurora[0]);
    const closeButton = await screen.findByRole("button", { name: /Fechar stories/i });
    expect(closeButton).toBeVisible();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Fechar stories/i })).not.toBeInTheDocument();
    });
  });

  it("permite navegar pelos stories e fechar pelo botão fixo", async () => {
    const user = userEvent.setup();
    render(<StoriesBar stories={stories} />);

    const openAurora = screen.getAllByRole("button", { name: /Abrir story de Aurora/i });
    await user.click(openAurora[0]);
    const closeButton = await screen.findByRole("button", { name: /Fechar stories/i });

    expect(screen.getByText("1 de 2")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("2 de 2")).toBeInTheDocument();

    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Fechar stories/i })).not.toBeInTheDocument();
    });
  });
});
