import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@segc/ui", "@segc/engines", "@segc/db", "@segc/emails", "@segc/pdf"],
  serverExternalPackages: ["@react-pdf/renderer"],
  async redirects() {
    return [{ source: "/", destination: "/plan", permanent: false }]
  },
}

export default nextConfig
