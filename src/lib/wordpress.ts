// src/lib/wordpress.ts
// Lectura de contenido del WordPress del cliente por su API REST pública.
// Se usa en el build (HTML para SEO) y también en el navegador (promociones al día).

// Si WordPress se mueve (p. ej. a un subdominio al publicar esta web),
// basta con definir PUBLIC_WP_URL en .env
const WP_URL = import.meta.env.PUBLIC_WP_URL ?? "https://www.deleic.es";
const WP_API = `${WP_URL}/wp-json/wp/v2`;
const SLUG_PROMOCIONES = "promociones-mes";

export const URL_PROMOCIONES = `${WP_API}/pages?slug=${SLUG_PROMOCIONES}&_fields=title,content,modified,link`;

export interface ImagenWP {
  src: string;
  srcset?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt: string;
}

export interface PaginaPromociones {
  titulo: string;
  actualizado: Date;
  /** Fecha tal cual la da WordPress: sirve para saber si hay cambios */
  modificado: string;
  enlace: string;
  imagenes: ImagenWP[];
  /** Párrafos de texto (condiciones, vigencia...), ya sin HTML */
  textos: string[];
}

export interface PaginaWP {
  title: { rendered: string };
  content: { rendered: string };
  modified: string;
  link: string;
}

// Entidades HTML más comunes en el contenido de WordPress
const decodificar = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&[a-z]+;/gi, (e) => {
      const m: Record<string, string> = {
        "&aacute;": "á", "&eacute;": "é", "&iacute;": "í", "&oacute;": "ó",
        "&uacute;": "ú", "&ntilde;": "ñ", "&Aacute;": "Á", "&Eacute;": "É",
        "&Iacute;": "Í", "&Oacute;": "Ó", "&Uacute;": "Ú", "&Ntilde;": "Ñ",
        "&iexcl;": "¡", "&iquest;": "¿", "&euro;": "€", "&hellip;": "…",
      };
      return m[e] ?? e;
    });

const textoPlano = (html: string) =>
  decodificar(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const atributo = (tag: string, nombre: string) => {
  const m = tag.match(new RegExp(`\\s${nombre}="([^"]*)"`, "i"));
  return m ? decodificar(m[1]) : undefined;
};

function extraerImagenes(html: string): ImagenWP[] {
  return [...html.matchAll(/<img\b[^>]*>/gi)]
    .map(([tag]) => {
      // Elementor/Jetpack a veces usan lazy-load con data-src
      const src = atributo(tag, "src") ?? atributo(tag, "data-src");
      if (!src || src.startsWith("data:")) return null;
      const width = Number(atributo(tag, "width")) || undefined;
      const height = Number(atributo(tag, "height")) || undefined;
      return {
        src,
        srcset: atributo(tag, "srcset") ?? atributo(tag, "data-srcset"),
        sizes: atributo(tag, "sizes"),
        width,
        height,
        alt: atributo(tag, "alt") ?? "",
      } satisfies ImagenWP;
    })
    .filter((img): img is ImagenWP => img !== null);
}

function extraerTextos(html: string, titulo: string): string[] {
  const limpio = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const bloques = [...limpio.matchAll(/<(p|h[1-6]|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(([, , dentro]) => textoPlano(dentro))
    .filter((t) => t && t.toLowerCase() !== titulo.toLowerCase());
  return [...new Set(bloques)];
}

/** Convierte la respuesta de la API (array de páginas) en promociones */
export function parsePromociones(paginas: PaginaWP[]): PaginaPromociones {
  const [pagina] = paginas;
  if (!pagina) throw new Error(`No existe la página "${SLUG_PROMOCIONES}"`);

  const titulo = textoPlano(pagina.title.rendered);
  const html = pagina.content.rendered;
  return {
    titulo,
    // WordPress devuelve la fecha local sin zona horaria
    actualizado: new Date(pagina.modified),
    modificado: pagina.modified,
    enlace: pagina.link,
    imagenes: extraerImagenes(html),
    textos: extraerTextos(html, titulo),
  };
}

/**
 * Promociones del mes publicadas en WordPress.
 * Devuelve null si la API falla: la página debe mostrar un estado alternativo.
 */
export async function getPromociones(): Promise<PaginaPromociones | null> {
  try {
    const res = await fetch(URL_PROMOCIONES, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parsePromociones((await res.json()) as PaginaWP[]);
  } catch (error) {
    console.warn(`[wordpress] No se pudieron cargar las promociones: ${error}`);
    return null;
  }
}
