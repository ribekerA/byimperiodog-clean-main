/**
 * PuppyBenefits v2.0 - Design System Refactor
 * Lista de benefícios e diferenciais do criador
 * UX: Visual claro com ícones, hierarquia de informação
 * A11y: Lista semântica, ícones decorativos
 * 
 * Migrado para usar componentes do Design System:
 * - Card para cada benefício
 */

import { Award, Heart, Shield, Sparkles, Stethoscope, Video } from "lucide-react";

import { Card, CardContent } from "@/components/ui";

export function PuppyBenefits() {
  const benefits = [
    {
      icon: Stethoscope,
      title: "Acompanhamento veterinário completo",
      description: "Exames genéticos, cardiológicos e protocolo de vacinação com laudos digitais.",
    },
    {
      icon: Heart,
      title: "Socialização guiada desde o nascimento",
      description: "Exposição controlada a estímulos, pessoas e ambientes para filhote equilibrado.",
    },
    {
      icon: Sparkles,
      title: "Mentoria vitalícia para tutores",
      description: "Suporte contínuo via WhatsApp com orientações sobre rotina, nutrição e comportamento.",
    },
    {
      icon: Shield,
      title: "Garantia de saúde e procedência",
      description: "Contrato detalhado, pedigree CBKC e rastreabilidade completa da linhagem.",
    },
    {
      icon: Video,
      title: "Chamadas de vídeo antes da adoção",
      description: "Conheça o filhote, veja sua personalidade e tire todas as dúvidas online.",
    },
    {
      icon: Award,
      title: "Entrega segura e humanizada",
      description: "Transporte especializado ou retirada presencial com orientação completa.",
    },
  ];

  return (
    <section aria-labelledby="benefits-heading" className="space-y-6">
      <div>
        <h2 id="benefits-heading" className="text-2xl font-bold text-zinc-900">
          O que você recebe
        </h2>
        <p className="mt-2 text-base text-zinc-600">
          Muito mais que um filhote: um processo completo pensado para famílias responsáveis
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <li key={index}>
              <Card 
                variant="outline" 
                interactive
                className="h-full overflow-hidden transition hover:border-emerald-200"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition group-hover:bg-emerald-100">
                      <Icon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-zinc-900">{benefit.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
