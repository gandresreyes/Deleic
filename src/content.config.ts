// 1. Import utilities from `astro:content`
import { defineCollection } from "astro:content";

// 2. Import loader(s)
import { file } from "astro/loaders";

// 3. Import Zod
import { z } from "astro/zod";

const facialCorporal = defineCollection({
  loader: file("./src/data/facialCorporal.json"),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    nombre: z.string(),
    categoria: z.enum([
      "Diagnóstico",
      "Despigmentante",
      "Antiacné y marcas",
      "Ojeras y bolsas",
      "Laminado y lifting",
      "Higiene",
      "Antiedad",
      "Maquillaje semipermanente",
      "Oxigenante",
      "HidraGlow",
      "Drenante",
      "Reafirmante y reductor",
    ]),

    eyebrow: z.string().default("FACIAL & CORPORAL"),
    tituloHero: z.string(),
    subtituloHero: z.string(),
    descripcionCorta: z.string().max(160),
    resultado: z.string().optional(),
    proceso: z
      .array(z.object({ titulo: z.string(), texto: z.string() }))
      .optional(),
    cuidados: z.array(z.string()).optional(),

    queEs: z.string(),
    // Variantes del tratamiento, cada una con sus datos propios
    modalidades: z
      .array(
        z.object({
          titulo: z.string(),
          texto: z.string(),
          detalles: z
            .array(z.object({ titulo: z.string(), texto: z.string() }))
            .optional(),
        }),
      )
      .optional(),
    beneficios: z.array(z.string()),
    paraQuienEs: z.string().optional(),
    contraindicaciones: z.array(z.string()).optional(),

    duracionSesion: z.string().optional(),
    sesionesRecomendadas: z.string().optional(),
    tecnologiaOMarca: z.string().optional(),

    imagen: z.string(),
    imagenAlt: z.string(),

    destacadoEnNovedades: z.boolean().default(false),
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
