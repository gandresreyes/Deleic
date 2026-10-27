// src/lib/horario.ts
// Interpreta HORARIO de contacto.ts. Lo usan el schema (build) y el indicador
// "Abierto ahora" de Ubication (navegador), para que ambos lean el mismo horario.
import { HORARIO } from "../data/contacto";

export type FilaHorario = (typeof HORARIO.invierno)[number];

// Días de cada fila: número de Date.getDay() (0 = domingo) y nombre en schema.org
export const DIAS: Record<string, { numeros: number[]; schema: string[] }> = {
  "Lunes – Viernes": {
    numeros: [1, 2, 3, 4, 5],
    schema: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  },
  Sábado: { numeros: [6], schema: ["Saturday"] },
  Domingo: { numeros: [0], schema: ["Sunday"] },
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "15 jun" → { mes: 6, dia: 15 }
const fecha = (texto: string) => {
  const [dia, mes] = texto.trim().split(/\s+/);
  return { mes: MESES.indexOf(mes.toLowerCase().slice(0, 3)) + 1, dia: Number(dia) };
};

const [inicio, fin] = HORARIO.periodoVerano.split("–").map(fecha);
export const VERANO = { inicio, fin };

/** "10:00 – 20:00" → ["10:00", "20:00"] */
export const franja = (horas: string) => horas.split("–").map((h) => h.trim());

/** "10:00" → 600 (minutos desde medianoche) */
export const minutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};
