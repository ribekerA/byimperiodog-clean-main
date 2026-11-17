/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Jornada, type EtapaJornada } from "../../app/(admin)/admin/(protected)/_ui/Jornada";

const etapas: EtapaJornada[] = [
  { id: "a", titulo: "Credenciais", descricao: "definir variaveis", feito: false, acao: <button>Ver o que falta</button> },
  { id: "b", titulo: "Conectar", descricao: "login", feito: false, bloqueadoPor: "credenciais" },
];

describe("Jornada", () => {
  it("sem leitura do estado, nao manda configurar nada", () => {
    render(<Jornada etapas={etapas} naoVerificado="A verificacao respondeu 500." />);

    expect(screen.getByText("Nao consegui conferir o estado agora")).toBeInTheDocument();
    expect(screen.getByText(/A verificacao respondeu 500\./)).toBeInTheDocument();
    expect(screen.getAllByText("(nao verificada)")).toHaveLength(2);
    expect(screen.queryByText("(pendente)")).not.toBeInTheDocument();
    expect(screen.queryByText("Proximo passo")).not.toBeInTheDocument();
    expect(screen.queryByText("Ver o que falta")).not.toBeInTheDocument();
    expect(screen.queryByText(/0 de 2/)).not.toBeInTheDocument();
  });

  it("com leitura, segue mostrando o proximo passo", () => {
    render(<Jornada etapas={etapas} />);

    expect(screen.getByText("0 de 2 etapas concluidas")).toBeInTheDocument();
    expect(screen.getByText("Proximo passo")).toBeInTheDocument();
    expect(screen.getByText("Ver o que falta")).toBeInTheDocument();
  });
});
