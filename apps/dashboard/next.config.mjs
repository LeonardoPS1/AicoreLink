/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Force rebuild: cache bust
  generateBuildId: async () => "build-" + Date.now(),
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Aplicar a todas las rutas de la app
        source: "/:all",
        headers: [
          // CSP - Content Security Policy
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self' https://fonts.googleapis.com; frame-src 'self';"
          },
          // X-Frame-Options - Clickjacking protection
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Strict-Transport-Security - HTTPS enforcement
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // X-Content-Type-Options - MIME type sniffing protection
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;