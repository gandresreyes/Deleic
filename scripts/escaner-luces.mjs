// scripts/escaner-luces.mjs
// Genera el escáner de luces del Método Deleic a partir de UNA foto de la
// cara: las 8 imágenes del visor (public/img/metodo-deleic/escaner/*.webp) y
// las marcas de la capa de análisis (src/data/escanerMarcas.json).
//
// Cada luz se calcula desde la propia foto, como hace el software del equipo,
// en vez de teñirla:
//   blanca    la foto tal cual
//   paralela  solo la textura de la superficie (paso alto)
//   cruzada   sin brillos y con el rojo y el pigmento realzados (Lab)
//   azul      azul oscuro con fluorescencia naranja en los poros de la zona T
//   uv        canal azul con contraste local: la melanina sale oscura
//   wood      igual, más profundo y en azul frío
//   eritema   índice de eritema log(R/G), que sigue a la hemoglobina
//   termica   el mismo índice muy suavizado, en escala de calor
// Las marcas (manchas, poros, rojeces, zonas calientes) se detectan en la
// misma foto, así que caen sobre la cara de verdad.
//
// Uso: npm run escaner                    regenera imágenes y marcas
//      npm run escaner -- --ver=<carpeta>  además guarda en esa carpeta las
//                                          hojas de control (zonas y luces)
// Con otra foto: cambia FOTO, ESPEJO, ENCUADRE y PUNTOS de abajo.
// sharp viene instalado con Astro.

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

// ---------- Configuración de la foto ----------

const FOTO = "public/img/metodo-deleic/realist.webp";

// Si la foto trae media cara natural y media procesada (como metodo.png),
// ESPEJO = { x, ancho } usa esa mitad natural y su reflejo. Con una foto
// normal de la cara entera: null
const ESPEJO = null;

// Encuadre en px de la foto base. Puede salirse de la foto: lo que sobra se
// rellena de negro. Debe tener la proporción de SALIDA (4:3). El visor toma
// esa misma proporción, así que cambiarla cambia su altura
const ENCUADRE = { x: 20, y: 200, ancho: 1215, alto: 911 };
const SALIDA = { ancho: 960, alto: 720 };

// Puntos de la cara en px de la foto base: centro de cada ojo, punta de la
// nariz, centro de la boca, mentón y centro de la frente
const PUNTOS = {
  ojoIzq: [478, 590],
  ojoDer: [785, 590],
  nariz: [630, 735],
  boca: [630, 885],
  menton: [630, 1040],
  frente: [630, 330],
};

const DIR_FOTOS = "public/img/metodo-deleic/escaner";
const ARCHIVO_MARCAS = "src/data/escanerMarcas.json";
const CALIDAD = 72;

// ---------- Foto de trabajo ----------

const W = SALIDA.ancho;
const H = SALIDA.alto;
const N = W * H;
const escala = H / ENCUADRE.alto;

async function fotoBase() {
  if (!ESPEJO) return sharp(FOTO).removeAlpha().png().toBuffer();
  const { height } = await sharp(FOTO).metadata();
  const mitad = await sharp(FOTO)
    .removeAlpha()
    .extract({ left: ESPEJO.x, top: 0, width: ESPEJO.ancho, height })
    .toBuffer();
  const reflejo = await sharp(mitad).flop().toBuffer();
  return sharp({
    create: { width: ESPEJO.ancho * 2, height, channels: 3, background: "#000" },
  })
    .composite([
      { input: reflejo, left: 0, top: 0 },
      { input: mitad, left: ESPEJO.ancho, top: 0 },
    ])
    .png()
    .toBuffer();
}

async function encuadrar(base) {
  const { width, height } = await sharp(base).metadata();
  const { x, y, ancho, alto } = ENCUADRE;
  const relleno = {
    left: Math.max(0, -x),
    top: Math.max(0, -y),
    right: Math.max(0, x + ancho - width),
    bottom: Math.max(0, y + alto - height),
  };
  const ampliada = await sharp(base)
    .extend({ ...relleno, background: "#000" })
    .png()
    .toBuffer();
  return sharp(ampliada)
    .extract({ left: x + relleno.left, top: y + relleno.top, width: ancho, height: alto })
    .resize(W, H)
    .removeAlpha()
    .raw()
    .toBuffer();
}

// Punto de la foto base → coordenadas de salida
const aSalida = ([px, py]) => [(px - ENCUADRE.x) * escala, (py - ENCUADRE.y) * escala];
const P = Object.fromEntries(Object.entries(PUNTOS).map(([k, v]) => [k, aSalida(v)]));
const cx = (P.ojoIzq[0] + P.ojoDer[0]) / 2;
const u = P.ojoDer[0] - P.ojoIzq[0]; // distancia entre ojos: la unidad de medida

// ---------- Zonas de la cara (elipses en coordenadas de salida) ----------

const elipse = (x, y, rx, ry) => ({ x, y, rx, ry });
const ojoY = P.ojoIzq[1];
const ZONAS = {
  ojos: [P.ojoIzq, P.ojoDer].map(([x, y]) => elipse(x, y, 0.26 * u, 0.14 * u)),
  cejas: [P.ojoIzq, P.ojoDer].map(([x, y]) => elipse(x, y - 0.27 * u, 0.32 * u, 0.11 * u)),
  boca: [elipse(P.boca[0], P.boca[1], 0.32 * u, 0.13 * u)],
  fosas: [elipse(P.nariz[0], P.nariz[1] + 0.04 * u, 0.2 * u, 0.09 * u)],
  mejillaIzq: elipse(cx - 0.55 * u, ojoY + 0.43 * u, 0.25 * u, 0.24 * u),
  mejillaDer: elipse(cx + 0.55 * u, ojoY + 0.43 * u, 0.25 * u, 0.24 * u),
  nariz: elipse(cx, (ojoY + P.nariz[1]) / 2 + 0.04 * u, 0.1 * u, (P.nariz[1] - ojoY) / 2),
  frente: elipse(cx, P.frente[1] + 0.06 * u, 0.5 * u, 0.16 * u),
  menton: elipse(cx, P.menton[1] - 0.2 * u, 0.22 * u, 0.1 * u),
};
const dentro = (z, x, y) => ((x - z.x) / z.rx) ** 2 + ((y - z.y) / z.ry) ** 2 <= 1;
const excluida = (x, y) =>
  [...ZONAS.ojos, ...ZONAS.cejas, ...ZONAS.boca, ...ZONAS.fosas].some((z) => dentro(z, x, y));

// ---------- Hoja de control: zonas y puntos sobre la foto ----------

async function verZonas(rgb, ruta) {
  const elipses = Object.values(ZONAS)
    .flat()
    .map((z) => `<ellipse cx="${z.x}" cy="${z.y}" rx="${z.rx}" ry="${z.ry}" fill="none" stroke="#0f0" stroke-width="2"/>`)
    .join("");
  const puntos = Object.values(P)
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#f0f"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${elipses}${puntos}</svg>`;
  await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toFile(ruta);
}


// ---------- Utilidades de imagen (canales en Float32Array, 0 a 1) ----------

const limitar = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const mapa = (fuente, f) => {
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = f(fuente[i], i);
  return out;
};

// Desenfoque gaussiano separable, con los bordes repetidos
function desenfocar(fuente, sigma) {
  const r = Math.ceil(sigma * 3);
  const k = new Float32Array(2 * r + 1);
  let suma = 0;
  for (let i = -r; i <= r; i++) suma += k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
  for (let i = 0; i < k.length; i++) k[i] /= suma;
  const tmp = new Float32Array(N);
  const out = new Float32Array(N);
  for (let y = 0; y < H; y++) {
    const fila = y * W;
    for (let x = 0; x < W; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += fuente[fila + limitar(x + i, 0, W - 1)] * k[i + r];
      tmp[fila + x] = acc;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += tmp[limitar(y + i, 0, H - 1) * W + x] * k[i + r];
      out[y * W + x] = acc;
    }
  }
  return out;
}

// Desenfoque que solo promedia dentro de la máscara (no mezcla cara y fondo).
// Los huecos grandes de la máscara se rellenan con una media más amplia
function desenfocarEn(fuente, mascara, sigma) {
  const media = (s) => {
    const num = desenfocar(mapa(fuente, (v, i) => v * mascara[i]), s);
    const den = desenfocar(mascara, s);
    return [num.map((v, i) => (den[i] > 1e-3 ? v / den[i] : 0)), den];
  };
  const [cerca, den] = media(sigma);
  const [lejos] = media(sigma * 3);
  return mapa(cerca, (v, i) => {
    const t = limitar(den[i] / 0.3);
    return v * t + lejos[i] * (1 - t);
  });
}

function percentil(fuente, mascara, p) {
  const vals = [];
  for (let i = 0; i < N; i += 2) if (mascara[i] > 0.5) vals.push(fuente[i]);
  vals.sort((a, b) => a - b);
  return vals[Math.floor(p * (vals.length - 1))];
}

// Reescala al rango [percentil bajo, percentil alto] medido en la máscara
function normalizar(fuente, mascara, bajo, alto) {
  const a = percentil(fuente, mascara, bajo);
  const b = percentil(fuente, mascara, alto);
  return mapa(fuente, (v) => limitar((v - a) / (b - a)));
}

// Contraste local: cuánto se aparta cada punto de su entorno, en desviaciones
function contrasteLocal(fuente, sigma, ganancia = 1) {
  const media = desenfocar(fuente, sigma);
  const varianza = desenfocar(mapa(fuente, (v, i) => (v - media[i]) ** 2), sigma);
  return mapa(fuente, (v, i) => 1 / (1 + Math.exp((-ganancia * (v - media[i])) / (Math.sqrt(varianza[i]) + 0.02))));
}

// v de 0 a 1 → color interpolado entre paradas [r, g, b] (0 a 255)
function paleta(v, paradas) {
  const n = paradas.length - 1;
  const t = limitar(v) * n;
  const k = Math.min(n - 1, Math.floor(t));
  const f = t - k;
  return [0, 1, 2].map((c) => paradas[k][c] + (paradas[k + 1][c] - paradas[k][c]) * f);
}

// sRGB ↔ CIELab (D65)
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const fLab = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const fLabInv = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
function aLab(r, g, b) {
  [r, g, b] = [lin(r), lin(g), lin(b)];
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const [fx, fy, fz] = [fLab(x), fLab(y), fLab(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function deLab(L, a, b) {
  const fy = (L + 16) / 116;
  const x = fLabInv(fy + a / 500) * 0.95047;
  const y = fLabInv(fy);
  const z = fLabInv(fy - b / 200) * 1.08883;
  return [
    3.2406 * x - 1.5372 * y - 0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x - 0.204 * y + 1.057 * z,
  ].map((c) => limitar(gam(limitar(c))));
}

// ---------- Canales y máscaras ----------

const VER = process.argv.find((a) => a.startsWith("--ver="))?.slice(6);
const rgb = await encuadrar(await fotoBase());
if (VER) await verZonas(rgb, `${VER}/zonas.png`);

const R = new Float32Array(N);
const G = new Float32Array(N);
const B = new Float32Array(N);
for (let i = 0; i < N; i++) {
  R[i] = rgb[3 * i] / 255;
  G[i] = rgb[3 * i + 1] / 255;
  B[i] = rgb[3 * i + 2] / 255;
}
const lum = mapa(R, (r, i) => 0.2126 * r + 0.7152 * G[i] + 0.0722 * B[i]);

// Piel: tonos cálidos y con luz (el pelo y la ropa quedan fuera)
const [Rs, Gs, Bs] = [R, G, B].map((c) => desenfocar(c, 1.5));
const piel = mapa(R, (_, i) =>
  Rs[i] > 0.24 && Rs[i] > Gs[i] && Gs[i] > Bs[i] * 0.72 && Rs[i] - Bs[i] > 0.05 && lum[i] > 0.2 ? 1 : 0,
);
// Cara: la piel con los huecos de ojos y cejas cerrados, y un borde suave
const cara = mapa(desenfocar(piel, 7), (v) => (v > 0.35 ? 1 : 0));
const alfa = desenfocar(cara, 4);
// Relieve de la cara, para sombrear los mapas
const relieve = mapa(lum, (v) => 0.35 + 0.65 * limitar(v / 0.72));

// Índice de eritema: log(R/G) sigue a la hemoglobina (rojeces, inflamación)
const eritema = mapa(R, (_, i) => Math.log((Rs[i] + 0.02) / (Gs[i] + 0.02)));
const eritemaN = normalizar(eritema, piel, 0.05, 0.985);

// Bordes marcados (contorno de la nariz, párpados…): ahí no se buscan puntos
const lumSuave = desenfocar(lum, 3);
const borde = new Float32Array(N);
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    borde[i] = Math.hypot(lumSuave[i + 1] - lumSuave[i - 1], lumSuave[i + W] - lumSuave[i - W]);
  }
}
const bordeAlto = percentil(borde, piel, 0.85);

// ---------- Detección de puntos (manchas, poros, granitos, zonas calientes) ----------

// Extremos locales de `fuerza` (positiva) dentro de las zonas, separados al
// menos `distancia` px; devuelve los `cuantos` más fuertes
// (excluir: saltarse ojos, cejas, boca y fosas nasales)
function puntos(fuerza, { zonas, radio = 3, distancia = 20, cuantos = 6, sinBordes = true, excluir = true }) {
  const candidatos = [];
  for (let y = radio; y < H - radio; y++) {
    for (let x = radio; x < W - radio; x++) {
      const i = y * W + x;
      const f = fuerza[i];
      if (f <= 0 || piel[i] < 1 || !zonas.some((z) => dentro(z, x, y))) continue;
      if (excluir ? excluida(x, y) : [...ZONAS.ojos, ...ZONAS.cejas, ...ZONAS.boca].some((z) => dentro(z, x, y))) continue;
      if (sinBordes && borde[i] > bordeAlto) continue;
      let maximo = true;
      for (let dy = -radio; dy <= radio && maximo; dy++)
        for (let dx = -radio; dx <= radio; dx++)
          if (fuerza[i + dy * W + dx] > f) { maximo = false; break; }
      if (maximo) candidatos.push({ x, y, f });
    }
  }
  candidatos.sort((a, b) => b.f - a.f);
  const elegidos = [];
  for (const c of candidatos) {
    if (elegidos.every((e) => Math.hypot(e.x - c.x, e.y - c.y) >= distancia)) elegidos.push(c);
    if (elegidos.length === cuantos) break;
  }
  return elegidos;
}

// Diferencia de gaussianas: positiva en las manchitas oscuras del tamaño dado
const manchitas = (canal, s1, s2) => {
  const a = desenfocar(canal, s1);
  const b = desenfocar(canal, s2);
  return mapa(a, (v, i) => b[i] - v);
};
const pigmento = manchitas(B, 1.5, 5); // la melanina absorbe el azul
const poros = manchitas(lum, 0.9, 2.6);
// Granitos: puntos pequeños más rojos que su entorno
const granitos = (() => {
  const a = desenfocar(eritema, 2);
  const b = desenfocar(eritema, 7);
  return mapa(a, (v, i) => v - b[i]);
})();

// ---------- Las 8 luces ----------

function pintar(f) {
  const out = new Uint8ClampedArray(N * 3);
  for (let i = 0; i < N; i++) {
    const [r, g, b] = f(i);
    out[3 * i] = r;
    out[3 * i + 1] = g;
    out[3 * i + 2] = b;
  }
  return Buffer.from(out.buffer);
}

const luces = {};

luces.blanca = rgb;

// Polarizada paralela: la superficie. Gris con la textura fina (paso alto)
// muy realzada: poros, líneas finas, relieve
{
  const fondo = desenfocar(lum, 4);
  luces.paralela = pintar((i) => {
    const v = (lum[i] * 0.55 + 0.45 + (lum[i] - fondo[i]) * 3) * Math.min(1, lum[i] / 0.1) * 255;
    return [v, v, v * 1.04];
  });
}

// Polarizada cruzada: sin brillos (se comprimen las luces altas) y con el
// rojo (a*) y el pigmento (b*) realzados
luces.cruzada = pintar((i) => {
  const [L, a, b] = aLab(R[i], G[i], B[i]);
  const L2 = (L > 50 ? 50 + (L - 50) * 0.45 : L) * 0.95;
  return deLab(L2, a * 1.9, b * 1.25).map((c) => c * 255);
});

// Luz azul 405 nm: la piel en azul oscuro y fluorescencia naranja de las
// porfirinas en los poros de la zona T
const zonaT = [
  ZONAS.nariz,
  elipse(cx, P.nariz[1], 0.3 * u, 0.13 * u), // aletas de la nariz
  ZONAS.menton,
  ZONAS.frente,
];
const porfirinas = puntos(poros, { zonas: zonaT, radio: 2, distancia: 8, cuantos: 80, excluir: false });
{
  const brillo = new Float32Array(N);
  const fMax = porfirinas[0]?.f ?? 1;
  for (const p of porfirinas) {
    const rel = p.f / fMax;
    const rho = 1.6 + 1.4 * rel;
    const amp = 0.5 + 0.5 * rel;
    const r = Math.ceil(rho * 3);
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const x = p.x + dx;
        const y = p.y + dy;
        if (x >= 0 && x < W && y >= 0 && y < H) brillo[y * W + x] += amp * Math.exp(-(dx * dx + dy * dy) / (2 * rho * rho));
      }
  }
  luces.azul = pintar((i) => {
    const base = paleta(limitar(lum[i] / 0.75) ** 1.1, [[1, 3, 14], [8, 22, 75], [30, 65, 175], [120, 150, 245]]);
    const g = limitar(brillo[i]);
    return base.map((c, k) => c * (1 - g) + [255, 125, 45][k] * g);
  });
}

// UV 365 nm: el canal azul con contraste local. La melanina absorbe la UV,
// así que manchas y pigmento salen oscuros sobre la piel violeta
const azulN = normalizar(B, piel, 0.02, 0.99);
{
  const local = contrasteLocal(B, 12, 1.4);
  luces.uv = pintar((i) => {
    const v = (0.45 * azulN[i] + 0.55 * local[i]) ** 1.25;
    const k = 0.12 + 0.88 * alfa[i];
    return paleta(v, [[3, 1, 12], [45, 18, 105], [135, 95, 225], [215, 200, 255]]).map((c) => c * k);
  });
}

// Luz de Wood: lo mismo con un entorno más amplio (pigmento más profundo),
// más oscuro y en azul frío
{
  const local = contrasteLocal(B, 28, 1.1);
  luces.wood = pintar((i) => {
    const v = (0.6 * azulN[i] + 0.4 * local[i]) ** 1.6;
    const k = 0.1 + 0.9 * alfa[i];
    return paleta(v, [[1, 2, 12], [10, 25, 85], [30, 105, 200], [150, 225, 255]]).map((c) => c * k);
  });
}

// Mapa Erythromin: el índice de eritema en escala de rojos, con el relieve
luces.eritema = pintar((i) => {
  const k = relieve[i] * alfa[i];
  return paleta(eritemaN[i], [[20, 3, 5], [110, 12, 18], [200, 35, 35], [245, 110, 95], [255, 190, 175]]).map((c) => c * k);
});

// Mapa termodinámico: el índice de eritema muy suavizado (inflamación de
// fondo, no puntos sueltos) en escala de calor
// Los labios no cuentan (son rojos sin estar inflamados): se quitan con
// margen y se rellenan con su entorno. Además se recortan los valores
// extremos, para que unos pocos puntos muy rojos no dominen el mapa
const sinBoca = elipse(P.boca[0], P.boca[1], 0.42 * u, 0.2 * u);
const pielSinBoca = mapa(piel, (v, i) => (dentro(sinBoca, i % W, Math.floor(i / W)) ? 0 : v));
const techo = percentil(eritema, pielSinBoca, 0.97);
const calor = normalizar(desenfocarEn(mapa(eritema, (v) => Math.min(v, techo)), pielSinBoca, 11), cara, 0.03, 0.995);
luces.termica = pintar((i) => {
  const k = (0.55 + 0.45 * relieve[i]) * alfa[i];
  return paleta(calor[i], [
    [20, 25, 110], [0, 80, 230], [0, 200, 255], [60, 240, 140], [250, 240, 40], [255, 140, 0], [220, 30, 20],
  ]).map((c) => c * k);
});

// ---------- Capa de análisis: lo que marca el software en cada luz ----------

const d1 = (n) => Math.round(n * 10) / 10;
const trazoElipse = ({ x, y, rx, ry }) =>
  `M${d1(x - rx)},${d1(y)}a${d1(rx)},${d1(ry)} 0 1,0 ${d1(2 * rx)},0a${d1(rx)},${d1(ry)} 0 1,0 ${d1(-2 * rx)},0`;
const circulo = (x, y, r) => elipse(x, y, r, r);

// Rótulo a un lado de la imagen con una guía hasta la forma. Si no cabe en
// el margen, se parte en dos líneas
const TAM_TEXTO = 28;
const ALTO_LINEA = TAM_TEXTO * 1.2;
const anchoTexto = (t) => t.length * TAM_TEXTO * 0.64 + (t.length - 1) * TAM_TEXTO * 0.12;
function rotulo(forma, texto, lado, y = forma.y) {
  const palabras = texto.split(" ");
  const lineas =
    anchoTexto(texto) > 200 && palabras.length > 1
      ? [palabras.slice(0, Math.ceil(palabras.length / 2)).join(" "), palabras.slice(Math.ceil(palabras.length / 2)).join(" ")]
      : [texto];
  const ancho = Math.max(...lineas.map(anchoTexto));
  // Entre el rótulo "Simulación" de arriba y el nombre de la luz de abajo
  const ty = d1(limitar(y, 170, H - 180));
  const tx = lado === "izq" ? 34 : W - 34;
  const fin = lado === "izq" ? tx + ancho + 12 : tx - ancho - 12;
  const ang = Math.atan2(ty - forma.y, fin - forma.x);
  const px = forma.x + Math.cos(ang) * (forma.rx + 5);
  const py = forma.y + Math.sin(ang) * (forma.ry + 5);
  return {
    guia: { d: `M${d1(fin)},${ty}L${d1(px)},${d1(py)}`, clase: "guia" },
    texto: {
      x: tx,
      y: d1(ty - ((lineas.length - 1) * ALTO_LINEA) / 2),
      ancla: lado === "izq" ? "start" : "end",
      lineas,
    },
  };
}

// Zona de la cara (de las candidatas) donde `valor` tiene más media
function zonaMayor(valor, candidatas) {
  const medias = candidatas.map((z) => {
    let s = 0;
    let n = 0;
    for (let y = Math.floor(z.y - z.ry); y <= z.y + z.ry; y++)
      for (let x = Math.floor(z.x - z.rx); x <= z.x + z.rx; x++)
        if (dentro(z, x, y) && piel[y * W + x] && !excluida(x, y)) {
          s += valor[y * W + x];
          n++;
        }
    return { z, media: n ? s / n : 0 };
  });
  return medias.sort((a, b) => b.media - a.media).map((m) => m.z);
}

// Elipse que abarca lo más alto de `valor` dentro de la zona
function elipseDeZona(valor, z, corte = 0.75) {
  const vals = [];
  const pts = [];
  for (let y = Math.floor(z.y - z.ry); y <= z.y + z.ry; y += 2)
    for (let x = Math.floor(z.x - z.rx); x <= z.x + z.rx; x += 2)
      if (dentro(z, x, y) && piel[y * W + x] && !excluida(x, y)) {
        vals.push(valor[y * W + x]);
        pts.push([x, y, valor[y * W + x]]);
      }
  const umbral = [...vals].sort((a, b) => a - b)[Math.floor(corte * (vals.length - 1))];
  const altos = pts.filter((p) => p[2] >= umbral);
  const mx = altos.reduce((s, p) => s + p[0], 0) / altos.length;
  const my = altos.reduce((s, p) => s + p[1], 0) / altos.length;
  const sx = Math.sqrt(altos.reduce((s, p) => s + (p[0] - mx) ** 2, 0) / altos.length);
  const sy = Math.sqrt(altos.reduce((s, p) => s + (p[1] - my) ** 2, 0) / altos.length);
  return elipse(mx, my, Math.max(22, sx * 1.6), Math.max(18, sy * 1.6));
}

const izquierda = (p) => p.x < cx;
const marcas = {};
const agregar = (luz, formas, rotulos) => {
  marcas[luz] = {
    formas: [
      ...formas.map((f) => ({ d: f.d ?? trazoElipse(f), clase: f.clase ?? "marca", ...(f.o ? { o: f.o } : {}) })),
      ...rotulos.map((r) => r.guia),
    ],
    textos: rotulos.map((r) => r.texto),
  };
};

// Luz blanca: manchas en una mejilla y el granito más marcado
{
  const halladas = puntos(pigmento, { zonas: [ZONAS.mejillaIzq], radio: 4, distancia: 26, cuantos: 5 });
  const manchas = halladas.map((p) => circulo(p.x, p.y, 10 + 6 * (p.f / halladas[0].f)));
  const [acne] = puntos(granitos, { zonas: [ZONAS.frente, ZONAS.menton, ZONAS.mejillaDer], radio: 5, distancia: 40, cuantos: 1 });
  const granito = circulo(acne.x, acne.y, 16);
  const cercana = manchas.reduce((a, b) => (a.x < b.x ? a : b));
  agregar("blanca", [...manchas, granito], [
    rotulo(cercana, "Manchas", "izq"),
    rotulo(granito, "Acné", izquierda(granito) ? "izq" : "der"),
  ]);
}

// Polarizada paralela: rejilla de textura en una mejilla y líneas finas bajo un ojo
{
  const fondo = desenfocar(lum, 4);
  const z = ZONAS.mejillaDer;
  const lado = 24;
  const celdas = [];
  const energias = [];
  for (let fy = 0; fy < 3; fy++)
    for (let fx = 0; fx < 4; fx++) {
      const x0 = z.x - 2 * (lado + 4) + fx * (lado + 4);
      const y0 = z.y - 1.5 * (lado + 4) + fy * (lado + 4);
      let e = 0;
      for (let y = y0; y < y0 + lado; y++)
        for (let x = x0; x < x0 + lado; x++) e += Math.abs(lum[Math.round(y) * W + Math.round(x)] - fondo[Math.round(y) * W + Math.round(x)]);
      energias.push(e);
      celdas.push({ x0, y0 });
    }
  const [eMin, eMax] = [Math.min(...energias), Math.max(...energias)];
  const formas = celdas.map(({ x0, y0 }, k) => ({
    d: `M${d1(x0)},${d1(y0)}h${lado}v${lado}h${-lado}z`,
    clase: "celda",
    o: d1(0.12 + 0.55 * ((energias[k] - eMin) / (eMax - eMin || 1))),
  }));
  const rejilla = elipse(z.x, z.y, 2 * (lado + 4), 1.5 * (lado + 4));
  const [ox, oy] = P.ojoIzq;
  const lineas = [0.2, 0.27].map((k) => ({
    d: `M${d1(ox - 0.2 * u)},${d1(oy + k * u * 0.8)}Q${d1(ox)},${d1(oy + k * u * 1.3)} ${d1(ox + 0.18 * u)},${d1(oy + k * u * 0.85)}`,
  }));
  agregar("paralela", [...formas, ...lineas], [
    rotulo(rejilla, "Textura", "der"),
    rotulo(elipse(ox - 0.16 * u, oy + 0.24 * u, 0.06 * u, 0.04 * u), "Líneas finas", "izq"),
  ]);
}

// Polarizada cruzada: donde el tono (a*) es más irregular
{
  const aEstrella = mapa(R, (_, i) => aLab(Rs[i], Gs[i], Bs[i])[1]);
  const media = desenfocar(aEstrella, 6);
  const irregular = mapa(aEstrella, (v, i) => Math.abs(v - media[i]));
  const [z] = zonaMayor(desenfocar(irregular, 4), [ZONAS.mejillaIzq, ZONAS.mejillaDer, ZONAS.frente]);
  const zona = elipseDeZona(desenfocar(irregular, 6), z, 0.7);
  agregar("cruzada", [zona], [rotulo(zona, "Tono irregular", izquierda(zona) ? "izq" : "der")]);
}

// Luz azul: las porfirinas más brillantes y la zona de sebo
{
  const fuertes = porfirinas.filter((p) => dentro(ZONAS.nariz, p.x, p.y) || dentro(zonaT[1], p.x, p.y)).slice(0, 3);
  const aros = fuertes.map((p) => circulo(p.x, p.y, 9));
  const sebo = elipse(ZONAS.frente.x, ZONAS.frente.y + 0.12 * u, ZONAS.frente.rx * 0.6, ZONAS.frente.ry * 0.7);
  const derecha = aros.reduce((a, b) => (a.x > b.x ? a : b));
  agregar("azul", [sebo, ...aros], [rotulo(sebo, "Sebo", "izq", 190), rotulo(derecha, "Porfirinas", "der")]);
}

// UV: las manchas de pigmento más marcadas de una mejilla
{
  const manchas = puntos(pigmento, { zonas: [ZONAS.mejillaDer, ZONAS.nariz], radio: 4, distancia: 28, cuantos: 5 })
    .map((p) => circulo(p.x, p.y, 13));
  const cercana = manchas.reduce((a, b) => (a.x > b.x ? a : b));
  agregar("uv", manchas, [rotulo(cercana, "Manchas", "der")]);
}

// Luz de Wood: la zona con más pigmento de la otra mejilla
{
  const zona = elipseDeZona(desenfocar(pigmento, 5), ZONAS.mejillaIzq, 0.8);
  agregar("wood", [zona], [rotulo(zona, "Melanina", "izq")]);
}

// Erythromin: las dos zonas más rojas
{
  // La mejilla más roja se marca como rojeces; la otra, como sensibilidad
  const [z1, z2] = zonaMayor(eritemaN, [ZONAS.mejillaIzq, ZONAS.mejillaDer]);
  const a = elipseDeZona(desenfocar(eritemaN, 4), z1, 0.75);
  const b = elipseDeZona(desenfocar(eritemaN, 4), z2, 0.75);
  agregar("eritema", [a, b], [
    rotulo(a, "Rojeces", izquierda(a) ? "izq" : "der"),
    rotulo(b, "Sensibilidad", izquierda(b) ? "izq" : "der"),
  ]);
}

// Mapa termodinámico: los dos focos más calientes
{
  const focos = puntos(calor, {
    zonas: [elipse(cx, (P.frente[1] + P.menton[1]) / 2, 1.1 * u, 1.4 * u)],
    radio: 12,
    distancia: 160,
    cuantos: 2,
    sinBordes: false,
  });
  const cruces = focos.map((p) => ({ ...circulo(p.x, p.y, 16), d: trazoElipse(circulo(p.x, p.y, 16)) + `M${p.x - 28},${p.y}h12M${p.x + 16},${p.y}h12M${p.x},${p.y - 28}v12M${p.x},${p.y + 16}v12` }));
  agregar("termica", cruces, [rotulo(cruces[0], "Zona reactiva", izquierda(cruces[0]) ? "izq" : "der")]);
}

// ---------- Salida ----------

await mkdir(DIR_FOTOS, { recursive: true });
for (const [luz, buf] of Object.entries(luces)) {
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .webp({ quality: CALIDAD, smartSubsample: true, effort: 6 })
    .toFile(`${DIR_FOTOS}/${luz}.webp`);
}
await writeFile(
  ARCHIVO_MARCAS,
  JSON.stringify({ ancho: W, alto: H, tamTexto: TAM_TEXTO, altoLinea: ALTO_LINEA, luces: marcas }, null, 1) + "\n",
);
console.log(`Escáner: ${Object.keys(luces).length} luces en ${DIR_FOTOS} y marcas en ${ARCHIVO_MARCAS}`);

// Hoja de control: las 8 luces con su capa de análisis
if (VER) {
  const svg = ({ formas, textos }) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    formas
      .map((f) =>
        f.clase === "celda"
          ? `<path d="${f.d}" fill="white" fill-opacity="${f.o}"/>`
          : `<path d="${f.d}" fill="none" stroke="white" stroke-opacity="${f.clase === "guia" ? 0.7 : 1}" stroke-width="${f.clase === "guia" ? 2 : 3.5}"/>`,
      )
      .join("") +
    textos
      .map((t) => `<text text-anchor="${t.ancla}" dominant-baseline="middle" font-family="Helvetica" font-weight="600" font-size="${TAM_TEXTO}" letter-spacing="3" fill="white" stroke="black" stroke-opacity="0.6" stroke-width="6" paint-order="stroke">${t.lineas.map((l, k) => `<tspan x="${t.x}" y="${t.y + k * ALTO_LINEA}">${l.toUpperCase()}</tspan>`).join("")}</text>`)
      .join("") +
    "</svg>";
  const fichas = await Promise.all(
    Object.entries(luces).map(([luz, buf]) =>
      sharp(buf, { raw: { width: W, height: H, channels: 3 } })
        .composite([{ input: Buffer.from(svg(marcas[luz])) }])
        .png()
        .toBuffer()
        .then((b) => sharp(b).resize(W / 2, H / 2).png().toBuffer()),
    ),
  );
  await sharp({ create: { width: W * 2 + 8, height: H + 8, channels: 3, background: "#fff" } })
    .composite(fichas.map((input, k) => ({ input, left: (k % 4) * (W / 2 + 2), top: Math.floor(k / 4) * (H / 2 + 8) })))
    .png()
    .toFile(`${VER}/luces.png`);
  console.log(`Hoja de control en ${VER}/luces.png`);
}
