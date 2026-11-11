const BLOCO = "animate-pulse rounded bg-[var(--border)] motion-reduce:animate-none";
const CARTAO = "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5";

/** Esqueleto com o mesmo desenho da tela pronta, para nada pular de lugar quando os numeros chegam. */
export default function AnalyticsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5" role="status" aria-label="Carregando o analytics">
      <div aria-hidden="true" className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className={`${BLOCO} h-7 w-36`} />
            <div className={`${BLOCO} h-4 w-64`} />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={`${BLOCO} h-11 w-20 rounded-xl`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={CARTAO}>
              <div className={`${BLOCO} h-3 w-24`} />
              <div className={`${BLOCO} mt-3 h-8 w-16`} />
              <div className={`${BLOCO} mt-3 h-3 w-full`} />
            </div>
          ))}
        </div>

        <div className={CARTAO}>
          <div className={`${BLOCO} h-5 w-40`} />
          <div className={`${BLOCO} mt-4 h-44 rounded-xl`} />
        </div>

        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((__, index) => (
              <div key={index} className={CARTAO}>
                <div className={`${BLOCO} h-5 w-40`} />
                <div className={`${BLOCO} mt-4 h-40 rounded-xl`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
