/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // CSP obligatoria: la parte que no requiere nonces.
  // script-src va en modo solo-reporte: Next inyecta scripts en línea, así que 'unsafe-inline' sigue hasta migrar a nonces.
  // Se revisa la consola en dev/staging; si no aparecen violaciones, se promueve a obligatoria.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // Metadatos (title, description, OG) siempre dentro de <head>, no en streaming dentro de <body>: mejor SEO y previews.
  htmlLimitedBots: /.*/,
  images: {
    formats: ["image/avif", "image/webp"],
    // Calidades que se pueden pedir al optimizador: 60 miniaturas, 75 por defecto, 80 tarjetas y foto ampliada.
    qualities: [60, 75, 80],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingIncludes: { "/**/*": ["./assets/fonts/**/*"] },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Handler de Firebase Auth bajo nuestro propio dominio (necesario para el acceso con Google por redirección).
  async rewrites() {
    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!project) return [];
    return [
      { source: "/__/auth/:path*", destination: `https://${project}.firebaseapp.com/__/auth/:path*` },
      { source: "/__/firebase/:path*", destination: `https://${project}.firebaseapp.com/__/firebase/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/login", destination: "/entrar", permanent: true },
      { source: "/signup", destination: "/registro", permanent: true },
      { source: "/onboarding", destination: "/app/empezar", permanent: true },
      { source: "/app/home", destination: "/app", permanent: true },
      { source: "/app/products", destination: "/app/productos", permanent: true },
      { source: "/app/billing", destination: "/app", permanent: false },
      { source: "/home", destination: "/app", permanent: true },
    ];
  },
};

module.exports = nextConfig;
