// src/lib/imagenes.ts
// Las fotos del sitio viven en src/assets/img y se nombran con la misma ruta
// que tendrían en la web ("/img/depilacion/hero.webp"), que es como aparecen
// en los JSON y en la colección. Así Astro puede optimizarlas (varios tamaños,
// nombres con hash y caché larga) sin cambiar los datos.
// Lo que sigue en public/img (escáner, foto base del escáner, imagen OG por
// defecto) se sirve tal cual.

import type { ImageMetadata } from "astro";

const fotos = import.meta.glob<ImageMetadata>(
  "../assets/img/**/*.{webp,jpg,jpeg,png}",
  { eager: true, import: "default" },
);

const clave = (ruta: string) => `../assets${ruta}`;

/** Foto de src/assets para <Foto> o <Image>. Falla el build si no existe. */
export function imagen(ruta: string): ImageMetadata {
  const foto = fotos[clave(ruta)];
  if (!foto) {
    throw new Error(`No existe la imagen ${ruta} en src/assets${ruta}`);
  }
  return foto;
}

/**
 * `sizes` de una foto con object-cover. Si la foto es más apaisada que su
 * caja, se pinta más ancha que ella (y recortada): cada ancho se multiplica
 * por esa proporción para que el navegador no elija una versión pequeña.
 * Cada tramo: [media o "" para el último, ancho de la caja, ancho/alto de la
 * caja]. Con cajas de alto fijo, usa la proporción del ancho menor del tramo.
 *
 *   sizesCubre("/img/x.webp", [["(min-width: 1024px)", "33vw", 1.5], ["", "100vw", 4 / 3]])
 */
export function sizesCubre(
  ruta: string,
  tramos: [media: string, ancho: string, caja: number][],
): string {
  const foto = imagen(ruta);
  const proporcion = foto.width / foto.height;
  return tramos
    .map(([media, ancho, caja]) => {
      const f = Math.max(1, proporcion / caja);
      const valor = ancho.replace(
        /^(\d+(?:\.\d+)?)(px|vw)$/,
        (_, n: string, u: string) => `${Math.ceil(Number(n) * f)}${u}`,
      );
      return media ? `${media} ${valor}` : valor;
    })
    .join(", ");
}

/**
 * Hero de las páginas de servicio: foto en 5 de 12 columnas y 400px de alto,
 * desde md (facial-corporal, medicina estética, micropigmentación,
 * depilación láser y Método Deleic). En móvil esa foto va oculta, pero el
 * navegador la descarga igual: el último tramo hace que baje la más pequeña.
 */
export const TRAMOS_HERO: [string, string, number][] = [
  ["(min-width: 1536px)", "610px", 1.5],
  ["(min-width: 1280px)", "39vw", 1.24],
  ["(min-width: 1024px)", "38vw", 0.97],
  ["(min-width: 768px)", "38vw", 0.72],
  ["", "38vw", 0.72],
];

/**
 * URL pública de una imagen a tamaño original, para og:image y el schema.
 * Si no está en src/assets (p. ej. /img/og/home.jpg o una URL externa), la
 * devuelve tal cual.
 */
export function urlImagen(ruta: string): string {
  return fotos[clave(ruta)]?.src ?? ruta;
}
