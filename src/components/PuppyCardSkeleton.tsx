export default function PuppyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
      {/* Imagem simulada */}
      <div className="relative aspect-[4/3] w-full bg-zinc-200 rounded-t-3xl">
        {/* Selo simulado */}
        <div className="absolute bottom-2 left-2 h-5 w-28 rounded-full bg-zinc-300" />
      </div>

      {/* Conteúdo simulado */}
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/2 rounded bg-zinc-300" /> {/* Nome */}
        <div className="h-3 w-1/3 rounded bg-zinc-300" /> {/* Preço */}
        <div className="mt-4 h-9 w-full rounded-xl bg-zinc-300" /> {/* Botão simulado */}
        <div className="grid grid-cols-3 gap-2">
          <div className="h-8 rounded-xl bg-zinc-300" />
          <div className="h-8 rounded-xl bg-zinc-300" />
          <div className="h-8 rounded-xl bg-zinc-300" />
        </div>
        <div className="pt-3 h-3 w-2/3 rounded bg-zinc-200" /> {/* Status */}
      </div>
    </div>
  );
}
