import { CheckCircle, MapPin, Phone, Shield, Star, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import StaticCatalog from "@/components/catalog/StaticCatalog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buttonVariants } from "@/components/ui/button";
import { puppiesPublicados } from "@/content/puppies-static";
import { cn } from "@/lib/cn";
import { canonical } from "@/lib/seo.core";
import { buildWebPageLD } from "@/lib/structured-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://byimperiodog.com.br";
const WA_PHONE = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") || "5511968633239";
const WA_LINK = `https://wa.me/${WA_PHONE}`;

export const metadata: Metadata = {
  // Com "(Lulu da Pomerânia)" o title batia em 89 caracteres somando o sufixo
  // da marca e o Google cortava o estado. O sinônimo continua na description.
  title: "Filhotes Spitz Alemão Anão no Rio de Janeiro",
  description:
    // 185 caracteres: o Google cortava a lista de regiões atendidas, que é o
    // que essa página tem de próprio. Reescrita em 159.
    "Filhotes de Spitz Alemão Anão com entrega segura no Rio de Janeiro: capital, Niterói, região metropolitana e interior. Com registro oficial.",
  alternates: { canonical: canonical("/filhotes/rio-de-janeiro") },
  openGraph: {
    type: "website",
    url: canonical("/filhotes/rio-de-janeiro"),
    title: "Filhotes de Spitz Alemão Anão no Rio de Janeiro",
    description: "Compre Spitz Alemão Anão com entrega em todo RJ. Criadora especializada.",
    images: [{ url: "/spitz-hero-desktop.webp", width: 1400, height: 933 }],
  },
};

const rjCities = [
  "Rio de Janeiro Capital",
  "Zona Sul (Copacabana, Ipanema, Leblon)",
  "Zona Norte (Tijuca, Maracanã)",
  "Barra da Tijuca",
  "Niterói",
  "São Gonçalo",
  "Duque de Caxias",
  "Nova Iguaçu",
  "Petrópolis",
  "Cabo Frio e Região dos Lagos",
  "Campos dos Goytacazes",
];

const faqRJ = [
  {
    question: "Vocês fazem entrega no Rio de Janeiro?",
    answer:
      "Sim! Fazemos entrega em toda a capital carioca, Niterói, região metropolitana e interior do RJ. A entrega é segura, com transporte especializado para filhotes, e você recebe todas as orientações necessárias.",
  },
  {
    question: "Posso buscar o filhote pessoalmente?",
    answer:
      "Sim! Nosso criatório fica em Bragança Paulista (SP), mas recebemos tutores do Rio de Janeiro que preferem buscar pessoalmente. Você pode conhecer os filhotes e os pais mediante agendamento.",
  },
  {
    question: "Qual o valor da entrega para o Rio de Janeiro?",
    answer:
      "O valor da entrega varia conforme a região e distância. Para capital e região metropolitana temos condições especiais. Consulte nossa equipe via WhatsApp para saber o valor exato para sua cidade.",
  },
  {
    question: "O filhote vem com documentação e vacinas?",
    answer:
      "Sim. Todos os filhotes vêm com registro oficial, protocolo vacinal em dia conforme a idade do filhote — com carteira de vacinação assinada pelo médico-veterinário e orientação para as doses seguintes —, vermifugação em dia, consulta veterinária antes da entrega, hemograma completo e contrato.",
  },
  {
    question: "Spitz Alemão Anão se adapta bem ao clima do Rio?",
    answer:
      "Sim! Apesar da pelagem farta, o Spitz Alemão Anão se adapta muito bem ao clima carioca. Recomendamos manter o filhote em ambientes frescos nas horas mais quentes e garantir acesso constante a água. A tosa higiênica ajuda no conforto.",
  },
];

export default function FilhotesRioDeJaneiroPage() {
  const waText =
    "Olá! Gostaria de informações sobre filhotes de Spitz Alemão Anão disponíveis no Rio de Janeiro.";
  const waLink = `${WA_LINK}?text=${encodeURIComponent(waText)}`;

  // Uma empresa so no grafo. Cada pagina de estado emitia um LocalBusiness
  // proprio, com @id proprio: para o Google eram tres negocios distintos,
  // todos declarando o mesmo telefone e o mesmo endereco em Braganca
  // Paulista. O canil e um so e ja esta descrito por buildLocalBusinessLD(),
  // emitido uma vez no layout publico. Aqui a pagina se descreve como
  // pagina e aponta para aquele no, em vez de inventar uma filial.
  const webPageLd = buildWebPageLD({
    path: "/filhotes/rio-de-janeiro",
    name: "Filhotes de Spitz Alemão Anão no Rio de Janeiro",
    // Mesma imagem do og:image desta pagina: primaryImageOfPage e og:image
    // apontando para arquivos diferentes e um sinal contraditorio.
    image: "/spitz-hero-desktop.webp",
    imageWidth: 1400,
    imageHeight: 933,
  });


  // Breadcrumb
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Filhotes", item: `${SITE_URL}/filhotes` },
      { "@type": "ListItem", position: 3, name: "Rio de Janeiro", item: `${SITE_URL}/filhotes/rio-de-janeiro` },
    ],
  };

  return (
    <>
      <script
        id="webpage-rj-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />
      <script
        id="breadcrumb-rj-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="bg-[var(--bg)] pb-24 pt-16">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-5 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-[var(--brand)]" />
            Atendemos todo o Rio de Janeiro
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
            Filhotes de Spitz Alemão Anão
            <span className="block text-[var(--brand)]">no Rio de Janeiro (RJ)</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-[var(--text-muted)]">
            Compre seu Spitz Alemão Anão (Lulu da Pomerânia) com segurança e entrega em toda a capital, Niterói, região
            metropolitana e interior do RJ. Criadora especializada com suporte pós-venda.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 bg-[#25D366] hover:bg-[#20BA5A]")}
            >
              <WhatsAppIcon className="h-5 w-5" />
              Falar com a Criadora
            </a>
            <Link href="#vitrine" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Ver a Vitrine de Filhotes
            </Link>
          </div>
        </section>

        {/* Atendimento no RJ */}
        <section className="mx-auto mt-20 max-w-6xl px-5">
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--text)]">
            Atendemos Toda a Região do Rio de Janeiro
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rjCities.map((city) => (
              <div
                key={city}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-[var(--brand)]" />
                <span className="font-medium text-[var(--text)]">{city}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Diferenciais */}
        <section className="mx-auto mt-20 max-w-6xl px-5">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Truck className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--text)]">Entrega Segura</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Transporte especializado para filhotes em todo RJ
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Shield className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--text)]">Registro oficial</h3>
              <p className="text-sm text-[var(--text-muted)]">Todos os filhotes com registro oficial</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Star className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--text)]">Criação Especializada</h3>
              <p className="text-sm text-[var(--text-muted)]">Spitz Alemão Anão como única raça, em Bragança Paulista (SP)</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Phone className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--text)]">Suporte pós-venda</h3>
              <p className="text-sm text-[var(--text-muted)]">Contato direto com a criadora pelo WhatsApp</p>
            </div>
          </div>
        </section>

        {/* Vitrine de filhotes */}
        <section id="vitrine" className="mx-auto mt-20 max-w-7xl px-5">
          {/* Era "Filhotes Disponíveis" — a página anunciava estoque em cima
              de uma vitrine de fotos permanentes, que continuam no ar depois
              que aquele filhote encontra a família dele. */}
          <h2 className="mb-4 text-center text-3xl font-bold text-[var(--text)]">Vitrine de filhotes</h2>
          <p className="mb-8 text-center text-sm text-[var(--text-muted)]">
            Fotos reais das cores e dos sexos com que a By Império Dog trabalha.{" "}
            <span className="font-medium text-[var(--text)]">Consulte as opções atuais pelo WhatsApp.</span>
          </p>
          {/* PuppiesGrid busca o catálogo no Supabase pelo navegador, então o
              HTML servido nestas três páginas saía sem filhote nenhum: o Google
              indexava uma seção vazia e o visitante via a página em branco até o
              fetch responder. StaticCatalog é o mesmo componente de /filhotes e
              já chega renderizado do servidor. */}
          <StaticCatalog puppies={puppiesPublicados as any[]} headingLevel={2} />
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-20 max-w-4xl px-5">
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--text)]">
            Perguntas Frequentes - Rio de Janeiro
          </h2>
          <div className="space-y-4">
            {faqRJ.map((item, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--brand)]"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 font-semibold text-[var(--text)] marker:content-none">
                  <span>{item.question}</span>
                  <span className="flex-shrink-0 text-[var(--brand)] transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-[var(--text-muted)]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="mx-auto mt-20 max-w-4xl px-5 text-center">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-[var(--text)]">Pronto para ter seu Spitz Alemão Anão no Rio de Janeiro?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
              Fale agora com nossa equipe e garanta seu filhote com entrega segura em todo o RJ
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "mt-6 gap-2 bg-[#25D366] hover:bg-[#20BA5A]")}
            >
              <WhatsAppIcon className="h-5 w-5" />
              Falar no WhatsApp
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
