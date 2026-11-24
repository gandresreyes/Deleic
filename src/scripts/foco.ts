// src/scripts/foco.ts
// En pantallas táctiles no hay hover, así que los efectos de las tarjetas
// (zoom de la foto, flecha en burdeos…) no se ven nunca. Este script marca con
// .en-foco la tarjeta [data-foco] que pasa por el centro de la pantalla al
// hacer scroll, y global.css le aplica el mismo efecto que el ratón en
// escritorio. Con ratón o con "reducir movimiento" no hace nada.

const tactil = matchMedia(
  "(hover: none) and (prefers-reduced-motion: no-preference)",
);

// La franja central de la pantalla (30% de alto) es la zona "en foco"
const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entradas) => {
          for (const entrada of entradas) {
            entrada.target.classList.toggle("en-foco", entrada.isIntersecting);
          }
        },
        { rootMargin: "-35% 0px -35% 0px" },
      )
    : null;

function iniciarFoco() {
  if (!observer || !tactil.matches) return;
  // Suelta las tarjetas de la página anterior (ClientRouter cambia el DOM)
  observer.disconnect();
  document
    .querySelectorAll("[data-foco]")
    .forEach((tarjeta) => observer.observe(tarjeta));
}

document.addEventListener("astro:page-load", iniciarFoco);
