# Deleic · sitio web

Nueva web de **Deleic**, centro de estética y medicina estética en León. Sustituye a
la web WordPress que hoy está en [www.deleic.es](https://www.deleic.es) con tres
objetivos:

- un diseño más moderno y profesional;
- buen posicionamiento en Google para búsquedas locales («depilación láser León»…);
- que los asistentes de IA (ChatGPT, Gemini, Copilot, Claude, Perplexity) lean la
  web y recomienden el centro.

> **Estado:** en pruebas. Antes de publicarla en el dominio hay que completar la
> migración de URLs de la web anterior (ver [AUDITORIA-SEO.md](AUDITORIA-SEO.md)).

## Índice

- [Stack](#stack)
- [Puesta en marcha](#puesta-en-marcha)
- [Comandos](#comandos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Páginas](#páginas)
- [Dónde se cambia cada cosa](#dónde-se-cambia-cada-cosa)
- [SEO e IAs](#seo-e-ias)
- [Privacidad y cookies](#privacidad-y-cookies)
- [Despliegue](#despliegue)
- [Solución de problemas](#solución-de-problemas)
- [Documentación del repositorio](#documentación-del-repositorio)

## Stack

| | |
|---|---|
| Framework | [Astro](https://docs.astro.build) 7, salida estática |
| Estilos | Tailwind CSS v4 + daisyUI 5 (tema `light`) |
| Imágenes | `astro:assets` con sharp: WebP a calidad 90, varios anchos |
| Contenido | JSON en `src/data/` y una colección de Astro (`facialCorporal`) |
| Promociones | API REST pública del WordPress del cliente |
| Hosting | Vercel |
| Node | 24.x (fijado en `engines` de `package.json`) |

No hay backend, base de datos, analítica ni scripts de terceros.

## Puesta en marcha

```sh
git clone https://github.com/gandresreyes/Deleic.git
cd Deleic
npm install
npm run dev
```

La web queda en <http://localhost:4321>. `npm run dev` arranca con `--host`, así que
también se puede abrir desde el móvil en la misma red (la URL sale en la terminal).

### Variables de entorno

Ninguna es obligatoria.

| Variable | Para qué | Por defecto |
|---|---|---|
| `PUBLIC_WP_URL` | WordPress del que se leen las promociones. Hay que definirla si WordPress se mueve (p. ej. a un subdominio) al publicar esta web. | `https://www.deleic.es` |

Se ponen en un archivo `.env` en la raíz, que está en `.gitignore`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Compila la web en `dist/` |
| `npm run preview` | Sirve `dist/` para revisar el build antes de publicar |
| `npm run escaner` | Regenera las 8 luces del escáner del Método Deleic y sus marcas ([más abajo](#escáner-de-luces-del-método-deleic)) |
| `npm run indexnow` | Avisa a Bing de las páginas cambiadas tras publicar ([más abajo](#despliegue)) |

## Estructura del proyecto

```text
.
├── astro.config.mjs      Dominio, redirecciones, sitemap (lastmod y noindex), imágenes
├── public/               Se sirve tal cual, sin procesar
│   ├── fonts/            Fuentes alojadas en la propia web (nada de Google Fonts)
│   ├── img/              Escáner de luces, imagen OG de la portada, logo del schema
│   └── <clave>.txt       Clave pública de IndexNow
├── scripts/              Scripts de Node que se lanzan a mano
│   ├── escaner-luces.mjs
│   └── indexnow.mjs
└── src/
    ├── assets/img/       Fotos de cada sección; se optimizan en el build
    ├── components/       Componentes compartidos y, en subcarpetas, los de cada página
    ├── content.config.ts Esquema de la colección facialCorporal
    ├── data/             Contenido y datos del negocio
    │   ├── contacto.ts   Teléfono, WhatsApp, dirección, horario, redes, titular
    │   ├── temporadas.ts Fechas de la decoración de Navidad, San Valentín…
    │   └── *.json        Textos, precios y FAQ de cada servicio
    ├── layouts/
    │   └── Layout.astro  <head>, metas SEO, navbar, footer y márgenes de página
    ├── lib/              Lógica compartida entre build y navegador
    │   ├── fechas.ts     Reloj de León y días sin año ("1 dic")
    │   ├── horario.ts    Interpreta el horario («Abierto ahora», schema)
    │   ├── imagenes.ts   Rutas "/img/…" → fotos optimizadas, sizes
    │   ├── precios.ts    Lectura uniforme de las tarifas de los JSON
    │   ├── schema.ts     Piezas de schema.org: negocio, migas, FAQ
    │   ├── texto.ts      Enlaces [texto](/ruta) dentro de los JSON
    │   └── wordpress.ts  Promociones desde la API de WordPress
    ├── pages/            Una ruta por archivo (incluye llms.txt y robots.txt)
    ├── scripts/          JavaScript del navegador
    │   ├── reveal.ts     Animaciones de aparición al hacer scroll
    │   ├── foco.ts       Efecto hover de las tarjetas en pantallas táctiles
    │   ├── textura.ts    Luz que sigue al cursor
    │   ├── mapa.ts       Permiso para cargar el mapa de Google
    │   ├── escaner.ts    Visor del escáner de luces
    │   ├── temporadas.ts Enciende el adorno de temporada que toque
    │   └── temporadas/   Un adorno por temporada (.ts + .css)
    └── styles/
        └── global.css    Tema (colores), espaciado y utilidades propias
```

## Páginas

| URL | Archivo | Contenido |
|---|---|---|
| `/` | `pages/index.astro` | `queMejorar.json` y componentes de la portada |
| `/depilacion-laser/` | `pages/depilacion-laser.astro` | `depilacionLaser.json` |
| `/facial-corporal/` | `pages/facial-corporal/index.astro` | Colección `facialCorporal` |
| `/facial-corporal/<tratamiento>/` | `pages/facial-corporal/[id].astro` | Una entrada de `facialCorporal.json` por tratamiento |
| `/medicina-estetica/` | `pages/medicina-estetica/index.astro` | `medicinaEstetica.json` |
| `/metodo-deleic/` | `pages/metodo-deleic.astro` | `metodoDeleic.json`, `escanerMarcas.json` |
| `/micropigmentacion/` | `pages/micropigmentacion/index.astro` | `micropigmentacion.json` |
| `/nosotros/` | `pages/nosotros.astro` | En la propia página |
| `/contacto/` | `pages/contacto.astro` | `contacto.ts` |
| `/promociones/` | `pages/promociones.astro` | WordPress (página `promociones-mes`) |
| `/aviso-legal/` · `/politica-de-privacidad-y-cookies/` | `pages/…` | `contacto.ts` (`TITULAR`, `EMAIL`); con `noindex` |
| `/llms.txt` · `/robots.txt` · `/sitemap-index.xml` | Generados en el build | Mismos datos que las páginas |

Las URLs antiguas que cambian de ruta se redirigen en `redirects` de
`astro.config.mjs`.

## Dónde se cambia cada cosa

Todo dato aparece en **un solo sitio** y de ahí lo leen las páginas, el schema y
`/llms.txt`. Nunca escribas a mano teléfonos, direcciones, horarios ni precios en
una página.

### Teléfono, WhatsApp, dirección, horario o redes

En `src/data/contacto.ts`. Los enlaces de WhatsApp se generan con
`whatsapp("mensaje")` y el teléfono con `TELEFONO`.

### Precios y textos de un servicio

En su JSON de `src/data/`. Los tratamientos faciales y corporales están en
`facialCorporal.json`; los campos que admite cada tratamiento están descritos en
`src/content.config.ts`, y Astro avisa al compilar si falta alguno o tiene un
formato incorrecto.

Para poner un enlace dentro de un texto largo: `[texto](/ruta)`.

### Añadir un tratamiento facial o corporal

Añade una entrada a `src/data/facialCorporal.json`. Su página
`/facial-corporal/<slug>/` y su tarjeta en el listado salen solas.

### Añadir una página

1. Crea el archivo en `src/pages/` y pásale a `Layout` `title` y `description`
   (160 caracteres como máximo).
2. Añádela a `FUENTES` en `astro.config.mjs` con sus archivos de contenido, para que
   el sitemap tenga la fecha correcta.
3. Si es un servicio, añádelo también a `src/pages/llms.txt.ts`.
4. Si lleva `noindex`, añádela a `SIN_INDEXAR` en `astro.config.mjs`.

### Fotos

Van en `src/assets/img/<sección>/` y se pintan con el componente `<Foto>`, nunca con
`<img>`. En los JSON la ruta se escribe como en la web: `"/img/depilacion/hero.webp"`.

### Promociones del mes

Se editan en WordPress, en la página `promociones-mes`. El build las mete en el
HTML y, además, el navegador consulta WordPress al abrir la página: si hay
carteles más nuevos, los cambia sin volver a publicar la web.

### Decoración de temporada (Navidad, San Valentín…)

Las fechas están en `src/data/temporadas.ts`. Cada adorno se enciende y se apaga
solo en el navegador el día que toca, sin volver a publicar. Para verlo en
cualquier fecha:

```text
/?tema=navidad    /?tema=sanvalentin    /?tema=ninguna    /?tema=auto
```

### Escáner de luces del Método Deleic

`npm run escaner` calcula las 8 luces (blanca, paralela, cruzada, azul, UV, Wood,
eritema y térmica) y las marcas del análisis a partir de una sola foto
(`public/img/metodo-deleic/realist.webp`). Para usar otra foto, cambia `FOTO`,
`ESPEJO`, `ENCUADRE` y `PUNTOS` al principio de `scripts/escaner-luces.mjs`.

```sh
npm run escaner                      # regenera imágenes y marcas
npm run escaner -- --ver=<carpeta>   # además guarda hojas de control para revisarlas
```

### Diseño y estilo

Colores, espaciado, radios, botones, iconos y animaciones siguen la guía de
[AGENTS.md](AGENTS.md). Un bloque nuevo copia el estilo de su equivalente en otra
página.

## SEO e IAs

- **Todo el contenido está en el HTML del build**, no depende de JavaScript.
- **Metas por página:** `title`, `description`, canonical y Open Graph desde `Layout`.
- **Schema.org en JSON-LD:** una sola entidad del negocio (`HealthAndBeautyBusiness`),
  `Service` con precios, migas y una `FAQPage` generada desde la misma lista que la
  FAQ visible. Las piezas comunes están en `src/lib/schema.ts`.
- **`robots.txt`** permite de forma explícita los rastreadores de IA (GPTBot,
  ClaudeBot, PerplexityBot, Google-Extended…).
- **`llms.txt`** resume el centro, sus servicios y precios para los asistentes de IA.
- **Sitemap con `lastmod` real:** la fecha del último commit que tocó el contenido de
  cada página, nunca la del build.
- **IndexNow** para que Bing, sobre cuyo índice buscan ChatGPT y Copilot, relea las
  páginas cambiadas en cuanto se publican.

El estado actual y lo que queda pendiente está en [AUDITORIA-SEO.md](AUDITORIA-SEO.md).

## Privacidad y cookies

La web **no instala cookies sin consentimiento**, y por eso no necesita banner:

- las fuentes se sirven desde `public/fonts/`;
- no hay analítica, píxeles ni iframes que se carguen solos;
- el mapa de Google solo se carga cuando la persona pulsa el botón (y el permiso se
  puede retirar desde la política de cookies).

Si se añade un servicio externo, un formulario o cualquier tratamiento de datos
nuevo, hay que actualizar la política de privacidad. Si ese servicio instala
cookies no exentas, hará falta un banner de consentimiento.

## Despliegue

La web se publica en Vercel. El build es estático (`npm run build` → `dist/`) y no
necesita variables de entorno.

Mientras la web esté en pruebas se trabaja directamente sobre `main`.

Después de cada publicación en producción:

```sh
npm run indexnow            # avisa de las páginas con lastmod de los últimos 7 días
npm run indexnow -- 30      # de los últimos 30 días
npm run indexnow -- todas   # todas las del sitemap
```

El script lee el sitemap publicado, así que solo funciona cuando la web nueva ya
está en el dominio.

## Solución de problemas

**El puerto 4321 está ocupado o el servidor se ha quedado colgado**

```sh
npx astro dev stop              # si se lanzó con --background
lsof -i :4321                   # para ver qué proceso ocupa el puerto
kill -9 <PID>
```

**Cambios que no se ven o errores raros de Vite tras actualizar dependencias**

```sh
rm -rf .astro node_modules/.vite node_modules/.cache
npm run dev
```

**El sitemap sale sin fechas en local o en Vercel**

Las fechas salen del historial de git. En un clon superficial, el commit más antiguo
se descarta porque su fecha no es real. Con `git fetch --unshallow` se recupera el
historial completo.

## Documentación del repositorio

| Archivo | Contenido |
|---|---|
| [AGENTS.md](AGENTS.md) | Guía de diseño, código, SEO y legal que se sigue en cada cambio. `CLAUDE.md` es un enlace a este archivo. |
| [AUDITORIA-SEO.md](AUDITORIA-SEO.md) | Auditoría SEO local y para IAs (26 de noviembre de 2026) |
| [PENDIENTES-CLIENTE.md](PENDIENTES-CLIENTE.md) | Dudas pendientes de confirmar con la clienta |
