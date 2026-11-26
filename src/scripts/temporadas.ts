// src/scripts/temporadas.ts
// Decoración de temporada: mira en src/data/temporadas.ts si hoy toca alguna
// y, solo entonces, descarga su adorno y lo pinta en las zonas [data-adorno]
// de la página. Se decide en el navegador, no en el build, para que se
// encienda y se apague sola el día que toca, sin volver a publicar la web.
//
// Vista previa en cualquier fecha: ?tema=navidad la enciende y ?tema=ninguna
// la apaga. Se recuerda mientras la pestaña siga abierta (sessionStorage, solo
// para quien abre ese enlace); ?tema=auto vuelve a seguir el calendario.
import { TEMPORADAS } from "../data/temporadas";
import { enPeriodo, hoyEnLeon } from "../lib/fechas";

type Adorno = { decorar: (zona: HTMLElement) => void };

// Cada adorno va en un archivo aparte que solo se descarga si toca:
// el resto del año no pesa nada
const ADORNOS: Record<string, () => Promise<Adorno>> = {
  navidad: () => import("./temporadas/navidad"),
  sanvalentin: () => import("./temporadas/sanvalentin"),
};

const PARAMETRO = "tema";

/** Lo pedido con ?tema=, si alguien lo ha usado en esta pestaña */
function vistaPrevia() {
  try {
    const pedida = new URLSearchParams(location.search).get(PARAMETRO);
    if (pedida === "auto") sessionStorage.removeItem(PARAMETRO);
    else if (pedida) sessionStorage.setItem(PARAMETRO, pedida);
    return sessionStorage.getItem(PARAMETRO);
  } catch {
    // Almacenamiento bloqueado: se sigue el calendario
    return null;
  }
}

function temporadaDeHoy() {
  const pedida = vistaPrevia();
  if (pedida) return TEMPORADAS.find((t) => t.id === pedida); // "ninguna" → nada

  const hoy = hoyEnLeon();
  return TEMPORADAS.find(
    (t) => t.estado === "encendida" || (t.estado === "auto" && enPeriodo(hoy, t.desde, t.hasta)),
  );
}

async function adornar() {
  const zonas = [...document.querySelectorAll<HTMLElement>("[data-adorno]:not([data-adornada])")];
  if (!zonas.length) return;

  const temporada = temporadaDeHoy();
  const cargar = temporada && ADORNOS[temporada.id];
  if (!cargar) return;

  zonas.forEach((zona) => (zona.dataset.adornada = temporada.id));
  try {
    const { decorar } = await cargar();
    zonas.forEach(decorar);
  } catch {
    // Sin conexión para bajar el adorno: la página sigue igual
  }
}

// En la primera carga, ClientRouter lanza astro:page-load con el evento
// `load`: el adorno llega cuando ya está todo lo importante
document.addEventListener("astro:page-load", adornar);
