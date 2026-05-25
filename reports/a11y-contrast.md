# A11y Contrast Report

Base URL: http://localhost:3000

- /: 3 falhas de contraste
  - Regra: color-contrast (serious) — Elements must meet minimum color contrast ratio thresholds
    - alvo: div:nth-child(1) > article > .space-y-2.p-5 > .hover\:bg-emerald-700.active\:scale-95.bg-emerald-600
    - alvo: div:nth-child(2) > article > .space-y-2.p-5 > .hover\:bg-emerald-700.active\:scale-95.bg-emerald-600
    - alvo: .hover\:bg-emerald-500\/90
- /sobre: 10 falhas de contraste
  - Regra: color-contrast (serious) — Elements must meet minimum color contrast ratio thresholds
    - alvo: .hover\:brightness-110
    - alvo: .pl-16:nth-child(1) > .absolute.left-0.top-1
    - alvo: .pl-16:nth-child(2) > .absolute.left-0.top-1
    - alvo: .pl-16:nth-child(3) > .absolute.left-0.top-1
    - alvo: .pl-16:nth-child(4) > .absolute.left-0.top-1
- /contato: 1 falhas de contraste
  - Regra: color-contrast (serious) — Elements must meet minimum color contrast ratio thresholds
    - alvo: .text-white\/90
- /filhote/test: 0 falhas de contraste
- /admin: 0 falhas de contraste

## Fixes propostos (tokens neutros)
- Ajustes sugeridos em app/globals.css para tokens: --surface, --surface-2, --border, --text-muted
- Sem alterações sugeridas (tokens já presentes)