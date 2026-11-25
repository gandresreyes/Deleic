// src/scripts/escaner.ts
// Mueve el escáner de luces del Método Deleic (global.css, "Escáner de
// luces"). En cada frame de scroll mira dónde están las tarjetas y escribe en
// el visor --luz: de 0 a 7 con decimales. La tarjeta siguiente barre la cara
// mientras su borde superior cruza la zona de lectura: en móvil, la parte de
// la pantalla bajo el visor; desde md (visor al lado), la que hay bajo la
// cabecera. El CSS hace el resto.
// Desde md también lleva las miniaturas (saltan a su luz) y, con ratón, la
// linterna. Solo trabaja mientras la sección está cerca de la pantalla.

const dosColumnas = matchMedia("(min-width: 768px)");
const conRaton = matchMedia("(hover: hover) and (pointer: fine)");
const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)");

// Tramo en el que la tarjeta que llega barre la cara: [empieza, acaba]
// cuando su borde superior pasa por esas fracciones.
// - Móvil: fracciones de la zona de lectura (0 = justo bajo el visor,
//   1 = abajo del todo de la pantalla).
// - Dos columnas: fracciones del paso entre tarjetas, medidas desde el borde
//   de arriba del visor. Así, al fijarse el visor (primera tarjeta a su
//   altura) la segunda aún no ha empezado, sea cual sea la pantalla
const TRAMO_MOVIL = [0.65, 0.2];
const TRAMO_DOS_COLUMNAS = [0.95, 0.25];

// Desmonta el escáner de la página anterior (ClientRouter cambia el DOM)
let desmontar: (() => void) | null = null;

function iniciarEscaner() {
  desmontar?.();
  desmontar = null;

  const seccion = document.querySelector<HTMLElement>("[data-escaner]");
  const fijo = seccion?.querySelector<HTMLElement>("[data-escaner-fijo]");
  const visor = fijo?.querySelector<HTMLElement>("[data-escaner-visor]");
  if (!seccion || !fijo || !visor || !("IntersectionObserver" in window)) return;

  const tarjetas = [...seccion.querySelectorAll<HTMLElement>("[data-escaner-tarjeta]")];
  const capas = [...visor.querySelectorAll<HTMLElement>("[data-escaner-luz]")];
  const minis = [...fijo.querySelectorAll<HTMLAnchorElement>("[data-escaner-ir]")];
  const lista = seccion.querySelector<HTMLElement>("[data-escaner-lista]");
  const etiqueta = visor.querySelector("[data-escaner-etiqueta]");
  const contador = visor.querySelector("[data-escaner-contador]");
  const control = new AbortController();
  const { signal } = control;

  let frame = 0;
  let tramo = -1; // capa de abajo en juego
  let activa = -1; // luz que manda en el rótulo, la tarjeta y la miniatura
  let dibujada = -1; // luz con la capa de análisis dibujada

  // Dónde empieza y acaba el barrido de una tarjeta (px desde arriba de la
  // pantalla). Se mide con el visor ya fijo (el top de su envoltorio sticky)
  // y no con su posición actual, porque antes de fijarse va más abajo y la
  // zona saldría diminuta o negativa
  const lectura = () => {
    const arriba = parseFloat(getComputedStyle(fijo).top);
    if (dosColumnas.matches) {
      const paso = tarjetas[1].getBoundingClientRect().top - tarjetas[0].getBoundingClientRect().top;
      const [inicio, fin] = TRAMO_DOS_COLUMNAS;
      return { zona: innerHeight - arriba, desde: arriba + paso * inicio, hasta: arriba + paso * fin };
    }
    const base = arriba + visor.getBoundingClientRect().bottom - fijo.getBoundingClientRect().top;
    const zona = innerHeight - base;
    const [inicio, fin] = TRAMO_MOVIL;
    return { zona, desde: base + zona * inicio, hasta: base + zona * fin };
  };

  const pintar = () => {
    frame = 0;
    const { zona, desde, hasta } = lectura();
    if (zona <= 0) return;

    // La primera tarjeta es la luz blanca de partida; cada una de las
    // siguientes suma de 0 a 1 según lo que ha recorrido de su tramo
    let luz = 0;
    for (const tarjeta of tarjetas.slice(1)) {
      const arriba = tarjeta.getBoundingClientRect().top;
      luz += Math.min(1, Math.max(0, (desde - arriba) / (desde - hasta)));
    }
    if (sinMovimiento.matches) luz = Math.round(luz);
    visor.style.setProperty("--luz", luz.toFixed(3));

    // Solo se pintan la capa que está y la que llega, y esta solo cuando ya
    // ha empezado a bajar (a 0 asomaría una línea de 1px por redondeo)
    const abajo = Math.min(Math.floor(luz), capas.length - 1);
    const nuevoTramo = abajo * 2 + (luz > abajo ? 1 : 0);
    if (nuevoTramo !== tramo) {
      tramo = nuevoTramo;
      capas.forEach((capa, i) =>
        capa.classList.toggle("en-uso", i === abajo || (i === abajo + 1 && luz > abajo)),
      );
    }

    // El rótulo cambia cuando la línea pasa de la mitad
    const nueva = Math.round(luz);
    if (nueva !== activa) {
      activa = nueva;
      visor.dataset.luz = capas[activa].dataset.luz;
      if (etiqueta) etiqueta.textContent = tarjetas[activa].dataset.etiqueta ?? "";
      if (contador) contador.textContent = String(activa + 1);
      tarjetas.forEach((tarjeta, i) => tarjeta.classList.toggle("activa", i === activa));
      minis.forEach((mini, i) => {
        mini.classList.toggle("activa", i === activa);
        if (i === activa) mini.setAttribute("aria-current", "true");
        else mini.removeAttribute("aria-current");
      });
    }

    // La capa de análisis de la luz activa se dibuja cuando el visor ya se
    // ve (si no, el dibujo ocurriría fuera de pantalla). Al salir se borra,
    // para que vuelva a dibujarse al volver
    const caja = visor.getBoundingClientRect();
    const seVe = caja.bottom > 0 && caja.top < innerHeight * 0.85;
    const nuevaDibujada = seVe ? activa : -1;
    if (nuevaDibujada !== dibujada) {
      dibujada = nuevaDibujada;
      capas.forEach((capa, i) => capa.classList.toggle("activa", i === dibujada));
    }
  };

  const pedir = () => {
    if (!frame) frame = requestAnimationFrame(pintar);
  };

  const escuchar = (si: boolean) => {
    if (si) {
      window.addEventListener("scroll", pedir, { passive: true });
      window.addEventListener("resize", pedir);
    } else {
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    }
  };

  // Se activa con margen, para que las fotos estén cargadas al llegar
  const observer = new IntersectionObserver(
    ([entrada]) => {
      if (entrada.isIntersecting) {
        visor.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
      }
      escuchar(entrada.isIntersecting);
      if (entrada.isIntersecting) pedir();
    },
    { rootMargin: "100% 0px" },
  );
  observer.observe(seccion);
  dosColumnas.addEventListener("change", pedir, { signal });

  // Dos columnas: el visor se suelta cuando la lista acaba, así que debajo de
  // la última tarjeta hace falta aire para que esta llegue a barrer su luz
  // con el visor aún fijo. Depende de la altura del visor (que crece con la
  // pantalla), por eso se mide en vez de fijarlo en el CSS
  const ajustarAire = () => {
    if (!lista) return;
    const ultima = tarjetas[tarjetas.length - 1];
    const paso = tarjetas[1].offsetTop - tarjetas[0].offsetTop;
    const falta = fijo.offsetHeight - ultima.offsetHeight - paso * TRAMO_DOS_COLUMNAS[1] + 48;
    lista.style.setProperty("--aire", `${Math.max(0, Math.round(falta))}px`);
  };
  const medidas = new ResizeObserver(ajustarAire);
  medidas.observe(fijo);
  medidas.observe(tarjetas[tarjetas.length - 1]);

  // Miniaturas: bajan hasta que la tarjeta de esa luz ha barrido entera (sin
  // JavaScript, el enlace salta a la tarjeta)
  minis.forEach((mini, k) =>
    mini.addEventListener(
      "click",
      (evento) => {
        evento.preventDefault();
        const { hasta } = lectura();
        const destino = scrollY + tarjetas[k].getBoundingClientRect().top - hasta + 8;
        scrollTo({ top: destino, behavior: sinMovimiento.matches ? "auto" : "smooth" });
      },
      { signal },
    ),
  );

  // Linterna: sigue al ratón por el visor (posición en --x/--y)
  if (conRaton.matches) {
    let lx = 0;
    let ly = 0;
    let frameLinterna = 0;
    visor.addEventListener(
      "pointermove",
      (evento) => {
        const caja = visor.getBoundingClientRect();
        lx = evento.clientX - caja.left;
        ly = evento.clientY - caja.top;
        frameLinterna ||= requestAnimationFrame(() => {
          frameLinterna = 0;
          visor.style.setProperty("--x", `${lx}px`);
          visor.style.setProperty("--y", `${ly}px`);
        });
      },
      { signal },
    );
    visor.addEventListener("pointerenter", () => visor.classList.add("con-linterna"), { signal });
    visor.addEventListener("pointerleave", () => visor.classList.remove("con-linterna"), { signal });
  }

  desmontar = () => {
    observer.disconnect();
    medidas.disconnect();
    escuchar(false);
    control.abort();
    cancelAnimationFrame(frame);
  };
}

document.addEventListener("astro:page-load", iniciarEscaner);
