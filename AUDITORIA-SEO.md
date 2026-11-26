# Auditoría SEO local y para IAs

Revisión del 26 de noviembre de 2026. Objetivo: posicionar Deleic en León, en
Google y en los asistentes de IA (ChatGPT, Gemini, Copilot, Claude, Perplexity).
Se revisó el HTML del build y se comparó con la web WordPress que hoy está en
www.deleic.es.

## Lo que ya está bien

- **Base técnica sólida.** Todo el contenido sale en el HTML (sin depender de JS),
  las fotos van en WebP y no hay scripts de terceros.
- **Cada página tiene su propio title y description con "León"**, además de
  canonical y OG.
- **El schema está muy bien hecho.** Una sola entidad del negocio con el mismo
  `@id` en todo el sitio, `Service` con precios, una `FAQPage` que coincide con la
  FAQ visible, migas de pan y el horario de verano.
- **`robots.txt` abre la web a los bots de IA, y `llms.txt` se genera con los
  mismos datos que las páginas.** Pocas webs locales lo tienen.
- **Los precios aparecen en texto.** Es justo lo que usa una IA para responder
  "¿cuánto cuesta X en León?". Es la mayor ventaja frente a la competencia.

## 🔴 Crítico: arreglar antes de publicar

**1. La migración perdería casi todo lo posicionado.** El sitemap de la web actual
tiene **120 URLs**, y **114 no tienen destino** en la web nueva, así que darían 404
(lista completa en el anexo). Entre ellas:

- `/depilacion-laser-de-diodo-en-leon/`, que seguramente es la página que posiciona
  por "depilación láser León"
- `/conocenos/`, `/zonas-y-tarifas/`, `/tarifas-estetica/`,
  `/tratamientos-faciales-corporales/`, `/donde-esta-deleic-estetica/` y
  `/promociones-mes/`
- unos 38 artículos de blog, por ejemplo `/deleic/hollywood-peel/`,
  `/depilacion-laser/las-10-mentiras-de-la-depilacion-laser/` y
  `/preguntas/que-es-symmed/`

Además, de las 7 redirecciones de [astro.config.mjs](astro.config.mjs) **solo 1
coincide con una URL real**. Por ejemplo, se redirige `/hollywood-peel`, pero la
URL real es `/deleic/hollywood-peel/`.

**2. Las redirecciones no son 301 de verdad.** Sin adaptador, Astro genera una
página HTML con `meta refresh`. Google suele tratarla como redirección, pero no
todos los bots de IA la siguen. Hay que declararlas en `vercel.json` o con
`@astrojs/vercel`. Las de categorías y etiquetas (67) pueden ir a su servicio o
quedarse en 404.

**3. Promociones se rompe al cambiar de dominio.**
[src/lib/wordpress.ts](src/lib/wordpress.ts) lee la API de `www.deleic.es/wp-json`.
Cuando la web nueva ocupe ese dominio, la API dejará de existir, la página mostrará
siempre "Estamos preparando…" y la `og:image` apuntará a una imagen de WordPress
que ya no existirá. Hay que mover WordPress a un subdominio (`PUBLIC_WP_URL`) antes
del cambio.

**4. Search Console y Bing Webmaster Tools desde el primer día**, con el sitemap
enviado y vigilando los 404 la primera semana. Bing cuenta más de lo que parece:
ChatGPT y Copilot buscan sobre su índice.

## 🟠 Prioridad alta: aquí se gana el posicionamiento en León

**5. Fuera de la web: la ficha de Google pesa más que cualquier cambio de código**
para salir en el mapa de "estética León".

- Ficha de Google bien completada: categorías, servicios con precio, fotos,
  publicaciones y respuesta a todas las reseñas.
- **Bing Places**, que alimenta a ChatGPT y Copilot, y **Apple Business Connect**,
  que alimenta a Siri y Apple Maps.
- Mismo nombre, dirección y teléfono en todos los directorios.
- La web nueva **no enlaza a Instagram (`deleic_laser_estetica`) ni a Facebook
  (`deleic`)**, y la actual sí. Hay que añadirlos en el footer y como `sameAs` en
  el schema. ✅ Hecho el 26/11/2026: iconos en el footer de todas las páginas y
  `sameAs` en el schema, los dos leídos de `REDES` en `contacto.ts`. El Instagram
  actual es **@deleic.es**, no el que enlazaba la web anterior.

**6. Medicina estética es la página con más potencial y la más débil.**

- Son unos 25 tratamientos en una sola URL, con un H1 sin palabra clave
  ("Belleza, armonía…"). Cada uno de los principales merece su propia ficha, como
  ya hay en facial: ácido hialurónico (labios, ojeras, surcos), hilos tensores, PRP,
  mesoterapia, varices, papada y foxy eyes.
- **Toxina botulínica no debería tener ficha propia**, por lo de la Ley del
  medicamento.
- Es una temática de salud, y Google exige autoría médica. Sin el nombre de la
  doctora y su número de colegiada, la página compite en desventaja. Ya está en
  [PENDIENTES-CLIENTE.md](PENDIENTES-CLIENTE.md), pero conviene subirlo de
  prioridad.

**7. Las 12 fichas de facial y corporal no dicen "León" ni una vez en el texto
visible**, y sus H1 son frases emotivas ("Retrasa el reloj de tu piel").

- H1 con la búsqueda real ("Tratamiento antiacné en León") y la frase emotiva como
  subtítulo.
- Usar las palabras con que busca la gente: "despigmentante" debería ser
  **"manchas en la cara"**. Las demás conviene confirmarlas con datos de Search
  Console.
- Solo 4 de las 12 fichas tienen FAQ, y tienen entre 300 y 700 palabras. Las
  preguntas frecuentes son lo que más citan las IAs.

**8. Depilación láser no tiene FAQ y solo tiene 546 palabras**, cuando es la
búsqueda más competida. Se pueden recuperar los artículos antiguos ("dudas sobre la
depilación láser", "las 10 mentiras", "por qué a mí no me funciona") como FAQ y
contenido de la página.

**9. Blog o guías.** No tirar los 38 artículos. Mirar en Search Console cuáles
tienen clics, reescribir esos en `/blog/` y redirigir el resto al servicio que les
corresponda.

## 🟡 Prioridad media

**10. Agentes de IA:** hoy solo se puede reservar por WhatsApp o teléfono, y un
agente (ChatGPT, Gemini) no puede completar una reserva así. Una agenda online
(Treatwell, Booksy o Fresha, con "Reservar con Google") más un `ReserveAction` en el
schema permitiría reservar desde Maps y desde agentes. Además, **las promociones son
solo imágenes**, que ni Google ni las IAs leen: hay que escribir en texto la oferta,
el precio y la fecha hasta la que vale.

**11. Datos que faltan en el schema.** ✅ Hecho el 26/11/2026:

- `geo` con el pin de la ficha de Google (42.59972, -5.57761). La cifra que daba
  antes esta auditoría era el centro del mapa embebido, no el pin.
- `sameAs` con Instagram y Facebook, y `founder` y `foundingDate` en todas las
  páginas, no solo en Nosotros.
- Logo con URL fija: `/img/logo/deleic.png`.
- `areaServed` con León, San Andrés del Rabanedo, Villaquilambre, Valverde de la
  Virgen y Sariegos, igual en el negocio y en cada servicio.
- `priceRange` se deja fuera a propósito. Un rango calculado iría de 2,50 € (el
  pantalón de presoterapia) a 1.199 € (Wegovy, que está oculto) y engañaría, y
  "€€" sería una valoración que tendría que dar la clienta.

**12. Contacto tiene `noindex` y está "en construcción".** ✅ Hecho el 26/11/2026:
la página está terminada e indexable, con schema `ContactPage` y migas, y la
referencia "esquina con la Gran Vía de San Marcos" (también en la tarjeta de
dirección de todas las páginas y en `llms.txt`). `/donde-esta-deleic-estetica/` y
`/contacto-mensaje/` redirigen a ella. Faltan aparcamiento, autobús y
accesibilidad: están preguntados en `PENDIENTES-CLIENTE.md`.

**13. Sitemap sin `lastmod`.** ✅ Hecho el 26/11/2026: cada página lleva la fecha
del último commit que tocó su contenido (`FUENTES` en `astro.config.mjs`). En un
clon superficial, las fechas que no se pueden saber se omiten en vez de inventarse.
IndexNow queda preparado (`npm run indexnow`), pero no funcionará hasta que la web
nueva esté en www.deleic.es.

**14. Descriptions demasiado largas:** portada (163 caracteres), micropigmentación
(190) y nosotros (192). Google las corta.

## ⚪ Detalles menores

✅ Hechos el 26/11/2026, salvo el de "3D", que depende de la respuesta de la clienta.
Los H1 visibles mantienen sus mayúsculas: solo se han cambiado los title.

- Algunos títulos pegan la etiqueta al texto: "Diagnóstico facial 3D**Método
  Deleic**", "RGB**Luz blanca**", "Luz azul**405 nm**". Así lo leen los bots.
- El selector de la portada genera unos 30 H4 genéricos ("Manchas", "Cuerpo"), que
  ensucian la estructura de encabezados.
- Los títulos mezclan mayúsculas de estilo inglés ("Tratamiento Antiacné y Marcas")
  con mayúsculas normales.
- La duda entre "3D" y "avanzado" también confunde a las IAs sobre si es un solo
  servicio o dos.

## Lo que no conviene hacer

- **Páginas por barrio o pueblo** ("estética en Trobajo"): Google las penaliza como
  páginas puerta.
- **`aggregateRating` con reseñas propias:** Google no muestra esas estrellas en
  negocios que se valoran a sí mismos, y es un riesgo. Mejor mostrar reseñas reales
  en texto.
- **Dedicar más tiempo a `llms.txt`:** ya está bien hecho, y hoy los asistentes se
  fían mucho más del HTML, de la ficha de Google y de lo que se dice del centro en
  otras webs.

## Orden propuesto

1. Puntos 1 a 4, antes de publicar.
2. Puntos 5 a 8.
3. El resto, según haya tiempo.

## Anexo: URLs de la web actual sin destino en la web nueva

Sacadas de `https://www.deleic.es/sitemap_index.xml` el 26/11/2026. Faltan además
67 URLs de categorías (`/category/…`) y etiquetas (`/tag/…`).

```
/blog/
/biocosmetica/tratamiento-antiedad/
/preguntas/preguntas-frecuentes/
/eberlin/por-que-eberlin/
/deleic/que-es-el-microblading/
/tratamientos-faciales/relleno-de-ojeras-para-quien-es-ideal-y-para-quien-no/
/deleic/ultrasonix/
/tratamiento-corporal/consejos-para-elegir-el-tratamiento-corporal-adecuado-segun-tu-tipo-de-piel/
/deleic/tratamiento-capilar/
/biocosmetica/tratamiento-bolsas-ojeras-y-contorno/
/cosmetica/que-diferencia-a-la-cosmetica-profesional-de-la-cosmetica-comercial/
/calidad/tratamiento-drenante/
/medicina-estetica/tratamientos-antiedad-sin-cirugia-beneficios-y-resultados/
/uncategorized/cuando-buscar-un-tratamiento-capilar-profesional/
/uncategorized/beneficios-a-largo-plazo-de-la-depilacion-laser-en-deleic-tu-centro-de-estetica-de-confianza/
/hidrafacial/piel-deshidratada-vs-piel-seca-como-ayuda-hydrabalance-de-deleic-a-tratarlas-correctamente/
/cosmetica/tratamiento-despigmentante/
/calidad/dudas-sobre-la-depilacion-laser/
/deleic/bbglowww-maquillaje-semipermanente/
/deleic/lifting-de-pestanas-cejas/
/depilacion-laser/las-10-mentiras-de-la-depilacion-laser/
/preguntas/que-es-symmed/
/uncategorized/cuidados-de-la-piel-post-tratamiento-la-guia-esencial-de-deleic/
/deleic/tratamientos-antiacne-y-marcas/
/preguntas/por-que-le-funciona-el-laser-y-a-mi-no/
/uncategorized/microblading-todo-lo-que-necesitas-saber/
/biocosmetica/tratamiento-oxigenante-y-efecto-flash/
/microblading/microblading-vs-micropigmentacion-en-deleic-acabados-duracion-y-retoques/
/medicina-estetica/hilos-tensores-en-medicina-estetica-por-que-elegirlos/
/tratamientos-faciales/mesoterapia-facial-el-tratamiento-medico-estetico-estrella-en-deleic/
/deleic/micropigmentacion-capilar-efecto-rapado/
/deleic/higiene-facial-con-nd-hydrabalance/
/tratamientos-faciales/que-es-el-efecto-foxy-eyes-de-tendencia-en-redes-a-tratamiento-medico-estetico-en-deleic/
/deleic/hidraglow/
/acne/mesoestetic/
/calidad/micropigmentacion/
/deleic/hollywood-peel/
/donde-esta-deleic-estetica/
/recomendaciones/
/contacto-mensaje/
/cosmetica/
/zonas-y-tarifas/
/depilacion-laser-de-diodo-en-leon/
/conocenos/
/tratamientos-faciales-corporales/
/tarifas-estetica/
/promociones-mes/
```
