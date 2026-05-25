"use client";

import { useEffect, useState } from "react";

import { supabasePublic } from "@/lib/supabasePublic";

export type PuppyNorm = {
  id: string;
  name: string;
  color?: string | null;
  gender?: "male" | "female" | null;
  status?: "disponivel" | "reservado" | "vendido" | null;
  priceCents?: number | null;
  birthDate?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  delivery?: boolean | null;
  midia?: string[]; // imagens/vídeos (campo legado)
};

export function usePuppy(id: string | null) {
  const [data, setData] = useState<PuppyNorm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let abort = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const s = supabasePublic();
        const { data, error } = await s
          .from("puppies")
          .select(
            "id,nome,name,cor,color,gender,status,price_cents,priceCents,nascimento,birthDate,descricao,description,midia,imageUrl,delivery"
          )
          .eq("id", id)
          .single();

        if (error) throw new Error(error.message);
        if (abort || !data) return;

        const p: any = data;

        setData({
          id: p.id,
          name: p.name ?? p.nome ?? "Filhote",
          color: p.color ?? p.cor ?? null,
          gender: p.gender ?? null,
          status: p.status ?? null,
          priceCents: p.priceCents ?? p.price_cents ?? null,
          birthDate: p.birthDate ?? p.nascimento ?? null,
          description: p.description ?? p.descricao ?? null,
          imageUrl: p.imageUrl ?? null,
          delivery: p.delivery ?? null,
          midia: (p.midia ?? []) as string[],
        });
      } catch (e: any) {
        if (!abort) setErr(e?.message || "Erro ao carregar filhote");
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [id]);

  return { data, loading, error };
}
