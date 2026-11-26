// src/scripts/temporadas/navidad.ts
// Nieve en las zonas [data-adorno] (hoy, el hero de la portada): copos blancos
// y suaves que caen despacio meciéndose. La animación es CSS (navidad.css);
// aquí solo se reparten los copos al azar.
//
// El CSS se importa como texto (?inline) y se añade a mano: con un import
// normal, Astro lo metería en el HTML de todas las páginas todo el año
import estilos from "./navidad.css?inline";

const ID_ESTILOS = "estilos-navidad";

// ClientRouter cambia el <head> al navegar: se vuelve a poner si falta
function ponerEstilos() {
  if (document.getElementById(ID_ESTILOS)) return;
  const style = document.createElement("style");
  style.id = ID_ESTILOS;
  style.textContent = estilos;
  document.head.append(style);
}

const azar = (min: number, max: number) => min + Math.random() * (max - min);

// Un copo por cada 30px de ancho: 12 en móvil, 40 en escritorio
const cuantos = (ancho: number) => Math.min(40, Math.max(12, Math.round(ancho / 30)));

// Pausa la nieve que sale de pantalla, para no gastar batería
const observer = new IntersectionObserver((entradas) => {
  for (const e of entradas) e.target.classList.toggle("pausada", !e.isIntersecting);
});

// ClientRouter cambia de página sin recargar: suelta las zonas de la anterior
document.addEventListener("astro:before-swap", () => observer.disconnect());

export function decorar(zona: HTMLElement) {
  ponerEstilos();
  const nieve = document.createElement("div");
  nieve.className = "nieve";
  nieve.setAttribute("aria-hidden", "true");

  const alto = zona.clientHeight;
  for (let i = 0; i < cuantos(zona.clientWidth); i++) {
    // Profundidad: 0 = lejos, 1 = cerca. Los cercanos son más grandes, más
    // visibles y caen más rápido, lo que da sensación de volumen
    const cerca = Math.random();
    const caida = alto / (25 + cerca * 35); // segundos en cruzar: de 25 a 60 px/s
    const ritmo = azar(3, 6);

    const copo = document.createElement("span");
    copo.style.left = `${azar(0, 100)}%`;
    copo.style.setProperty("--tam", `${3 + cerca * 6}px`);
    copo.style.setProperty("--opacidad", `${0.35 + cerca * 0.5}`);
    copo.style.setProperty("--caida", `${caida}s`);
    copo.style.setProperty("--vaiven", `${azar(8, 24)}px`);
    copo.style.setProperty("--ritmo", `${ritmo}s`);
    // Retrasos negativos: al aparecer ya está nevando, no salen todos de arriba
    copo.style.setProperty("--retraso", `${-azar(0, caida)}s`);
    copo.style.setProperty("--retraso-vaiven", `${-azar(0, ritmo)}s`);
    nieve.append(copo);
  }

  zona.append(nieve);
  observer.observe(nieve);
}
