"use client";

/**
 * PuppyDetailPanel — Painel de detalhes animado para a página do filhote.
 *
 * Features:
 *  • Taxonomia (cor e sexo) com link para as páginas editoriais
 *  • Preço com entrada animada (scale + fade)
 *  • Descrição com ScrollReveal
 *  • "Incluído no valor" com stagger por item
 *  • CTA principal com PawConfetti
 *  • HeartBurst para favoritar
 *
 * O que saiu em 26/08/2026, e por quê:
 *
 *  • O selo de status com ponto pulsante ("Disponível" / "Reservado" /
 *    "Vendido"). Ele lia um campo do arquivo estático que só mudava em deploy,
 *    então anunciava como disponível o filhote que já tinha saído.
 *  • O selo de escassez ("Último desta cor" / "Apenas 2 disponíveis"), contado
 *    sobre esse mesmo campo — urgência calculada a partir de um dado velho.
 *  • O ramo "Este filhote já foi para sua família", que escondia o CTA. Uma
 *    página sem CTA é uma página que recebe visita orgânica e não faz nada com
 *    ela; e marcar a página como vendida é exatamente o que impede a foto de
 *    seguir trabalhando como referência visual daquela cor e daquele sexo.
 *
 * A página é permanente. Quem informa o que existe hoje é o atendimento.
 */

import { motion } from "framer-motion";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { HeartBurstButton } from "@/components/motion/HeartBurst";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { FOUNDING_YEAR } from "@/domain/config";
import { formatarPreco } from "@/domain/pricing";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";

// Formatacao de preco vem do dominio, nao daqui.
//
// Este arquivo tinha o seu proprio Intl.NumberFormat com style: "currency".
// Aquele formato separa "R$" do numero com espaco sem quebra (U+00A0), e o
// resto do site escreve "R$ 9.500" com espaco comum. Os dois sao identicos na
// tela e diferentes como texto: a pagina do filhote publicava o preco com
// U+00A0 enquanto a tabela publicava com espaco comum, e nenhuma checagem de
// texto conseguia ligar os dois. formatarPreco e a unica forma reconhecida.

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  name: string;
  corLabel: string;
  colorSlug: string;
  sexLabel: string;
  sexSlug: string;
  priceCents?: number;
  description: string;
  waLink: string;
  slug: string;
}

// ─── Configurações ────────────────────────────────────────────────────────────

const INCLUDED = [
  { icon: "📋", title: "Registro oficial",     desc: "Documento oficial da raça"        },
  { icon: "❤️", title: "Consulta veterinária", desc: "Avaliação clínica e hemograma completo" },
  { icon: "💉", title: "Protocolo vacinal",   desc: "Em dia conforme a idade, carteira assinada pelo médico-veterinário" },
  { icon: "🔖", title: "Identificação do animal", desc: "Identificação individual, conforme os requisitos da legislação aplicável" },
  { icon: "🎓", title: "Mentoria pós-venda",  desc: "Suporte direto com a criadora"   },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatPrice(cents?: number) {
  if (!cents) return null;
  return formatarPreco(cents);
}

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PuppyDetailPanel({
  name,
  corLabel,
  colorSlug,
  sexLabel,
  sexSlug,
  priceCents,
  description,
  waLink,
  slug,
}: Props) {
  const trackedWaLink = useWhatsAppLink(waLink);
  const price = formatPrice(priceCents);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Taxonomia ────────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-wrap items-center gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
      >
        <Link
          href={`/filhotes/cor/${colorSlug}`}
          className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 hover:text-emerald-700"
        >
          Cor: {corLabel}
        </Link>

        <Link
          href={`/filhotes/sexo/${sexSlug}`}
          className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 hover:text-emerald-700"
        >
          {sexLabel}
        </Link>
      </motion.div>

      {/* ── Nome ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.18 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          {name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Spitz Alemão Anão · Bragança Paulista, SP
        </p>
      </motion.div>

      {/* ── Preço ────────────────────────────────────────────────────────── */}
      {price && (
        <motion.div
          className="flex flex-wrap items-end gap-3"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.26 }}
        >
          <div>
            <p className="text-3xl font-extrabold text-[var(--accent-ink)]" aria-label={`Preço: ${price}`}>{price}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Registro oficial, consulta veterinária e mentoria inclusos</p>
          </div>
        </motion.div>
      )}

      {/* ── Descrição ────────────────────────────────────────────────────── */}
      <ScrollReveal variant="fadeIn" delay={0.08}>
        <p className="text-base leading-relaxed text-zinc-700">{description}</p>
      </ScrollReveal>

      {/* ── CTA principal ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.36 }}
        >
          <PawConfettiButton
            href={trackedWaLink}
            data-wa-placement="puppy_page"
            rel="noreferrer"
            target="_blank"
            // O <span> do rótulo é `truncate` (white-space: nowrap). Como item
            // de flex, o mínimo automático dele é o texto inteiro, então este
            // wrapper se recusava a encolher abaixo de 246px: com o botão de
            // coração (56px) e o gap, a linha do CTA pedia 314px dentro de uma
            // coluna de 288px e empurrava a página inteira para 330px de
            // largura em tela de 320px. `min-w-0` devolve ao truncate o direito
            // de cortar o texto. Em telas normais nada muda — sobra espaço.
            wrapperClassName="min-w-0 flex-1"
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:gap-2.5 sm:px-6 sm:text-base"
            emojis="mixed"
            count={16}
            aria-label={`Entrar em contato sobre ${name} via WhatsApp`}
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {/* Sem `truncate`: em tela de 320px o rótulo virava "Consultar
                opções…" e o CTA perdia justamente o complemento. Deixando
                quebrar, ele usa duas linhas dentro dos mesmos 56px de altura e
                a frase chega inteira. De 360px para cima continua em uma linha
                só, igual a antes. */}
            <span className="text-center">Consultar opções atuais</span>
          </PawConfettiButton>

          <HeartBurstButton
            puppyId={slug}
            size={22}
            className="h-14 w-14 rounded-xl"
          />
        </motion.div>

        {/* Aviso de vitrine — curto, colado no CTA, onde a dúvida aparece */}
        <p className="text-xs leading-relaxed text-zinc-500">
          Esta página é uma referência visual de {corLabel} {sexLabel.toLowerCase()}: as
          fotos são reais e ficam no ar de forma permanente.{" "}
          <span className="font-medium text-zinc-700">
            Fale com a equipe para conhecer as opções atuais no atendimento.
          </span>
        </p>
      </div>

      {/* ── Incluído no valor ────────────────────────────────────────────── */}
      <ScrollReveal variant="fadeUp" delay={0.05}>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Incluído no valor
          </p>

          <StaggerContainer stagger={0.07} delay={0.1} margin="-20px">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUDED.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="group flex items-start gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 transition hover:border-emerald-100 hover:bg-emerald-50/60">
                    <span className="mt-0.5 text-lg leading-none" aria-hidden="true">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-800">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-snug text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </ScrollReveal>

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <ScrollReveal variant="fadeIn" delay={0.1}>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3">
          {[
            { icon: "🏆", text: `Criando desde ${FOUNDING_YEAR}` },
            { icon: "📄", text: "Contrato de compra e venda" },
            // "Entregamos em todo o Brasil" descrevia uma operacao de transporte que
            // o canil nao tem. O alcance e verdade; a operacao e do tutor.
            { icon: "✈️", text: "Atendemos todo o Brasil" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span aria-hidden="true">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
