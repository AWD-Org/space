/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingIncludes: { "/**/*": ["./assets/fonts/**/*"] },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
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
