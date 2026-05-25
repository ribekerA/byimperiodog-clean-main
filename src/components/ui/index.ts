/**
 * UI COMPONENTS - By Império Dog Design System
 * 
 * Componentes base reutilizáveis para construção de interfaces consistentes.
 * Todos os componentes seguem WCAG 2.2 AA e usam design tokens.
 */

// Componentes de entrada
export { Input } from './input';
export type { InputProps } from './input';

export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';

export { Select } from './select';
export type { SelectProps, SelectOption } from './select';

// Botões e ações
export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

// Feedback visual
export { Badge, StatusBadge } from './badge';
export type { BadgeProps, StatusBadgeProps } from './badge';

export { Alert, AlertTitle, AlertDescription } from './alert';
export type { AlertProps } from './alert';

export { Spinner, InlineSpinner } from './spinner';
export type { SpinnerProps, InlineSpinnerProps } from './spinner';

// Containers e layout
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps, CardFooterProps } from './card';

// Estados
export { EmptyState } from './empty-state';
export type { EmptyStateProps } from './empty-state';

// Overlays
export { Dialog } from './dialog';

export { Tooltip } from './tooltip';

// Outros componentes já existentes
export { FormCard } from './FormCard';

// Re-exportar toast se necessário
export * from './toast';
