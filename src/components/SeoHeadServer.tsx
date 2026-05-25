import { buildCanonical } from '@/lib/seo';

/**
 * SeoHeadServer - Componente servidor para renderizar tags SEO essenciais
 * 
 * Aplicado automaticamente no layout.tsx global para garantir que:
 * 1. Canonical tags apontam para o domínio principal
 * 2. hreflang é removido (não há multi-idioma não configurado)
 * 3. Todas as páginas públicas têm SEO completo
 * 
 * Este componente é apenas para reforço; as tags principais já vêm do
 * sistema metadata de Next.js, mas este garante coerência.
 */
export interface SeoHeadServerProps {
  /**
   * Caminho da página (ex: /filhotes, /blog/meu-artigo)
   * Se não fornecido, usa / (homepage)
   */
  pathname?: string;

  /**
   * Se true, não renderiza canonical (para páginas que o adicionam dinamicamente)
   */
  skipCanonical?: boolean;

  /**
   * Domínio custom a usar (padrão: vem de env NEXT_PUBLIC_SITE_URL)
   */
  customOrigin?: string;
}

/**
 * Componente que renderiza apenas meta tags SEO básicas
 * Não renderiza nada no DOM, apenas efetua side-effect de metadata
 */
export function SeoHeadServer({
  pathname = '/',
  skipCanonical = false,
  customOrigin,
}: SeoHeadServerProps) {
  // Construir canonical com domínio primário
  const canonical = skipCanonical ? null : buildCanonical(pathname);

  // ⚠️ Remover hreflang: o site não possui multi-idioma configurado
  // Se no futuro adicionar i18n, retornar aqui com hreflang tags

  return (
    <>
      {/* Canonical tag - essencial para SEO */}
      {canonical && (
        <link rel="canonical" href={canonical} key="canonical" />
      )}

      {/* 
        Nota: hreflang foi propositalmente removido porque:
        1. Não há i18n/multi-idioma configurado no projeto
        2. Páginas em húngaro foram bloqueadas via redirects (netlify.toml)
        3. Incluir hreflang sem implementar i18n prejudica SEO
        
        Se no futuro mudar para i18n (pt-BR, en-US, es-ES, etc):
        1. Implementar i18n middleware
        2. Adicionar hreflang para cada variação de idioma
        3. Incluir x-default para versão sem prefixo de idioma
      */}
    </>
  );
}
