// src/pages/llms.txt.ts
// Resumen del centro en markdown para asistentes de IA (formato llmstxt.org).
// Se genera en el build desde los mismos datos que pintan las páginas, así
// que precios, horario y contacto nunca se desfasan respecto a la web.
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { DIRECCION, EMAIL, HORARIO, TELEFONO, WHATSAPP } from "../data/contacto";
import depilacion from "../data/depilacionLaser.json";
import medicina from "../data/medicinaEstetica.json";
import metodo from "../data/metodoDeleic.json";
import micro from "../data/micropigmentacion.json";
import { gruposPublicados, type Grupo } from "../lib/precios";

const horas = (filas: typeof HORARIO.invierno) =>
  filas.map((f) => `${f.dias}: ${f.horas ?? "cerrado"}`).join("; ");

// "34647716971" → "+34 647 716 971"
const whatsappVisible = `+${WHATSAPP.slice(0, 2)} ${WHATSAPP.slice(2, 5)} ${WHATSAPP.slice(5, 8)} ${WHATSAPP.slice(8)}`;

// Cada tratamiento publicado con todas sus tarifas
const tarifas = (grupos: Grupo[]) =>
  gruposPublicados(grupos).flatMap((g) => [
    "",
    `#### ${g.titulo}`,
    ...g.items.map((i) => {
      const precios = (i.precios ?? []).map((p) => `${p.concepto}: ${p.precio}`).join("; ");
      return `- ${i.nombre}${precios ? ` — ${precios}` : ""}`;
    }),
  ]);

export const GET: APIRoute = async ({ site }) => {
  const url = (ruta: string) => new URL(ruta, site).href;
  const faciales = await getCollection("facialCorporal");

  const texto = [
    "# Deleic",
    "",
    "> Centro de medicina estética, depilación láser de diodo, tratamientos faciales y corporales, y microblading y micropigmentación en León (España). Reservas por WhatsApp o teléfono.",
    "",
    "## Datos del centro",
    "",
    `- Dirección: ${DIRECCION.calle}, ${DIRECCION.cp} ${DIRECCION.ciudad}, España`,
    `- Cómo llegar: ${DIRECCION.maps}`,
    `- Teléfono: ${TELEFONO.visible}`,
    `- WhatsApp (reservas): ${whatsappVisible}`,
    `- Email: ${EMAIL}`,
    `- Horario: ${horas(HORARIO.invierno)}`,
    `- Horario de verano (${HORARIO.periodoVerano}): ${horas(HORARIO.verano)}`,
    "",
    "## Servicios",
    "",
    `- [${depilacion.hero.titulo}](${url("/depilacion-laser/")}): ${depilacion.hero.subtitulo}`,
    `- [Tratamientos faciales y corporales](${url("/facial-corporal/")}): Cosmética profesional y protocolos personalizados para cada tipo de piel.`,
    `- [Medicina estética](${url("/medicina-estetica/")}): ${medicina.seo.description}`,
    `- [${micro.hero.titulo}](${url("/micropigmentacion/")}): ${micro.seo.description}`,
    `- [Método Deleic](${url("/metodo-deleic/")}): ${metodo.seo.description.replaceAll("{precio}", `${metodo.precio.valor} €`)}`,
    "",
    "## Precios",
    "",
    `### ${depilacion.hero.titulo} (precio por sesión y zona)`,
    "",
    ...depilacion.precios.grupos.map(
      (g) => `- Zona ${g.talla} (${g.nombre}), ${g.precio} €: ${g.zonas.join(", ")}`,
    ),
    "",
    "### Método Deleic (diagnóstico facial avanzado)",
    "",
    `- ${metodo.precio.valor} €. Si se contrata un plan, se descuenta del precio del plan.`,
    "",
    `### ${micro.hero.titulo}`,
    ...tarifas(micro.tratamientos.grupos as Grupo[]),
    "",
    "### Medicina estética",
    ...tarifas(medicina.tratamientos.grupos as Grupo[]),
    "",
    "## Tratamientos faciales y corporales",
    "",
    ...faciales.map(
      (t) => `- [${t.data.nombre}](${url(`/facial-corporal/${t.id}/`)}): ${t.data.descripcionCorta}`,
    ),
    "",
    "## Optional",
    "",
    `- [Nosotros](${url("/nosotros/")}): Historia del centro y su fundadora.`,
    `- [Promociones del mes](${url("/promociones/")}): Ofertas vigentes.`,
    "",
  ].join("\n");

  return new Response(texto, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
