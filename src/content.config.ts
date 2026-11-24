// 1. Import utilities from `astro:content`
import { defineCollection } from "astro:content";

// 2. Import loader(s)
import { file } from "astro/loaders";

// 3. Import Zod
import { z } from "astro/zod";

// Una línea de tarifa: "Sesión suelta" → "45€". El precio se escribe como en
// el resto de JSON ("45€", "Desde 100€", "2,50€") para que lib/precios.ts lo lea
const precio = z.object({
  concepto: z.string(),
  precio: z.string(),
  nota: z.string().optional(),
});

const parTexto = z.object({ titulo: z.string(), texto: z.string() });

const facialCorporal = defineCollection({
  loader: file("./src/data/facialCorporal.json"),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    nombre: z.string(),
    categoria: z.enum([
      "Diagnóstico",
      "Limpieza facial",
      "Antiacné y marcas",
      "Antiedad",
      "Despigmentante",
      "Drenante",
      "Laminado y lifting",
      "Ojeras y bolsas",
      "Iluminador y revitalizante",
      "Reafirmante y reductor",
      "Ultrasonix",
      "Capilar",
    ]),

    eyebrow: z.string().default("FACIAL & CORPORAL"),
    tituloHero: z.string(),
    // Los textos largos de la página admiten enlaces con la sintaxis
    // [texto](/ruta) (ver lib/texto.ts). No los uses en descripcionCorta,
    // seoDescription ni faq: esos se leen también como texto plano
    subtituloHero: z.string(),
    descripcionCorta: z.string().max(160),
    resultado: z.string().optional(),
    proceso: z.array(parTexto).optional(),
    cuidados: z.array(z.string()).optional(),

    queEs: z.string(),
    // Variantes del tratamiento, cada una con sus datos propios
    modalidadesEyebrow: z.string().optional(),
    modalidadesTitulo: z.string().optional(),
    modalidades: z
      .array(
        z.object({
          titulo: z.string(),
          subtitulo: z.string().optional(),
          etiqueta: z.string().optional(),
          texto: z.string(),
          duracion: z.string().optional(),
          precio: z.string().optional(),
          detalles: z.array(parTexto).optional(),
          puntosTitulo: z.string().optional(),
          puntos: z.array(z.string()).optional(),
        }),
      )
      .optional(),
    beneficios: z.array(z.string()),
    paraQuienEs: z.string().optional(),
    contraindicaciones: z.array(z.string()).optional(),

    // Tratamiento nuevo dentro de otro (p. ej. Global Regen en Antiedad)
    novedad: z
      .object({
        nombre: z.string(),
        texto: z.string(),
        activos: z.array(parTexto).optional(),
        paraQuien: z.string().optional(),
        datos: z.array(parTexto).optional(),
        contraindicaciones: z.string().optional(),
        precios: z.array(precio).optional(),
        mensaje: z.string(),
      })
      .optional(),

    // Ritmo del tratamiento (choque, mantenimiento…)
    frecuencia: z
      .object({
        titulo: z.string().optional(),
        texto: z.string().optional(),
        items: z.array(parTexto).optional(),
        nota: z.string().optional(),
      })
      .optional(),

    // Precios agrupados; `destacado` pinta el grupo como un pack
    tarifas: z
      .array(
        z.object({
          titulo: z.string(),
          texto: z.string().optional(),
          destacado: z.boolean().optional(),
          items: z.array(precio),
        }),
      )
      .optional(),

    // Bloque del diagnóstico facial 3D (Método Deleic): como alternativa al
    // diagnóstico gratuito o como primer paso obligatorio del tratamiento
    metodoDeleic: z.enum(["alternativa", "primer-paso"]).optional(),
    // Lo leen la ficha rápida de la página y /llms.txt. `null` lo oculta, para
    // servicios de precio cerrado que se reservan sin diagnóstico (p. ej. laminado)
    primerPaso: z
      .object({ texto: z.string(), href: z.string().optional() })
      .nullable()
      .default({ texto: "Diagnóstico gratuito y sin compromiso" }),
    // Botón principal del hero. Por defecto: reservar el diagnóstico gratuito
    reserva: z.object({ texto: z.string(), mensaje: z.string() }).optional(),
    // Llamada a la acción al final de la página
    cierre: z.object({ titulo: z.string(), texto: z.string().optional() }).optional(),

    duracionSesion: z.string().optional(),
    sesionesRecomendadas: z.string().optional(),
    tecnologiaOMarca: z.string().optional(),

    // Sin foto propia se pinta un fondo de marca con `icono`
    imagen: z.string().optional(),
    imagenAlt: z.string(),
    icono: z.string().optional(),

    // Tarjeta grande del listado de Facial & Corporal (solo una)
    destacadoEnNovedades: z.boolean().default(false),
    // Tratamiento recién incorporado: etiqueta "Novedad" en su tarjeta.
    // Si tiene `novedad` (p. ej. Global Regen), la etiqueta nombra esa novedad
    nuevo: z.boolean().default(false),
    faq: z
      .array(z.object({ pregunta: z.string(), respuesta: z.string() }))
      .optional(),

    seoTitle: z.string(),
    seoDescription: z.string().max(160),
  }),
});

export const collections = {
  facialCorporal,
};

/**
 * Medicina estetica
 */
