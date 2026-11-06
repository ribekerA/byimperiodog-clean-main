import type { SVGProps } from "react";

// Pata própria: a do lucide sai torta e, em tamanho pequeno, vira um borrão.
export function PataIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="5" cy="11.4" rx="2.1" ry="2.8" transform="rotate(-18 5 11.4)" />
      <ellipse cx="9.4" cy="6.2" rx="2.2" ry="3" transform="rotate(-6 9.4 6.2)" />
      <ellipse cx="14.6" cy="6.2" rx="2.2" ry="3" transform="rotate(6 14.6 6.2)" />
      <ellipse cx="19" cy="11.4" rx="2.1" ry="2.8" transform="rotate(18 19 11.4)" />
      <path d="M12 11.6c-2.7 0-5.6 3.2-5.6 6 0 1.9 1.3 3 3 3 1 0 1.700-.5 2.600-.5s1.600.5 2.600.5c1.700 0 3-1.100 3-3 0-2.800-2.900-6-5.600-6Z" />
    </svg>
  );
}
