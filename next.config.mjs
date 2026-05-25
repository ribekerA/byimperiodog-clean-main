import { join } from "path";

const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // PERFORMANCE: Images optimization (AVIF/WebP autom�tico)
  // ============================================================================
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 160, 256, 320],
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
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
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
  
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["contentlayer/generated"] = join(process.cwd(), ".contentlayer/generated");
    return config;
  },
};

export default nextConfig;

