// src/scripts/temporadas/comun.ts
// Piezas que comparten los adornos de temporada (navidad.ts, sanvalentin.ts…).
// Cada adorno importa su CSS como texto (?inline) y lo mete con ponerEstilos:
// con un import normal, Astro lo metería en el HTML de todas las páginas
// todo el año.

export const azar = (min: number, max: number) => min + Math.random() * (max - min);

export const crear = (etiqueta: string, clase: string) => {
  const el = document.createElement(etiqueta);
  el.className = clase;
  return el;
};

/** Capa de adorno que cubre la zona: decorativa, fuera del árbol de accesibilidad */
export const capa = (clase: string) => {
  const el = crear("div", clase);
  el.setAttribute("aria-hidden", "true");
  return el;
};

/** Mete el CSS del adorno en <head>. ClientRouter cambia el <head> al
 *  navegar, así que se comprueba en cada página y se vuelve a poner si falta */
export function ponerEstilos(id: string, css: string) {
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.append(style);
}

/** Cambia el chip [data-adorno-saludo] de la zona por el saludo de la
 *  temporada: un icono (SVG con aria-hidden) y el texto */
export function saludar(zona: HTMLElement, icono: string, texto: string) {
  const chip = zona.querySelector<HTMLElement>("[data-adorno-saludo]");
  if (chip) chip.innerHTML = `${icono}${texto}`;
}

// Pone .adorno-pausado en las zonas que salen de pantalla: el CSS de cada
// adorno pausa ahí sus animaciones, para no gastar batería
const observer = new IntersectionObserver((entradas) => {
  for (const e of entradas) e.target.classList.toggle("adorno-pausado", !e.isIntersecting);
});

// ClientRouter cambia de página sin recargar: suelta las zonas de la anterior
document.addEventListener("astro:before-swap", () => observer.disconnect());

export const pausarFueraDePantalla = (zona: HTMLElement) => observer.observe(zona);
