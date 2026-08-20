/**
 * Estado padrão do Google Consent Mode v2 — precisa rodar ANTES de qualquer tag.
 *
 * O que estava errado: a política de privacidade afirmava que "cookies de
 * analytics e de marketing só são ativados após aceite", mas o layout público
 * subia o GTM em produção sem nenhuma checagem de consentimento. `setDefaultConsent()`
 * existia em src/lib/consent.ts e nunca era chamado — e mesmo se fosse, ele
 * desiste quando `window.gtag` ainda não existe, que é justamente o caso antes
 * do GTM carregar. Resultado: o texto legal descrevia um comportamento que o
 * código não tinha.
 *
 * O que este componente faz:
 * 1. cria `dataLayer` e `gtag` na mão, sem esperar o GTM;
 * 2. empurra `consent default` com analytics e publicidade em "denied";
 * 3. relê a preferência já salva no navegador e, se houver, empurra o
 *    `consent update` correspondente — senão quem já aceitou voltaria a ser
 *    tratado como negado a cada nova visita.
 *
 * Roda como <script> cru no <head> (mesmo padrão do scrollRestoration) porque
 * precisa ser síncrono e anterior ao GTM, que entra em `lazyOnload`.
 *
 * Efeito prático a comunicar: enquanto o visitante não aceita, o Google recebe
 * pings sem cookies (modelagem), então a contagem de conversões medidas cai em
 * relação ao que era registrado sem consentimento nenhum.
 *
 * A chave e a versão abaixo precisam continuar iguais às de src/lib/consent.ts
 * (CONSENT_STORAGE_KEY e CURRENT_POLICY_VERSION).
 */
const CONSENT_STORAGE_KEY = "byimperiodog_consent_v1";
const CONSENT_POLICY_VERSION = "1.0";

const INLINE_SCRIPT = `
(function(){
  try{
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = window.gtag || gtag;

    gtag('consent','default',{
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied',
      analytics_storage:'denied',
      functionality_storage:'granted',
      personalization_storage:'granted',
      security_storage:'granted',
      wait_for_update:500
    });

    // Sem cookie de publicidade, o Google ainda consegue medir a campanha se o
    // gclid viajar na URL e os identificadores forem redigidos.
    gtag('set','ads_data_redaction',true);
    gtag('set','url_passthrough',true);

    var bruto = localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)});
    if(bruto){
      var salvo = JSON.parse(bruto);
      if(salvo && salvo.version === ${JSON.stringify(CONSENT_POLICY_VERSION)}){
        gtag('consent','update',{
          ad_storage: salvo.marketing ? 'granted' : 'denied',
          ad_user_data: salvo.marketing ? 'granted' : 'denied',
          ad_personalization: salvo.marketing ? 'granted' : 'denied',
          analytics_storage: salvo.analytics ? 'granted' : 'denied',
          functionality_storage: salvo.functional ? 'granted' : 'denied',
          personalization_storage: salvo.functional ? 'granted' : 'denied',
          security_storage:'granted'
        });
      }
    }
  }catch(e){}
})();
`;

export default function ConsentModeDefault() {
  return (
    <script
      id="consent-mode-default"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: INLINE_SCRIPT }}
    />
  );
}
