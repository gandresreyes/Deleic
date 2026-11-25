// src/lib/precios.ts
// Tarifas de los JSON con grupos de tratamientos (micropigmentación, medicina
// estética). Lo usan las páginas, su schema y /llms.txt, para que el precio
// se lea siempre igual.

export interface Precio {
  concepto: string;
  precio: string;
}
export interface Item {
  nombre: string;
  texto: string;
  resumen?: string;
  duracion?: string;
  nota?: string;
  precios?: Precio[];
  publicar?: boolean;
}
export interface Grupo {
  titulo: string;
  texto: string;
  items: Item[];
}

// Número inicial de una tarifa: "Desde 1.200€" → 1200, "2,50€" → 2.5
export const numero = (s: string) => {
  const m = s.match(/^(?:Desde\s+)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?\s*€/i);
  return m ? Number(`${m[1].replace(/\./g, "")}.${m[2] ?? "0"}`) : null;
};

// Precio con un añadido entre paréntesis, "280€ (2.ª sesión: 250€)": las
// páginas lo pintan en dos líneas (precio y, debajo, el añadido) para que la
// columna del precio no apriete el concepto en móvil
export const partirPrecio = (s: string) => {
  const m = s.match(/^(.*?)\s*\((.+)\)$/);
  return m ? { precio: m[1], extra: m[2] } : { precio: s, extra: undefined };
};

// Precio de entrada ("desde 250€") calculado con el número inicial de cada tarifa
export const desde = (precios?: Precio[]) => {
  if (!precios?.length) return null;
  const nums = precios
    .map((p) => numero(p.precio))
    .filter((n): n is number => n !== null);
  if (!nums.length) return null;
  const varios = precios.length > 1 || /^desde/i.test(precios[0].precio);
  return `${varios ? "desde " : ""}${Math.min(...nums)}€`;
};

// Solo se muestran los tratamientos con publicar !== false
// y los grupos que se queden con al menos uno
export const gruposPublicados = (grupos: Grupo[]) =>
  grupos
    .map((g) => ({
      ...g,
      items: g.items
        .filter((i) => i.publicar !== false)
        .map((i) => ({ ...i, desde: desde(i.precios) })),
    }))
    .filter((g) => g.items.length > 0);

// Todas las tarifas de un tratamiento facial-corporal (modalidades, novedad y
// grupos de tarifas) en una lista plana. La leen el schema de cada página y
// /llms.txt, así que cada precio se escribe una sola vez en facialCorporal.json
export interface LineaPrecio {
  grupo: string;
  concepto: string;
  precio: string;
  nota?: string;
}

type PrecioConNota = Precio & { nota?: string };

interface DatosFacial {
  nombre: string;
  modalidades?: { titulo: string; precio?: string; duracion?: string }[];
  novedad?: { nombre: string; precios?: PrecioConNota[] };
  tarifas?: { titulo: string; items: PrecioConNota[] }[];
}

export const preciosFacial = (t: DatosFacial): LineaPrecio[] => [
  ...(t.modalidades ?? []).flatMap((m) =>
    m.precio
      ? [{ grupo: t.nombre, concepto: m.titulo, precio: m.precio, nota: m.duracion }]
      : [],
  ),
  ...(t.novedad?.precios ?? []).map((p) => ({ grupo: t.novedad!.nombre, ...p })),
  ...(t.tarifas ?? []).flatMap((g) => g.items.map((i) => ({ grupo: g.titulo, ...i }))),
];
