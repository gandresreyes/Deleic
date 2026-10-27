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

// Número inicial de una tarifa: "Desde 1.200€" → 1200
export const numero = (s: string) => {
  const m = s.match(/^(?:Desde\s+)?(\d{1,3}(?:\.\d{3})+|\d+)\s*€/i);
  return m ? Number(m[1].replace(/\./g, "")) : null;
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
