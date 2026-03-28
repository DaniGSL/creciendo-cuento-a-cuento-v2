import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfmake and html2canvas/jspdf are browser-only libs (used via dynamic import
  // in DownloadPDFButton). Listing them here prevents Next.js from accidentally
  // trying to bundle them for the server.
  serverExternalPackages: ["@anthropic-ai/sdk", "pdfmake", "html2canvas"],
  turbopack: {},
};

export default nextConfig;
