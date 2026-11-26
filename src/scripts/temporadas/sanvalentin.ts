// src/scripts/temporadas/sanvalentin.ts
// San Valentín en las zonas [data-adorno] (hoy, el hero de la portada):
// - corazones: pocos, rellenos o de contorno, en rosa empolvado y blanco, que
//   suben despacio meciéndose y se desvanecen antes de llegar arriba
// - saludo: el chip [data-adorno-saludo] dice "Feliz San Valentín" con un
//   corazón que late
// No lleva más: el burdeos de la marca ya es el color de San Valentín.
// La animación es CSS (sanvalentin.css); aquí solo se reparte todo al azar.
import estilos from "./sanvalentin.css?inline";
import { azar, capa, crear, pausarFueraDePantalla, ponerEstilos, saludar } from "./comun";

const SALUDO = "Feliz San Valentín · Deleic";

const CORAZON =
  '<svg class="sanvalentin-corazon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

function soltarCorazones(zona: HTMLElement) {
  const corazones = capa("corazones");
  const alto = zona.clientHeight;
  // Uno por cada 120px de ancho: 6 en móvil, 10 en escritorio. Pocos a
  // propósito: con más, parece una tienda de regalos
  const total = Math.min(10, Math.max(6, Math.round(zona.clientWidth / 120)));

  for (let i = 0; i < total; i++) {
    // Profundidad: 0 = lejos, 1 = cerca (más grande, más visible y más rápido)
    const cerca = Math.random();
    const subida = alto / (18 + cerca * 18); // segundos en cruzar: de 18 a 36 px/s
    const ritmo = azar(3.5, 6);

    // Uno de cada tres, solo el contorno; algo menos de la mitad, blancos
    const clases = [i % 3 === 0 && "contorno", Math.random() < 0.4 && "blanco"];
    const corazon = crear("span", clases.filter(Boolean).join(" "));
    corazon.style.left = `${azar(2, 98)}%`;
    corazon.style.setProperty("--tam", `${10 + cerca * 8}px`);
    corazon.style.setProperty("--opacidad", `${0.45 + cerca * 0.4}`);
    corazon.style.setProperty("--subida", `${subida}s`);
    corazon.style.setProperty("--vaiven", `${azar(8, 18)}px`);
    corazon.style.setProperty("--ritmo", `${ritmo}s`);
    corazon.style.setProperty("--inclinacion", `${azar(-14, 14)}deg`);
    // Retrasos negativos: al aparecer ya hay corazones a media subida
    corazon.style.setProperty("--retraso", `${-azar(0, subida)}s`);
    corazon.style.setProperty("--retraso-vaiven", `${-azar(0, ritmo)}s`);
    corazones.append(corazon);
  }

  zona.append(corazones);
}

export function decorar(zona: HTMLElement) {
  ponerEstilos("estilos-sanvalentin", estilos);
  saludar(zona, CORAZON, SALUDO);
  soltarCorazones(zona);
  pausarFueraDePantalla(zona);
}
