import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (Postgres embutido) e pg rodam só no servidor, fora do bundle.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  poweredByHeader: false,
  // As migrações SQL são lidas do disco na primeira requisição: inclui no pacote do servidor (Vercel).
  outputFileTracingIncludes: { "/**": ["./src/server/db/migrations/**/*"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
