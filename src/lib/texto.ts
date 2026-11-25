// src/lib/texto.ts
// Enlaces dentro de los textos de los JSON con la sintaxis [texto](/ruta).
// conEnlaces() devuelve HTML seguro para set:html (escapa todo lo demás);
// sinEnlaces() deja solo el texto, para metas, schema y /llms.txt.

const ENLACE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

const escapar = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const conEnlaces = (
  texto: string,
  clase = "font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary",
) =>
  escapar(texto).replace(ENLACE, (_, t: string, href: string) => {
    const externo = /^https?:\/\//.test(href);
    return `<a href="${href}" class="${clase}"${externo ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`;
  });

export const sinEnlaces = (texto: string) => texto.replace(ENLACE, "$1");

// Ancla de un grupo a partir de su título: "Arrugas de expresión" →
// "arrugas-de-expresion". La usan las páginas con grupos (medicina estética,
// micropigmentación) y el selector de la home que enlaza a ellos
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
