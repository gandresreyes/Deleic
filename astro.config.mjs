// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // Necesario para URLs absolutas: canonical, og:url y og:image
  site: "https://www.deleic.es",
  // URLs de la web anterior que ahora viven en otra ruta
  redirects: {
    "/cosmetica/higiene-facial-con-nd-hydrabalance": "/facial-corporal/higiene-facial/",
    "/deleic/tengo-que-hacer-una-limpieza-facial": "/facial-corporal/higiene-facial/",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
