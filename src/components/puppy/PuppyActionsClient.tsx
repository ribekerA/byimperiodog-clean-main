/**
 * Wrapper client para ações interativas da página de produto
 * Permite que os botões de "mais fotos" e "agendar visita" funcionem
 */

"use client";

import { buildWhatsAppLink } from "@/lib/whatsapp";

import { PuppyActions } from "./PuppyActions";

type Props = {
  whatsappLink: string;
  puppyName: string;
  puppySlug: string;
};

export function PuppyActionsClient({ whatsappLink, puppyName, puppySlug }: Props) {
  return (
    <PuppyActions
      whatsappLink={whatsappLink}
      puppyName={puppyName}
      onRequestPhotos={() => {
        window.open(
          buildWhatsAppLink({
            message: `Olá! Gostaria de receber mais fotos e vídeos do ${puppyName}.`,
            utmSource: "site",
            utmMedium: "product_page",
            utmCampaign: "request_photos",
            utmContent: puppySlug,
          }),
          "_blank",
          "noopener,noreferrer"
        );
      }}
      onScheduleVisit={() => {
        window.open(
          buildWhatsAppLink({
            message: `Olá! Quero agendar uma visita (online ou presencial) para conhecer o ${puppyName}.`,
            utmSource: "site",
            utmMedium: "product_page",
            utmCampaign: "schedule_visit",
            utmContent: puppySlug,
          }),
          "_blank",
          "noopener,noreferrer"
        );
      }}
    />
  );
}
