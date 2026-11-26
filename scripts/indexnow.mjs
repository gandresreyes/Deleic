// scripts/indexnow.mjs
// Avisa por IndexNow a Bing (y a Yandex, Seznam, Naver…) de las páginas que han
// cambiado, para que las vuelvan a leer sin esperar a su rastreo habitual.
// Importa para las IAs: ChatGPT y Copilot buscan sobre el índice de Bing.
//
// Úsalo después de que Vercel publique en producción:
//   npm run indexnow            → páginas con lastmod de los últimos 7 días
//   npm run indexnow -- 30      → de los últimos 30 días
//   npm run indexnow -- todas   → todas las del sitemap
//
// Lee el sitemap publicado, no el local: solo avisa de lo que ya está en línea.
// Solo envía URLs públicas (ningún dato personal), así que no afecta a la
// política de privacidad.

const SITE = "https://www.deleic.es";
// La clave es pública: Bing la comprueba en public/<CLAVE>.txt. Si se cambia,
// hay que renombrar ese archivo y su contenido
const CLAVE = "81d203cb320bcfe85c114ae6300c4322";

const arg = process.argv[2] ?? "7";
const todas = arg === "todas";
const dias = Number(arg);
if (!todas && !(dias > 0)) {
  console.error('Uso: npm run indexnow [-- <días> | -- todas]');
  process.exit(1);
}

const texto = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": "deleic-indexnow" } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
};

// 1. La clave tiene que estar publicada: si no, la web nueva aún no está en el dominio
const publicada = await texto(`${SITE}/${CLAVE}.txt`).catch(() => "");
if (publicada.trim() !== CLAVE) {
  console.error(
    `No se encuentra la clave en ${SITE}/${CLAVE}.txt.\n` +
      "¿Está ya publicada la web nueva en el dominio? Hasta entonces no se puede avisar a IndexNow.",
  );
  process.exit(1);
}

// 2. URLs del sitemap publicado, con su lastmod
const indice = await texto(`${SITE}/sitemap-index.xml`);
const sitemaps = [...indice.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const urls = [];
for (const sitemap of sitemaps) {
  const xml = await texto(sitemap);
  for (const [, bloque] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = bloque.match(/<loc>([^<]+)<\/loc>/)?.[1];
    const lastmod = bloque.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (loc) urls.push({ loc, lastmod: lastmod ? new Date(lastmod) : null });
  }
}

const desde = Date.now() - dias * 24 * 60 * 60 * 1000;
const lista = urls
  .filter((u) => todas || (u.lastmod && u.lastmod.getTime() >= desde))
  .map((u) => u.loc);

if (lista.length === 0) {
  console.log(`Ninguna página ha cambiado en los últimos ${dias} días. No se envía nada.`);
  process.exit(0);
}

// 3. Aviso a IndexNow (la API compartida reparte el aviso entre los buscadores)
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE).host,
    key: CLAVE,
    keyLocation: `${SITE}/${CLAVE}.txt`,
    urlList: lista,
  }),
});

const significado = {
  200: "Recibido.",
  202: "Recibido; la clave se está validando.",
  400: "Petición mal formada.",
  403: "La clave no es válida o no coincide con el archivo publicado.",
  422: "Alguna URL no pertenece al dominio o la clave no coincide.",
  429: "Demasiadas peticiones: espera un rato antes de volver a enviar.",
};
console.log(`${res.status} ${significado[res.status] ?? res.statusText}`);
console.log(lista.map((u) => `  ${u}`).join("\n"));
process.exit(res.ok ? 0 : 1);
