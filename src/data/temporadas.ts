// src/data/temporadas.ts
// Decoración de temporada (ver "Decoración de temporada" en CLAUDE.md).
// - desde / hasta: días en que se ve, ambos incluidos, en hora de España.
//   Pueden cruzar de año ("1 dic" → "6 ene").
// - estado: "auto" sigue las fechas; "encendida" o "apagada" la fuerzan
//   sin mirar el calendario (hace falta volver a publicar).
// El adorno de cada temporada está en src/scripts/temporadas/<id>.ts.

export interface Temporada {
  id: string;
  desde: string;
  hasta: string;
  estado: "auto" | "encendida" | "apagada";
}

export const TEMPORADAS: Temporada[] = [
  { id: "navidad", desde: "1 dic", hasta: "6 ene", estado: "auto" },
  { id: "sanvalentin", desde: "7 feb", hasta: "14 feb", estado: "auto" },
];
