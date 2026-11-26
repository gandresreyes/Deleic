// src/lib/fechas.ts
// Días del año escritos sin año ("15 jun", "1 dic"), como en el periodo de
// verano de contacto.ts y en las temporadas de temporadas.ts.

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export interface DiaDelAño {
  mes: number;
  dia: number;
}

/** "15 jun" → { mes: 6, dia: 15 } */
export const fecha = (texto: string): DiaDelAño => {
  const [dia, mes] = texto.trim().split(/\s+/);
  return { mes: MESES.indexOf(mes.toLowerCase().slice(0, 3)) + 1, dia: Number(dia) };
};

/** Mes y día de hoy en León, esté donde esté quien visita la web */
export const hoyEnLeon = (): DiaDelAño => {
  const partes = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return { mes: valor("month"), dia: valor("day") };
};

/** ¿Cae `dia` entre `desde` y `hasta`, ambos incluidos? Admite periodos que
 *  cruzan de año, como "1 dic" → "6 ene" */
export const enPeriodo = (dia: DiaDelAño, desde: string, hasta: string) => {
  const numero = ({ mes, dia }: DiaDelAño) => mes * 100 + dia;
  const hoy = numero(dia);
  const inicio = numero(fecha(desde));
  const fin = numero(fecha(hasta));
  return inicio <= fin ? hoy >= inicio && hoy <= fin : hoy >= inicio || hoy <= fin;
};
