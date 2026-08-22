
const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

// `next dev` roda com NODE_ENV=development; `next build` e `next start`, com
// production. Usado só para não aplicar em dev um cabeçalho de cache que só
// faz sentido com nome de arquivo versionado.
const isDev = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Por padrão continua sendo `.next` — a Netlify e o `npm run dev` não mudam.
  // O override existe para o caso de rodar `next build` com um `next dev` ativo
  // na mesma pasta: os dois disputam `.next/trace`, o build morre com
  // "EPERM: operation not permitted" ou simplesmente trava depois de
  // "Creating an optimized production build". Com NEXT_DIST_DIR=.next-build dá
  // para validar o build sem derrubar o servidor de desenvolvimento.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // ESLint é executado separadamente (npm run lint) — não bloqueia o build de produção
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: buildTimestamp,
  },
  // ============================================================================
  // PERFORMANCE: Bundle optimization & code splitting
  // ============================================================================
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  experimental: {
    typedRoutes: false,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  
  // ============================================================================
  // PERFORMANCE: Images optimization (AVIF/WebP automático)
  // ============================================================================
  images: {
    formats: ["image/avif", "image/webp"],
    // Cada largura desta lista vira uma transformacao cobrada, e ainda
    // multiplicada pelos dois formatos acima. Eram 7 + 10 = 17 larguras, ou ate
    // 34 variantes por foto. A escada abaixo tem 5 + 4 = 9.
    //
    // Tirar uma largura nao quebra nada: o Next passa a servir a proxima maior.
    // 414 saiu porque fica a 15% de 360; 1536 saiu porque nenhum container do
    // site passa de 1280. 360 fica, que e o celular pequeno -- e de onde vem
    // 90% do trafego.
    deviceSizes: [360, 640, 768, 1024, 1280],
    // Usadas so quando o `sizes` do componente pede menos de 640px (avatares,
    // miniaturas). Dez degraus para esse intervalo era granularidade que
    // ninguem enxerga e transformacao que todo mundo paga.
    imageSizes: [32, 64, 128, 256],
    minimumCacheTTL: 31536000, // 1 ano
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "dummyimage.com" },
    ],
  },
  
  // ============================================================================
  // PERFORMANCE: Headers (Cache-Control para assets estáticos + Segurança)
  // ============================================================================
  async headers() {
    return [
      // Headers para /admin/* - Bloqueio de indexação e segurança
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, private" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Headers para /api/admin/* - Bloqueio de indexação e segurança
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, private" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Headers globais
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Fontes e icones sao imutaveis de fato: quando mudam, mudam de arquivo.
      {
        source: "/:all*(svg|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Fotos ficam de fora do `immutable` porque podem ser substituidas no
      // mesmo caminho. Mesmo valor do netlify.toml, que e quem manda de verdade
      // em public/images -- antes os dois diziam coisas diferentes.
      {
        source: "/:all*(jpg|jpeg|png|webp|avif|gif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            // Em producao os arquivos de /_next/static tem hash no nome: mudou o
            // conteudo, mudou a URL, entao `immutable` e seguro e economiza
            // revalidacao. Em desenvolvimento nao tem — `app/(public)/page.js`
            // mantem o mesmo nome a cada recompilacao. Com `immutable` o
            // navegador guardava aquele bundle por um ano e continuava servindo
            // a versao antiga: bastava acrescentar um client component novo a
            // uma pagina para o React pedir um modulo que nao existia no bundle
            // em cache e a pagina inteira morrer com "Cannot read properties of
            // undefined (reading 'call')" — sem erro nenhum no terminal, porque
            // do lado do servidor estava tudo certo. Custa uma revalidacao por
            // arquivo em dev e devolve o Fast Refresh confiavel.
            value: isDev ? "no-store, must-revalidate" : "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/image:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  
};

export default nextConfig;

