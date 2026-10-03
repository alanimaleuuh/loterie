import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP : 'unsafe-inline' est requis pour les scripts d'hydratation de Next sans nonce.
// Production : passer à une CSP à nonce via proxy.ts (voir docs/PRODUCTION.md).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'" + (isDev ? " ws:" : ""),
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Accès au serveur de dev via l'URL GitHub Codespaces
  allowedDevOrigins: ["*.app.github.dev"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
      // Autorise les Server Actions derrière le proxy de GitHub Codespaces (URL *.app.github.dev)
      allowedOrigins: ["*.app.github.dev", "localhost:3000"],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
        ],
      },
    ];
  },
};

export default nextConfig;
