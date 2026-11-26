// src/lib/fechas.ts
// Días del año escritos sin año ("15 jun", "1 dic"), como en el periodo de
// verano de contacto.ts y en las temporadas de temporadas.ts.

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Días que puede tener cada mes (febrero, 29: la fecha no lleva año)
const DIAS_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface DiaDelAño {
  mes: number;
  dia: number;
}

/** "15 jun" → { mes: 6, dia: 15 }. Una fecha mal escrita ("7 fbr", "32 dic")
 *  lanza un error: así se nota en el build, en vez de fallar en silencio */
export const fecha = (texto: string): DiaDelAño => {
  const [diaTexto, mesTexto = ""] = texto.trim().split(/\s+/);
  const mes = MESES.indexOf(mesTexto.toLowerCase().slice(0, 3)) + 1;
  const dia = Number(diaTexto);
  if (!mes || !Number.isInteger(dia) || dia < 1 || dia > DIAS_MES[mes - 1]) {
    throw new Error(`Fecha no válida: "${texto}". Escribe el día y el mes abreviado, como "15 jun".`);
  }
  return { mes, dia };
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

/** ¿Cae `diaBuscado` entre `desde` y `hasta`, ambos incluidos? Admite
 *  periodos que cruzan de año, como "1 dic" → "6 ene" */
export const enPeriodo = (diaBuscado: DiaDelAño, desde: string, hasta: string) => {
  // Cada día, un número que se ordena como el calendario: 24 dic → 1224
  const numero = ({ mes, dia }: DiaDelAño) => mes * 100 + dia;
  const buscado = numero(diaBuscado);
  const inicio = numero(fecha(desde));
  const fin = numero(fecha(hasta));
  // Periodo normal: entre los dos. Si cruza de año (inicio > fin): desde el
  // inicio hasta el 31 dic, o desde el 1 ene hasta el fin
  return inicio <= fin
    ? buscado >= inicio && buscado <= fin
    : buscado >= inicio || buscado <= fin;
};
