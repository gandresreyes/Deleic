// src/scripts/reveal.ts
// Marca con .is-visible los elementos .reveal, .reveal-scale y .reveal-stagger
// cuando entran en pantalla. La animación está en global.css y se hace una
// sola vez: tras marcar un elemento se deja de observar.

const SELECTOR = ":is(.reveal, .reveal-scale, .reveal-stagger):not(.is-visible)";

// Con "reducir movimiento" el CSS no oculta ni anima nada: no hace falta observar
const sinAnimacion = matchMedia("(prefers-reduced-motion: reduce)");

// Un solo observer para todo el sitio, reutilizado en cada navegación
const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entradas, obs) => {
          for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;
            entrada.target.classList.add("is-visible");
            obs.unobserve(entrada.target);
          }
        },
        // Se dispara cuando el elemento ya ha subido un 12% de la pantalla
        { rootMargin: "0px 0px -12% 0px" },
      )
    : null;

function iniciarReveal() {
  if (sinAnimacion.matches) return;

  const elementos = document.querySelectorAll(SELECTOR);

  // Navegador sin IntersectionObserver: se muestran ya, para no dejarlos ocultos
  if (!observer) {
    elementos.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // Suelta los elementos de la página anterior (ClientRouter cambia el DOM)
  observer.disconnect();
  elementos.forEach((el) => observer.observe(el));
}

// Se dispara en la carga inicial y en cada navegación con ClientRouter
document.addEventListener("astro:page-load", iniciarReveal);
