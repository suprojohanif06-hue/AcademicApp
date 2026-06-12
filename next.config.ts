import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["react-pdf", "pdfjs-dist"],
};

export default nextConfig;
