import PixelsByConsent from "@/components/PixelsByConsent";
import {
  getPixelsSettings,
  resolveActiveEnvironment,
  type PixelsSettings,
} from "@/lib/pixels";

type PixelsProps = {
  isAdminRoute: boolean;
  settings?: PixelsSettings;
};

export async function Pixels({ isAdminRoute, settings }: PixelsProps) {
  if (isAdminRoute) return null;

  const data = settings ?? (await getPixelsSettings());
  const { config } = resolveActiveEnvironment(data);

  const useGTM = Boolean(config.gtmId);

  return (
    <PixelsByConsent
      isAdminRoute={false}
      useGTM={useGTM}
      GTM_ID={config.gtmId ?? undefined}
      GA4_ID={config.ga4Id ?? undefined}
      FB_ID={config.metaPixelId ?? undefined}
      TT_ID={config.tiktokPixelId ?? undefined}
      PIN_ID={config.pinterestId ?? undefined}
      HOTJAR_ID={config.hotjarId ?? undefined}
      CLARITY_ID={config.clarityId ?? undefined}
      ADS_ID={config.googleAdsId ?? undefined}
      ADS_LABEL={config.googleAdsConversionLabel ?? undefined}
      analyticsConsentRequired={config.analyticsConsent}
      marketingConsentRequired={config.marketingConsent}
    />
  );
}

export default Pixels;
