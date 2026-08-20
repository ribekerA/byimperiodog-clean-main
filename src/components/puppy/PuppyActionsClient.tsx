/**
 * Wrapper client para ações interativas da página de produto
 * Permite que os botões de "mais fotos" e "agendar visita" funcionem
 */

"use client";

import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

import { PuppyActions } from "./PuppyActions";

type Props = {
  whatsappLink: string;
  puppyName: string;
  puppySlug: string;
};

export function PuppyActionsClient({ whatsappLink, puppyName, puppySlug }: Props) {
  const trackedWhatsappLink = useWhatsAppLink(whatsappLink);
  const photosLink = useWhatsAppLink(
    buildWhatsAppLink({
      message: `Olá! Gostaria de receber mais fotos e vídeos do ${puppyName}.`,
      utmSource: "site",
      utmMedium: "product_page",
      utmCampaign: "request_photos",
      utmContent: puppySlug,
    }),
  );
  const visitLink = useWhatsAppLink(
    buildWhatsAppLink({
      message: `Olá! Quero agendar uma visita (online ou presencial) para conhecer o ${puppyName}.`,
      utmSource: "site",
      utmMedium: "product_page",
      utmCampaign: "schedule_visit",
      utmContent: puppySlug,
    }),
  );

  return (
    <PuppyActions
      whatsappLink={trackedWhatsappLink}
      puppyName={puppyName}
      onRequestPhotos={() => {
        window.open(
          photosLink,
          "_blank",
          "noopener,noreferrer"
        );
      }}
      onScheduleVisit={() => {
        window.open(
          visitLink,
          "_blank",
          "noopener,noreferrer"
        );
      }}
    />
  );
}
