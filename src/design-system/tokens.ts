/**
 * DESIGN TOKENS - By Império Dog
 * 
 * Tokens centralizados para consistência visual e manutenção facilitada.
 * Usar estes tokens ao invés de valores hardcoded.
 */

// ============================================================================
// CORES
// ============================================================================

export const colors = {
  // Brand
  brand: {
    DEFAULT: 'var(--brand)',
    teal: 'var(--brand-teal)',
    foreground: 'var(--brand-foreground)',
    contrast: 'var(--brand-contrast)',
  },
  
  // Accent
  accent: {
    DEFAULT: 'var(--accent)',
    hover: 'var(--accent-hover)',
    foreground: 'var(--accent-foreground)',
    contrast: 'var(--accent-contrast)',
  },
  
  // WhatsApp
  whatsapp: {
    DEFAULT: 'var(--whatsapp)',
    contrast: 'var(--whatsapp-contrast)',
  },
  
  // Semantic
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
  
  // Neutrals
  bg: 'var(--bg)',
  background: 'var(--background)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',
  border: 'var(--border)',
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
} as const;

// ============================================================================
// TIPOGRAFIA
// ============================================================================

export const typography = {
  // Font sizes (usa clamp do CSS)
  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    md: 'var(--font-size-md)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
  },
  
  // Line heights
  lineHeight: {
    tight: 'var(--line-tight)',      // 1.15 - headings
    snug: 'var(--line-snug)',        // 1.25 - subtítulos
    normal: 'var(--line-normal)',    // 1.45 - corpo
    relaxed: 'var(--line-relaxed)',  // 1.65 - leitura longa
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================================================
// ESPAÇAMENTO
// ============================================================================

/**
 * Escala de espaçamento consistente (baseada em Tailwind)
 * Usar estas classes ao invés de valores arbitrários
 */
export const spacing = {
  '0.5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '2': '0.5rem',      // 8px
  '3': '0.75rem',     // 12px
  '4': '1rem',        // 16px
  '5': '1.25rem',     // 20px
  '6': '1.5rem',      // 24px
  '8': '2rem',        // 32px
  '10': '2.5rem',     // 40px
  '12': '3rem',       // 48px
  '16': '4rem',       // 64px
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  sm: 'var(--radius-sm)',    // 4px - badges, pills
  md: 'var(--radius-md)',    // 8px - inputs, buttons
  lg: 'var(--radius-lg)',    // 14px - cards pequenos
  '2xl': 'var(--radius-2xl)', // 28px - cards grandes, modals
  full: '9999px',             // círculo perfeito
} as const;

// ============================================================================
// SOMBRAS
// ============================================================================

export const shadows = {
  sm: 'var(--shadow-sm)',        // Inputs
  md: 'var(--shadow-md)',        // Cards hover
  lg: 'var(--shadow-lg)',        // Modals
  xlSoft: 'var(--shadow-xl-soft)', // Hero cards
  none: 'none',
} as const;

// ============================================================================
// TRANSIÇÕES
// ============================================================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
  },
  
  easing: {
    standard: 'var(--ease-standard)',  // cubic-bezier(.4,0,.2,1)
    enter: 'var(--ease-enter)',        // cubic-bezier(0,0,.2,1)
    exit: 'var(--ease-exit)',          // cubic-bezier(.4,0,1,1)
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Mobile-first breakpoints
 * Usar com Tailwind: sm:, md:, lg:, xl:, 2xl:
 */
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

/**
 * Escala de z-index para evitar conflitos
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Helper para obter valor de token com fallback
 */
export function getToken<T extends Record<string, any>>(
  tokens: T,
  path: string,
  fallback?: any
): any {
  const keys = path.split('.');
  let value: any = tokens;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return fallback;
  }
  
  return value ?? fallback;
}

/**
 * Helper para criar classes CSS com tokens
 */
export function withTokens(className: string): string {
  return className;
}
