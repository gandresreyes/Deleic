// src/pages/llms.txt.ts
// Resumen del centro en markdown para asistentes de IA (formato llmstxt.org).
// Se genera en el build desde los mismos datos que pintan las páginas, así
// que precios, horario y contacto nunca se desfasan respecto a la web.
import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { DIRECCION, EMAIL, HORARIO, TELEFONO, WHATSAPP } from "../data/contacto";
import depilacion from "../data/depilacionLaser.json";
import medicina from "../data/medicinaEstetica.json";
import metodo from "../data/metodoDeleic.json";
import micro from "../data/micropigmentacion.json";
import { gruposPublicados, preciosFacial, type Grupo } from "../lib/precios";
import { sinEnlaces } from "../lib/texto";

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

// Datos prácticos de un tratamiento facial-corporal (duración, sesiones,
// frecuencia, resultado y primer paso), como sublista de su enlace. Salen de
// los mismos campos de facialCorporal.json que pintan la ficha
type Facial = CollectionEntry<"facialCorporal">["data"];
const datosPracticos = (t: Facial) => {
  const lineas: string[] = [];
  if (t.duracionSesion) lineas.push(`Duración: ${t.duracionSesion}`);
  if (t.sesionesRecomendadas) lineas.push(`Sesiones: ${t.sesionesRecomendadas}`);
  for (const m of t.modalidades ?? []) {
    const sesiones = m.detalles?.find((d) => d.titulo === "Sesiones")?.texto;
    if (sesiones) lineas.push(`Sesiones de ${m.titulo}: ${sesiones}`);
  }
  if (t.frecuencia) {
    const f = t.frecuencia;
    const partes = [
      f.texto,
      ...(f.items ?? []).map((i) => `${i.titulo}: ${i.texto}`),
      f.nota,
    ].filter(Boolean);
    lineas.push(`Sesiones y frecuencia: ${partes.join(" ")}`);
  }
  if (t.resultado) lineas.push(`Resultado: ${t.resultado}`);
  if (t.novedad) {
    const n = t.novedad;
    const datos = [
      ...(n.datos ?? []).map((d) => `${d.titulo}: ${d.texto}`),
      n.contraindicaciones,
    ].filter(Boolean);
    lineas.push(`Novedad, ${n.nombre}: ${datos.join(". ")}`);
  }
  // El diagnóstico ya es el primer paso: no se lo repite a sí mismo
  if (t.categoria !== "Diagnóstico" && t.primerPaso) {
    lineas.push(`Primer paso: ${t.primerPaso.texto}`);
  }
  return lineas.map((l) => `  - ${sinEnlaces(l)}`);
};

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
    "### Tratamientos faciales y corporales",
    ...faciales.flatMap((t) => {
      const lineas = preciosFacial(t.data);
      if (lineas.length === 0) return [];
      return [
        "",
        `#### ${t.data.nombre}`,
        ...lineas.map((l) => {
          const grupo = l.grupo === t.data.nombre ? "" : `${l.grupo} · `;
          return `- ${grupo}${l.concepto}: ${l.precio}${l.nota ? ` (${l.nota})` : ""}`;
        }),
      ];
    }),
    "",
    "## Tratamientos faciales y corporales",
    "",
    ...faciales.flatMap((t) => [
      `- [${t.data.nombre}](${url(`/facial-corporal/${t.id}/`)}): ${t.data.descripcionCorta}`,
      ...datosPracticos(t.data),
    ]),
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
