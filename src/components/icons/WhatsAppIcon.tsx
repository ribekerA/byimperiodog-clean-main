import * as React from 'react';

export interface WhatsAppIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

/** Ícone oficial simplificado do WhatsApp (traçado limpo e acessível) */
export function WhatsAppIcon({ size = 20, className, ...rest }: WhatsAppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path
        fill="currentColor"
        d="M12.04 2a9.94 9.94 0 0 0-8.55 15.07L2 22l5.16-1.44A9.94 9.94 0 1 0 12.04 2Zm0 1.8a8.14 8.14 0 0 1 7.04 12.24l-.2.32c-.15.23-.3.45-.5.66a8.13 8.13 0 0 1-11.2.78 8.13 8.13 0 0 1-2.6-8.52 8.13 8.13 0 0 1 7.46-5.48Zm4.43 10.65c-.25-.13-1.47-.72-1.7-.8-.23-.08-.4-.12-.58.13-.17.25-.67.8-.82.96-.15.17-.3.18-.55.05-.25-.13-1.07-.44-2.05-1.4-.76-.73-1.27-1.62-1.42-1.87-.15-.25-.02-.38.11-.5.12-.12.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.58-1.39-.8-1.9-.21-.5-.42-.43-.58-.44l-.5-.01c-.17 0-.45.06-.68.32-.23.25-.9.88-.9 2.15 0 1.26.92 2.48 1.05 2.65.13.17 1.8 2.87 4.42 3.92.62.27 1.11.43 1.49.55.63.2 1.2.17 1.65.1.5-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.3Z"
      />
    </svg>
  );
}

export default WhatsAppIcon;
