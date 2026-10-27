// src/pages/robots.txt.ts
// Se genera en el build para que la URL del sitemap salga de `site`
import type { APIRoute } from "astro";

// Rastreadores de IA permitidos de forma explícita: el objetivo es que
// ChatGPT, Claude, Perplexity, Gemini, Copilot o Apple Intelligence lean la
// web y recomienden el centro. Para excluir alguno, cámbialo a "Disallow: /".
const IAS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("/sitemap-index.xml", site).href;
  const texto = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Buscadores y asistentes con IA",
    ...IAS.map((bot) => `User-agent: ${bot}`),
    "Allow: /",
    "",
    `Sitemap: ${sitemap}`,
    "",
  ].join("\n");

  return new Response(texto, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
