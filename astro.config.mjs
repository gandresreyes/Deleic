// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// Páginas con `noindex` (legales y en construcción): fuera del sitemap.
// Al publicar una de ellas, quítala de aquí y del `noindex` de su página.
const SIN_INDEXAR = [
  "/aviso-legal/",
  "/politica-de-privacidad-y-cookies/",
  "/contacto/",
  "/hollywood-peel/",
  "/ultrasonix/",
];

// https://astro.build/config
export default defineConfig({
  // Necesario para URLs absolutas: canonical, og:url, og:image y sitemap
  site: "https://www.deleic.es",
  // URLs de la web anterior que ahora viven en otra ruta
  redirects: {
    "/cosmetica/higiene-facial-con-nd-hydrabalance": "/facial-corporal/higiene-facial/",
    "/deleic/tengo-que-hacer-una-limpieza-facial": "/facial-corporal/higiene-facial/",
  },
  integrations: [
    sitemap({
      filter: (page) => !SIN_INDEXAR.includes(new URL(page).pathname),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
