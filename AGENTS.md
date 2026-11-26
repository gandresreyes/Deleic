## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Guía de diseño y código (seguir siempre al crear o modificar)

Stack: Astro + Tailwind v4 + daisyUI 5 (tema `light`, `data-theme="light"`).
Usa las clases canónicas de Tailwind v4 (`bg-linear-to-r`, `bg-size-[...]`,
`w-md`…), no las de v3. Todo el texto visible va en español.

### Espaciado (definido en `src/styles/global.css`)

- **Margen lateral:** lo pone `<main>` en `src/layouts/Layout.astro`
  (`px-4 sm:px-6 lg:px-8`, el mismo que navbar y footer). Las páginas y las
  secciones **no** añaden su propio `px` de página.
- **Separación entre secciones:** `<main>` es `.pila` (24px móvil / 32px desde
  `sm`). Si una página envuelve todo en un `div` raíz, ese div lleva `pila`.
  **Nunca** pongas `mt-*`/`my-*` en un bloque de primer nivel.
- **Sección en tarjeta:** `class="card bg-base-100 seccion-card"` (o con otro fondo:
  `bg-primary`, `bg-secondary-content`). `.seccion-card` da el padding interior
  estándar; no pongas `py-16 px-6` ni similares a mano.
- **Sección sin fondo** (sobre el gris de la página): `class="seccion"`.
- El contenido interno de una tarjeta va alineado con su título: sin
  `lg:px-8` ni `mx-auto` extra en los wrappers internos.
- Separaciones internas habituales: eyebrow → título `mt-3`, título → texto
  `mt-4`, cabecera → grid `mt-8`/`mt-10`, grids `gap-4 sm:gap-5` (tarjetas) o
  `gap-8` (listas de iconos).
- Las secciones con ancla (`id`) llevan `scroll-mt-24`, porque el navbar es sticky.

### Radios

| Elemento | Clase |
|---|---|
| Sección en tarjeta | `card` o `rounded-4xl` |
| Tarjeta o imagen dentro de una sección | `rounded-3xl` |
| Bloque pequeño dentro de una tarjeta (aviso, lista, fila de FAQ, opción de menú) | `rounded-2xl` |
| Cuadro de icono | `rounded-xl` |
| Botones, chips, etiquetas | `rounded-full` |

### Tipografía y color

- Eyebrow: `text-sm font-semibold tracking-widest uppercase text-primary`.
- Título de sección (`h2`): `mt-3 text-3xl sm:text-4xl font-semibold text-secondary-content`
  (más `tracking-tight text-balance` si es largo). Un solo `h1` por página, en el hero.
- Texto: `text-base-content/70` (o `text-secondary-content/70`); los párrafos de
  entrada, `text-lg`.
- Colores: solo los del tema, definidos en `src/styles/global.css`:
  - `primary` #620303 (marca), `secondary-content` #1D1D1F (texto y fondos oscuros),
    `base-100/200/300` (blanco, gris de página, bordes), `success` (indicadores de estado).
  - `primary-claro` (brillos) y `primary-oscuro` (fondo de los degradados burdeos),
    p. ej. `bg-linear-to-br from-primary-oscuro to-primary`. Dentro de un valor
    arbitrario: `var(--color-primary-claro)`.
  - `black`/`white` con opacidad solo para capas sobre imágenes o fondos oscuros
    (`bg-black/40`, `border-white/10`, `bg-white/6`).
  - Prohibido: hex sueltos (`text-[#620303]`, `stroke="#…"`) y paletas de Tailwind
    (`gray-*`, `neutral-*`, `red-*`, `emerald-*`…). Un tono nuevo se añade al `@theme`.
- `<main>` tiene `text-white`, así que cada sección debe fijar su color de texto.

### Botones

- Principal: `px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-primary text-primary-content font-bold`.
- Secundario: `px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-base-100 text-secondary-content border border-base-300 font-bold`.
- Sobre fondo oscuro: principal `bg-white text-primary`, secundario `ring-1 ring-white/30`.
- Enlaces de WhatsApp con `whatsapp("mensaje")` y teléfono con `TELEFONO`, ambos de
  `src/data/contacto.ts`; `target="_blank" rel="noopener"` en enlaces externos.
  Nunca escribas a mano teléfonos, direcciones ni horarios: salen de `contacto.ts`.

### Iconos y animaciones

- Iconos SVG en línea, de trazo 24×24, `stroke="currentColor"`, `stroke-width="1.5"`,
  `aria-hidden="true"` si son decorativos. En las páginas se guardan en un objeto
  `icons` y se pintan con `set:html`.
- Aparición al hacer scroll: `.reveal` (textos), `.reveal-scale` (imágenes y bloques
  grandes), `.reveal-stagger` (los hijos aparecen en cascada). No las pongas en un
  elemento con `transform`, `opacity` o `filter` propios: envuélvelo.

### Decoración de temporada (Navidad, San Valentín…)

- Fechas y estado de cada temporada en `src/data/temporadas.ts`: se enciende sola
  entre `desde` y `hasta` (hora de España; puede cruzar de año) o se fuerza con
  `estado: "encendida" | "apagada"`. Lo decide el navegador
  (`src/scripts/temporadas.ts`), así que no hace falta publicar el día que empieza.
- El adorno se pinta solo en las zonas con `data-adorno`: hoy, el hero de la portada
  (una zona oscura, `relative overflow-hidden`). No lo extiendas a todas las páginas.
  Dentro de la zona, el chip con `data-adorno-saludo` cambia su texto por el saludo
  de la temporada (un icono y una frase corta que quepa en una línea a 375px).
- Temporadas actuales:
  - Navidad (1 dic – 6 ene): nieve con unos pocos cristales, guirnalda de luces en
    el borde superior y «Felices fiestas · Deleic» con una estrella. Color `--color-oro`.
  - San Valentín (7 – 14 feb): pocos corazones que suben y se desvanecen y «Feliz
    San Valentín · Deleic» con un corazón que late. Color `--color-rosa`.
  Los dos colores están en `global.css` y son solo para adornos de temporada, nunca
  como color de marca.
- Cada adorno es `src/scripts/temporadas/<id>.ts` + `<id>.css`, y se registra en
  `ADORNOS` de `src/scripts/temporadas.ts`. El CSS se importa con `?inline` y se mete
  con `ponerEstilos` (`comun.ts`): así solo se descarga en temporada. Con un import
  normal, Astro mete el CSS en el HTML de todas las páginas todo el año.
  `comun.ts` también da el saludo, las capas y la pausa fuera de pantalla
  (`.adorno-pausado` en la zona).
- Normas: discreto y con los colores del tema; capas con `z-index: 1` (si no, la foto
  del hero, con `order`, las tapa) y `pointer-events: none`; solo anima
  `transform`/`opacity`/`scale`/`rotate`; con "reducir movimiento" no se mueve (o no
  se ve); no cambia el h1 ni el title (SEO).
- Vista previa en cualquier fecha: `?tema=<id>` (`?tema=navidad`, `?tema=sanvalentin`;
  `?tema=ninguna` la apaga y `?tema=auto` vuelve a seguir las fechas). Se mantiene
  al navegar por la pestaña.

### Imágenes

- Las fotos van en `src/assets/img/<sección>/` y se pintan con `<Foto>`
  (`src/components/Foto.astro`), nunca con `<img>` a mano: genera varios anchos
  en WebP a calidad 90 (medida para que no se note), sin ampliar nunca el original,
  y con caché larga.
- `sizes` es obligatorio y es el ancho al que se **pinta** la foto. Con
  `object-cover` en una caja más alta que la foto, se pinta más ancha que la caja:
  usa `sizesCubre` de `src/lib/imagenes.ts` (los heroes de servicio, `TRAMOS_HERO`).
- En los JSON y la colección la ruta se escribe `"/img/…"`, como en la web. Para
  `og:image` o el schema, `urlImagen(ruta)` da la URL del original.
- Logos y gráficos con transparencia: `<Image>` en PNG (sin pérdida) con
  `densities={[1, 2, 3]}`, como el logo de `Navbar.astro`.
- En `public/img` solo lo que se sirve tal cual: las luces del escáner (las genera
  `npm run escaner`), su foto base, `og/home.jpg` y `logo/deleic.png` (el logo del
  schema, con URL fija; es el mismo que `src/assets/img/deleicLogo.webp` en PNG:
  si cambia uno, cambia el otro).

### Contenido y redacción

- Cada idea aparece **una sola vez** por página. Antes de añadir un texto, comprueba
  que no repite lo que ya dicen el hero u otras secciones.
- No inventes datos (precios, duraciones, resultados, garantías). Si falta algo,
  pregunta.
- Los datos de cada servicio están en `src/data/*.json`; los tratamientos faciales, en la
  colección `facialCorporal` (`src/content.config.ts`). El precio se define en un solo
  sitio y de ahí lo leen el hero, la oferta, la FAQ y el schema.

### SEO e indexación por IAs

- Cada página pasa `title` y `description` (≤160 caracteres) a `Layout`, y
  `image`/`imageAlt` si tiene una imagen propia para compartir.
- HTML semántico: `section` con `h2`, `aria-labelledby` cuando el título tenga id,
  listas reales (`ul`/`ol`) para pasos y características, y `details/summary` para la FAQ.
- Schema.org en JSON-LD al final de la página (`<script type="application/ld+json">`):
  `Service`/`HealthAndBeautyBusiness` con la oferta y `FAQPage` generado desde el
  mismo array que pinta la FAQ, para que el texto visible y el schema coincidan.
- Todo el contenido importante debe estar en el HTML del build, no solo en JS.
- El negocio, las migas y la FAQ del schema salen de `src/lib/schema.ts`
  (`negocio(site)`, `migas`, `faqPage`), que lee `contacto.ts`. No copies a mano
  dirección, teléfono ni horario en el JSON-LD.
- `robots.txt`, `llms.txt` (resumen para IAs) y el sitemap se generan en el build.
  Un servicio nuevo se añade también a `src/pages/llms.txt.ts`, y una página con
  `noindex` a `SIN_INDEXAR` en `astro.config.mjs`.
- El `lastmod` del sitemap es la fecha del último commit que tocó el contenido de
  cada página. Una página nueva se añade a `FUENTES` en `astro.config.mjs` con sus
  archivos de contenido (página, JSON y componentes propios); sin entrada sale sin
  fecha. Nunca uses la fecha del build: Google y Bing dejan de fiarse del sitemap.
- Redes sociales, coordenadas, año de apertura y municipios del `areaServed` están en
  `src/data/contacto.ts` (`REDES`, `DIRECCION.geo`, `APERTURA`, `ZONA`). En el
  schema de cada servicio, `areaServed: zonaServida` (de `src/lib/schema.ts`).
- Tras publicar cambios en producción, `npm run indexnow` avisa a Bing de las páginas
  modificadas (ChatGPT y Copilot buscan sobre su índice). Su clave es pública y vive
  en `public/<clave>.txt`.

### Legal, privacidad y cookies (RGPD, LOPDGDD, LSSI)

- Los textos legales están en `src/pages/aviso-legal.astro` y
  `src/pages/politica-de-privacidad-y-cookies.astro` (misma URL que la web
  anterior). Los datos del titular salen de `TITULAR` y `EMAIL` en
  `src/data/contacto.ts`: nunca los escribas a mano ni los inventes.
- Hoy el sitio **no instala cookies sin consentimiento**, y por eso no tiene
  banner. Mantenlo así:
  - Nada de recursos de terceros que se carguen solos: ni Google Fonts (las
    fuentes van en `public/fonts/`), ni iframes, ni píxeles, ni analítica.
  - Los embeds de terceros (mapas, vídeos…) se cargan solo cuando la persona
    pulsa, como el mapa de `Ubication.astro` (`<template>` + botón).
- Si añades un servicio externo, un formulario o cualquier tratamiento nuevo de
  datos, **actualiza la política de privacidad** (qué datos, finalidad, base
  jurídica, destinatarios) y su fecha de actualización. Si ese servicio
  instala cookies no exentas, hace falta un banner de consentimiento previo.
- Las páginas legales y las páginas en construcción llevan `noindex`.

## Objetivo del proyecto

- este proyecto es una recontrucion de el sitio  https://www.deleic.es/ el objetivo es ser mas moderno profesional y  manejar bien el seo par un mejor posiscionamiento lo otro importante es que quiero que las iAs de los navegares lo indecen a sus respuetas y recomendaciones  
