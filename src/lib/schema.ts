// src/lib/schema.ts
// Piezas de schema.org que se repiten en varias páginas. El negocio se
// construye desde contacto.ts: si cambia el horario o el teléfono, cambia
// también lo que leen Google y las IAs.
import { APERTURA, DIRECCION, EMAIL, HORARIO, REDES, TELEFONO, TITULAR, ZONA } from "../data/contacto";
import { DIAS, franja, VERANO, type FilaHorario } from "./horario";
import { urlImagen } from "./imagenes";

function horario() {
  // Se recalcula el año en cada build
  const year = new Date().getFullYear();
  const iso = ({ mes, dia }: { mes: number; dia: number }) =>
    `${year}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const validez = { validFrom: iso(VERANO.inicio), validThrough: iso(VERANO.fin) };

  const franjas = (filas: FilaHorario[], extra = {}, incluirCerrados = false) =>
    filas.flatMap(({ dias, horas }) => {
      if (!horas && !incluirCerrados) return [];
      // Día cerrado durante un periodo: Google lo expresa con 00:00–00:00
      const [opens, closes] = horas ? franja(horas) : ["00:00", "00:00"];
      return [{ "@type": "OpeningHoursSpecification", dayOfWeek: DIAS[dias].schema, opens, closes, ...extra }];
    });

  // En invierno los días sin horario simplemente no se declaran; en verano
  // hay que declarar los cerrados para anular el horario general
  return [...franjas(HORARIO.invierno), ...franjas(HORARIO.verano, validez, true)];
}

export const idNegocio = (site: URL) => new URL("/#negocio", site).href;

/** León y su alfoz (ZONA de contacto.ts), para el negocio y cada servicio */
export const zonaServida = ZONA.map((name) => ({ "@type": "City", name }));

/** La fundadora, con su propio @id para que cualquier página pueda citarla */
const fundadora = (site: URL) => ({
  "@type": "Person",
  "@id": new URL("/nosotros/#fundadora", site).href,
  name: TITULAR.nombre,
  jobTitle: "Fundadora y responsable de Deleic",
  url: new URL("/nosotros/", site).href,
  image: new URL(urlImagen("/img/nosotros/leila-carreira.webp"), site).href,
});

/** El centro completo. Mismo @id en todas las páginas: es una sola entidad */
export const negocio = (site: URL) => ({
  "@type": "HealthAndBeautyBusiness",
  "@id": idNegocio(site),
  name: "Deleic",
  description:
    "Centro de medicina estética, depilación láser y tratamientos faciales y corporales en León.",
  url: new URL("/", site).href,
  image: new URL("/img/og/home.jpg", site).href,
  // PNG en public con URL fija: la de src/assets lleva un hash que cambia
  logo: new URL("/img/logo/deleic.png", site).href,
  telephone: TELEFONO.href.replace("tel:", ""),
  email: EMAIL,
  address: {
    "@type": "PostalAddress",
    streetAddress: DIRECCION.calle,
    postalCode: DIRECCION.cp,
    addressLocality: DIRECCION.ciudad,
    addressRegion: "León",
    addressCountry: "ES",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: DIRECCION.geo.lat,
    longitude: DIRECCION.geo.lng,
  },
  hasMap: DIRECCION.maps,
  sameAs: Object.values(REDES),
  areaServed: zonaServida,
  openingHoursSpecification: horario(),
  foundingDate: String(APERTURA),
  founder: fundadora(site),
});

/** Migas de pan: [nombre, ruta] desde la portada hasta la página actual */
export const migas = (site: URL, pasos: [string, string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [["Inicio", "/"], ...pasos].map(([name, ruta], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: new URL(ruta, site).href,
  })),
});

/** FAQPage desde el mismo array que pinta la FAQ visible */
export const faqPage = (items: { pregunta: string; respuesta: string }[]) => ({
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({
    "@type": "Question",
    name: f.pregunta,
    acceptedAnswer: { "@type": "Answer", text: f.respuesta },
  })),
});
