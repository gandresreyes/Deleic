// src/lib/horario.ts
// Interpreta HORARIO de contacto.ts. Lo usan el schema (build) y el indicador
// "Abierto ahora" de Ubication (navegador), para que ambos lean el mismo horario.
// Aquí están las reglas de la clínica; el reloj y las fechas, en fechas.ts.
import { HORARIO } from "../data/contacto";
import { ahoraEnLeon, enPeriodo, fecha } from "./fechas";

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

// Unos días mal escritos en contacto.ts ("Lunes-Viernes") dejarían ese día
// siempre "Cerrado" sin avisar: así falla el build con un error claro
for (const { dias } of [...HORARIO.invierno, ...HORARIO.verano]) {
  if (!DIAS[dias]) {
    throw new Error(
      `Días no válidos en HORARIO: "${dias}". Escribe uno de estos: ${Object.keys(DIAS).join(", ")}.`,
    );
  }
}

const [desdeVerano, hastaVerano] = HORARIO.periodoVerano.split("–");
export const VERANO = { inicio: fecha(desdeVerano), fin: fecha(hastaVerano) };

/** "10:00 – 20:00" → ["10:00", "20:00"] */
export const franja = (horas: string) => horas.split("–").map((h) => h.trim());

/** "10:00" → 600 (minutos desde medianoche) */
const minutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

/** ¿Está abierta la clínica ahora mismo? Con la hora de León, esté donde
 *  esté quien visita la web */
export const abiertoAhora = () => {
  const ahora = ahoraEnLeon();

  // 1. Horario de verano o de invierno, según HORARIO.periodoVerano
  const esVerano = enPeriodo(ahora, desdeVerano, hastaVerano);
  const filas = esVerano ? HORARIO.verano : HORARIO.invierno;

  // 2. La fila que incluye hoy; sin horas (como el domingo) = cerrado
  const fila = filas.find((f) => DIAS[f.dias].numeros.includes(ahora.diaSemana));
  if (!fila?.horas) return false;

  // 3. Abierto desde la hora de apertura hasta justo antes de la de cierre
  const [abre, cierra] = franja(fila.horas).map(minutos);
  return ahora.minutos >= abre && ahora.minutos < cierra;
};
