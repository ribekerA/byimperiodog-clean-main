export const revalidate = 0;

export default function ObrigadoPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">Obrigado! Recebemos seu interesse</h1>
      <p className="mt-3 text-muted-foreground">Em breve a By Império Dog entrará em contato para continuar seu atendimento.</p>
      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p>Prazo de contato: em até 24h úteis.</p>
        <p>Canais oficiais: WhatsApp e Instagram @byimperiodog.</p>
        <p>Fique de olho no seu WhatsApp para nossa mensagem inicial.</p>
      </div>
      <div className="mt-8">
        <a className="inline-block rounded bg-black px-4 py-2 text-white" href="/filhotes">Voltar aos filhotes</a>
      </div>
    </main>
  );
}
