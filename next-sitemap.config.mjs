/** @type {import('next-sitemap').IConfig} */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://byimperiodog.com.br';

const config = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [
    '/admin/*',
    '/api/*',
    '/obrigado',
    '/politica-de-privacidade',
    '/politica-editorial',
    '/termos-de-uso',
    '/contract/*',
    '/search',
  ],
  // Prioridade por tipo de página — sinaliza importância para crawlers
  transform: async (config, path) => {
    let priority = 0.7;
    let changefreq = 'weekly';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path === '/filhotes' || path.startsWith('/filhotes/')) {
      priority = 0.95;
      changefreq = 'daily'; // filhotes mudam frequentemente
    } else if (
      path === '/spitz-alemao' ||
      path === '/lulu-da-pomerania' ||
      path === '/pomeranian' ||
      path === '/spitz-alemao-baby-face' ||
      path === '/spitz-alemao-preto' ||
      path === '/canil-spitz-alemao-interior-sp'
    ) {
      priority = 0.9;
      changefreq = 'weekly';
    } else if (path === '/preco-spitz-anao' || path === '/comprar-spitz-anao') {
      priority = 0.9;
      changefreq = 'weekly';
    } else if (path === '/contato' || path === '/reserve-seu-filhote') {
      priority = 0.85;
      changefreq = 'monthly';
    } else if (path.startsWith('/blog/')) {
      priority = 0.75;
      changefreq = 'monthly';
    } else if (path === '/blog') {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/guias/')) {
      priority = 0.75;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: [],
    };
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/contract', '/obrigado', '/search'],
      },
    ],
    additionalSitemaps: [
      `${SITE_URL}/server-sitemap.xml`,
      `${SITE_URL}/sitemaps/posts.xml`,
      `${SITE_URL}/sitemaps/puppies.xml`,
    ],
  },
};

export default config;
