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
];

// https://astro.build/config
export default defineConfig({
  // Necesario para URLs absolutas: canonical, og:url, og:image y sitemap
  site: "https://www.deleic.es",
  // URLs antiguas (de la web anterior o renombradas) que ahora viven en otra ruta
  redirects: {
    "/cosmetica/higiene-facial-con-nd-hydrabalance": "/facial-corporal/limpieza-facial/",
    "/deleic/tengo-que-hacer-una-limpieza-facial": "/facial-corporal/limpieza-facial/",
    "/facial-corporal/higiene-facial": "/facial-corporal/limpieza-facial/",
    // HidraGlow pasa a ser una modalidad de la limpieza facial
    "/facial-corporal/hidraglow": "/facial-corporal/limpieza-facial/",
    "/facial-corporal/oxigenante-efecto-flash": "/facial-corporal/iluminador-revitalizante/",
    // Antes eran páginas en construcción; ahora tienen ficha propia
    "/ultrasonix": "/facial-corporal/ultrasonix/",
    "/hollywood-peel": "/facial-corporal/iluminador-revitalizante/",
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
