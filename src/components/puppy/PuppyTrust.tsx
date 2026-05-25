/**
 * PuppyTrust v2.0 - Design System Refactor
 * Bloco de confiança: garantias, transparência, processo
 * UX: Redução de fricção no funil de conversão
 * A11y: Estrutura semântica clara
 * 
 * Migrado para usar componentes do Design System:
 * - Card para cada elemento de confiança
 */

import { CheckCircle2, FileText, ShieldCheck, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui";

export function PuppyTrust() {
  return (
    <section aria-labelledby="trust-heading" className="space-y-6">
      <div className="text-center">
        <h2 id="trust-heading" className="text-2xl font-bold text-zinc-900">
          Por que escolher a By Império Dog?
        </h2>
        <p className="mt-2 text-base text-zinc-600">
          Transparência total em cada etapa do processo
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="outline" className="bg-gradient-to-br from-white to-zinc-50">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <ShieldCheck className="h-7 w-7 text-emerald-600" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900">Garantia de 30 dias</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Cobertura completa para problemas congênitos com suporte veterinário
            </p>
          </CardContent>
        </Card>

        <Card variant="outline" className="bg-gradient-to-br from-white to-zinc-50">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <FileText className="h-7 w-7 text-blue-600" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900">Contrato detalhado</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Todos os direitos e deveres documentados com clareza e segurança jurídica
            </p>
          </CardContent>
        </Card>

        <Card variant="outline" className="bg-gradient-to-br from-white to-zinc-50">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
              <CheckCircle2 className="h-7 w-7 text-purple-600" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900">Origem rastreável</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Pedigree CBKC com histórico completo da linhagem e exames dos pais
            </p>
          </CardContent>
        </Card>

        <Card variant="outline" className="bg-gradient-to-br from-white to-zinc-50">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <Users className="h-7 w-7 text-rose-600" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900">Suporte vitalício</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Grupo exclusivo de tutores com check-ins mensais e orientação contínua
            </p>
          </CardContent>
        </Card>
      </div>

      <Card variant="outline" className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-emerald-900">
            ✓ Processo completo de adoção responsável
          </h3>
          <ol className="mt-4 space-y-2 text-sm text-zinc-700">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-emerald-700">1.</span>
            <span>
              <strong>Entrevista inicial:</strong> conhecemos sua rotina, expectativas e preparamos você para a chegada
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-emerald-700">2.</span>
            <span>
              <strong>Visita online:</strong> chamadas de vídeo para ver o filhote, tirar dúvidas e criar vínculo
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-emerald-700">3.</span>
            <span>
              <strong>Contrato e reserva:</strong> documentação clara, pagamento seguro e cronograma definido
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-emerald-700">4.</span>
            <span>
              <strong>Acompanhamento pré-entrega:</strong> updates semanais com fotos, vídeos e orientações
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-emerald-700">5.</span>
            <span>
              <strong>Entrega humanizada:</strong> transporte especializado ou retirada com kit completo
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-emerald-700">6.</span>
            <span>
              <strong>Suporte pós-adoção:</strong> WhatsApp direto, grupo de tutores e check-ins mensais
            </span>
          </li>
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}