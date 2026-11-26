// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Páginas con `noindex` (legales y en construcción): fuera del sitemap.
// Al publicar una de ellas, quítala de aquí y del `noindex` de su página.
const SIN_INDEXAR = [
  "/aviso-legal/",
  "/politica-de-privacidad-y-cookies/",
];

// ---------- lastmod del sitemap ----------
// Google y Bing solo tienen en cuenta lastmod si es exacto, así que no vale
// la fecha del build: cada página lleva la del último commit que tocó los
// archivos de los que sale su contenido (no el layout, el navbar ni el footer).
// Una página nueva se añade aquí; sin entrada, sale en el sitemap sin fecha.
const UBICACION = ["src/components/Ubication.astro", "src/data/contacto.ts"];
const FUENTES = [
  // [ruta, o prefijo terminado en "*" para sus subpáginas; archivos o carpetas]
  ["/", ["src/pages/index.astro", "src/components/QueMejorar.astro", "src/data/queMejorar.json", "src/components/ServicesGrid.astro", "src/components/NewFeatures.astro", ...UBICACION]],
  ["/depilacion-laser/", ["src/pages/depilacion-laser.astro", "src/data/depilacionLaser.json", "src/components/Depilacion", ...UBICACION]],
  ["/facial-corporal/", ["src/pages/facial-corporal/index.astro", "src/data/facialCorporal.json"]],
  ["/facial-corporal/*", ["src/pages/facial-corporal/[id].astro", "src/data/facialCorporal.json", "src/components/FacialCorporal"]],
  ["/medicina-estetica/", ["src/pages/medicina-estetica", "src/data/medicinaEstetica.json", ...UBICACION]],
  ["/metodo-deleic/", ["src/pages/metodo-deleic.astro", "src/data/metodoDeleic.json", "src/data/escanerMarcas.json", "src/components/Metodo", ...UBICACION]],
  ["/micropigmentacion/", ["src/pages/micropigmentacion", "src/data/micropigmentacion.json", "src/components/AntesDespues.astro", ...UBICACION]],
  ["/nosotros/", ["src/pages/nosotros.astro", "src/components/ServicesGrid.astro", ...UBICACION]],
  ["/contacto/", ["src/pages/contacto.astro", ...UBICACION]],
  // /promociones/ va sin fecha: su contenido cambia en WordPress, no en el repo
];

const raiz = fileURLToPath(new URL(".", import.meta.url));
// GIT_LITERAL_PATHSPECS: que "[id].astro" se lea tal cual, no como patrón
const git = (/** @type {string[]} */ ...args) =>
  execFileSync("git", args, {
    cwd: raiz,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: { ...process.env, GIT_LITERAL_PATHSPECS: "1" },
  }).trim();

// En un clon superficial (Vercel no descarga todo el historial), el commit
// más antiguo aparenta haber creado todos los archivos: su fecha no es real
const commitsLimite = (() => {
  try {
    const archivo = resolve(raiz, git("rev-parse", "--git-path", "shallow"));
    return new Set(existsSync(archivo) ? readFileSync(archivo, "utf8").split("\n").filter(Boolean) : []);
  } catch {
    return new Set();
  }
})();

/** Fecha ISO del último commit que tocó `rutas`; undefined si no se sabe */
const ultimaModificacion = (/** @type {string[]} */ rutas) => {
  try {
    const [hash, fecha] = git("log", "-1", "--format=%H %cI", "--", ...rutas).split(" ");
    return hash && !commitsLimite.has(hash) ? fecha : undefined;
  } catch {
    return undefined; // sin git (p. ej. un build desde un zip)
  }
};

const fechas = new Map(FUENTES.map(([ruta, rutas]) => [ruta, ultimaModificacion(rutas)]));
const fechaDe = (/** @type {string} */ pathname) => {
  const entrada = FUENTES.find(([ruta]) =>
    ruta.endsWith("*")
      ? pathname.startsWith(ruta.slice(0, -1)) && pathname !== ruta.slice(0, -1)
      : pathname === ruta,
  );
  return entrada && fechas.get(entrada[0]);
};

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
    // Páginas de contacto de la web anterior
    "/donde-esta-deleic-estetica": "/contacto/",
    "/contacto-mensaje": "/contacto/",
  },
  // Fotos de <Foto> (src/assets/img): WebP a calidad 90. Medido frente a una
  // reducción sin pérdida: SSIM ≥ 0,98 y PSNR 43–48 dB (visualmente igual).
  // smartSubsample conserva mejor los rojos y los bordes de color.
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        webp: { quality: 90, smartSubsample: true, effort: 6 },
      },
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !SIN_INDEXAR.includes(new URL(page).pathname),
      serialize(item) {
        const fecha = fechaDe(new URL(item.url).pathname);
        if (fecha) item.lastmod = fecha;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
