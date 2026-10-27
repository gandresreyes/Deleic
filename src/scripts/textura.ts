// src/scripts/textura.ts
// Mueve la zona encendida de .textura-cursor (global.css) detrás del cursor.
// Escucha el ratón en la sección que contiene la textura y escribe la posición
// en --x/--y. La posición se suaviza en cada frame para que la luz "persiga"
// al cursor en vez de ir pegada a él.

// Solo con ratón y sin "reducir movimiento"; en táctil la rejilla queda quieta
const conRaton = matchMedia(
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
);

// Cuánto se acerca la luz al cursor en cada frame (1 = sin retraso)
const SUAVIZADO = 0.14;

function seguirCursor(textura: HTMLElement) {
  const zona = textura.parentElement;
  if (!zona) return;

  let destinoX = 0;
  let destinoY = 0;
  let x = 0;
  let y = 0;
  let frame = 0;

  const pintar = () => {
    x += (destinoX - x) * SUAVIZADO;
    y += (destinoY - y) * SUAVIZADO;
    textura.style.setProperty("--x", `${x}px`);
    textura.style.setProperty("--y", `${y}px`);

    // Se detiene al llegar: sin ratón encima no gasta frames
    const llego = Math.abs(destinoX - x) < 0.5 && Math.abs(destinoY - y) < 0.5;
    frame = llego ? 0 : requestAnimationFrame(pintar);
  };

  const mover = (e: PointerEvent, saltar = false) => {
    const caja = zona.getBoundingClientRect();
    destinoX = e.clientX - caja.left;
    destinoY = e.clientY - caja.top;
    // Al entrar, la luz aparece donde está el cursor en vez de venir de lejos
    if (saltar) {
      x = destinoX;
      y = destinoY;
    }
    if (!frame) frame = requestAnimationFrame(pintar);
  };

  zona.addEventListener("pointerenter", (e) => {
    mover(e, true);
    textura.classList.add("activa");
  });
  zona.addEventListener("pointermove", (e) => mover(e));
  zona.addEventListener("pointerleave", () => textura.classList.remove("activa"));
}

function iniciarTexturas() {
  if (!conRaton.matches) return;
  // Cada navegación con ClientRouter trae elementos nuevos: los viejos se
  // descartan con sus listeners
  document.querySelectorAll<HTMLElement>(".textura-cursor").forEach(seguirCursor);
}

document.addEventListener("astro:page-load", iniciarTexturas);
