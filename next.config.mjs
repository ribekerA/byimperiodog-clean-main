/** @type {import('next').NextConfig} */
const nextConfig = {
  // Por padrão continua sendo `.next` — a Netlify e o `npm run dev` não mudam.
  // O override existe para o caso de rodar `next build` com um `next dev` ativo
  // na mesma pasta: os dois disputam `.next/trace`, o build morre com
  // "EPERM: operation not permitted" ou simplesmente trava depois de
  // "Creating an optimized production build". Com NEXT_DIST_DIR=.next-build dá
  // para validar o build sem derrubar o servidor de desenvolvimento.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Há outro package-lock.json acima deste repositório. Mantém o tracing do
  // servidor preso ao projeto certo e evita que o Next infira C:\\Users\\byimp.
  outputFileTracingRoot: process.cwd(),
  // O Next 16 gera AGENTS.md/CLAUDE.md automaticamente no primeiro `next dev`.
  // As regras do repositorio sao mantidas fora desse mecanismo gerado.
  agentRules: false,
  // next-mdx-remote@6 ainda precisa ser transpilado explicitamente pelo
  // Turbopack. O conteúdo continua compilado no servidor e a lista estática
  // continua vindo de src/lib/_generated-posts.ts.
  transpilePackages: ["next-mdx-remote"],
  // ============================================================================
  // PERFORMANCE: Bundle optimization & code splitting
  // ============================================================================
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  typedRoutes: false,

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog"],
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
    ];
  },

};

export default nextConfig;
