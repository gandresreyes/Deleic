// src/scripts/temporadas/navidad.ts
// Navidad en las zonas [data-adorno] (hoy, el hero de la portada):
// - nieve: copos blancos y suaves que caen meciéndose; unos pocos, con forma
//   de cristal, para que se reconozca como nieve aunque vaya despacio
// - guirnalda: lucecitas doradas colgando del borde superior que parpadean
// - saludo: el chip [data-adorno-saludo] dice "Felices fiestas" con una estrella
// La animación es CSS (navidad.css); aquí solo se reparte todo al azar.
import estilos from "./navidad.css?inline";
import { azar, capa, crear, pausarFueraDePantalla, ponerEstilos, saludar } from "./comun";

const SALUDO = "Felices fiestas · Deleic";

// Estrella de cuatro puntas del saludo
const ESTRELLA =
  '<svg class="navidad-estrella" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1c.7 5.8 4.4 10 11 11-6.6 1-10.3 5.2-11 11-.7-5.8-4.4-10-11-11 6.6-1 10.3-5.2 11-11z"/></svg>';

// ---------- Nieve ----------

function nevar(zona: HTMLElement) {
  const nieve = capa("nieve");
  const alto = zona.clientHeight;
  // Un copo por cada 30px de ancho: 12 en móvil, 40 en escritorio
  const total = Math.min(40, Math.max(12, Math.round(zona.clientWidth / 30)));
  // De ellos, uno de cada ocho es un cristal: 2 en móvil, 5 en escritorio
  const cristales = Math.round(total / 8);

  for (let i = 0; i < total; i++) {
    const cristal = i < cristales;
    // Profundidad: 0 = lejos, 1 = cerca. Los cercanos son más grandes, más
    // visibles y caen más rápido, lo que da sensación de volumen. Los
    // cristales van siempre en la mitad cercana, para que se distinga la forma
    const cerca = cristal ? azar(0.5, 1) : Math.random();
    const caida = alto / (25 + cerca * 35); // segundos en cruzar: de 25 a 60 px/s
    const ritmo = azar(3, 6);

    const copo = crear("span", cristal ? "cristal" : "");
    copo.style.left = `${azar(0, 100)}%`;
    copo.style.setProperty("--tam", `${cristal ? 8 + cerca * 6 : 3 + cerca * 6}px`);
    copo.style.setProperty("--opacidad", `${0.35 + cerca * 0.5}`);
    copo.style.setProperty("--caida", `${caida}s`);
    copo.style.setProperty("--vaiven", `${azar(8, 24)}px`);
    copo.style.setProperty("--ritmo", `${ritmo}s`);
    copo.style.setProperty("--giro", `${azar(8, 16)}s`);
    // Retrasos negativos: al aparecer ya está nevando, no salen todos de arriba
    copo.style.setProperty("--retraso", `${-azar(0, caida)}s`);
    copo.style.setProperty("--retraso-vaiven", `${-azar(0, ritmo)}s`);
    nieve.append(copo);
  }

  zona.append(nieve);
}

// ---------- Guirnalda ----------

// El cable cuelga en arcos entre puntos de anclaje del borde superior. En
// horizontal todo va en %, para que se estire si cambia el ancho de la zona
function colgarGuirnalda(zona: HTMLElement) {
  const ancho = zona.clientWidth;
  const movil = ancho < 640;
  const caida = movil ? 10 : 14; // lo que cuelga cada arco, en px
  const alto = caida + 10;
  // Los extremos empiezan después de las esquinas redondeadas de la zona
  const margen = (Math.max(32, parseFloat(getComputedStyle(zona).borderTopLeftRadius) || 0) / ancho) * 100;
  const arcos = Math.max(2, Math.round(ancho / 170));
  const paso = (100 - 2 * margen) / arcos;

  const guirnalda = capa("guirnalda");
  guirnalda.style.height = `${alto}px`;

  // Cable: un arco cuadrático por tramo (punto de control al doble de la caída)
  let d = "";
  for (let i = 0; i < arcos; i++) {
    const x0 = margen + i * paso;
    d += `M${x0} 0Q${x0 + paso / 2} ${caida * 2} ${x0 + paso} 0`;
  }
  guirnalda.innerHTML = `<svg viewBox="0 0 100 ${alto}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;

  // Bombillas: tres por arco, colgando del cable
  for (let i = 0; i < arcos; i++) {
    for (const t of [0.25, 0.5, 0.75]) {
      const bombilla = crear("span", "");
      bombilla.style.left = `${margen + (i + t) * paso}%`;
      // Altura del cable en t (curva cuadrática con control en 2 × caída)
      bombilla.style.top = `${4 * t * (1 - t) * caida}px`;
      bombilla.style.setProperty("--brillo", `${azar(2.4, 4.8)}s`);
      bombilla.style.setProperty("--retraso", `${-azar(0, 4.8)}s`);
      guirnalda.append(bombilla);
    }
  }

  zona.append(guirnalda);
}

export function decorar(zona: HTMLElement) {
  ponerEstilos("estilos-navidad", estilos);
  saludar(zona, ESTRELLA, SALUDO);
  colgarGuirnalda(zona);
  nevar(zona);
  pausarFueraDePantalla(zona);
}
