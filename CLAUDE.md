# Tips Control — instrucciones para Claude

App web (PWA) para que un mesero registre sus propinas por turno y sepa cuánto
gana de verdad por hora. Dólares, restaurantes de Estados Unidos. La usan
meseros de varios restaurantes, no solo quien la hizo: casi todas las reglas
de abajo salen de ahí.

Publicada en `https://kewo1023.github.io/tips-control-app/` desde la rama
`main`. El mantenedor hace sus propios commits.

## Antes de empezar

1. **Leer `BITACORA.md` y `CONTEXTO-LOCAL.md`** si existen. No se versionan:
   son de esta máquina. El primero dice dónde va el trabajo; el segundo, cómo
   trabajar con el mantenedor.
2. **Leer `DECISIONES.md` antes de tocar cualquier parte que mencione.** Ahí
   están los porqués y los incidentes. Casi todo lo que parece raro en el
   código tiene una razón escrita allí.
3. **Leer el código antes de proponer algo.** Este documento no lleva cifras
   (líneas, número de pruebas, versión) a propósito: caducan con cada cambio y
   se miran en diez segundos. Si hace falta una, se mide.

## Mantener esta documentación

Este archivo y `DECISIONES.md` viajan en el mismo commit que el código que
describen. **Cuando se tome una decisión de peso, se escribe en
`DECISIONES.md` con su razón en la misma sesión**, no después. Lo que se
escribe son razones, no datos: un "por qué" perdido se rediscute durante una
tarde.

## Privacidad del repositorio

El repo es público y todo su historial también. **Ningún dato personal del
mantenedor entra a un archivo versionado, a un mensaje de commit ni al nombre
de un archivo o rama.** La pregunta que resuelve cada caso: ¿esto describe el
SOFTWARE o describe a una PERSONA? Lo primero va aquí; lo segundo, a
`CONTEXTO-LOCAL.md`.

- Los ejemplos se escriben como ejemplos, no como "el caso de alguien".
- Borrar un dato en un commit posterior no lo saca del historial.
- Hay un hook `pre-commit` local que bloquea los términos de la lista de
  `CONTEXTO-LOCAL.md`. Si frena, primero se mira si tiene razón; no se salta
  con `--no-verify` para meter un ejemplo real.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Pantallas y código de la interfaz y el guardado. Sus secciones (I…U) van en el orden en que aparecen: mantener ese orden |
| `estilos.css` | Todo el CSS (secciones A…H y A2…A5), en el orden de la cascada |
| `logica.js` | Cálculos puros sobre el dinero. Es lo que se prueba |
| `textos.js` | Todos los textos de la app, en español y en inglés (`TEXTOS`) |
| `pruebas.js` | Pruebas de las fórmulas. `node pruebas.js` |
| `pruebas-app.js` | Uso real simulado sobre `index.html`. `node pruebas-app.js` |
| `mini-dom.js` | DOM mínimo escrito a mano para las pruebas (jsdom no está disponible) |
| `sw.js` | Service worker |
| `manifest.json`, `icono-*.png` | Instalación |
| `hacer-iconos.py` | Generador de los íconos |
| `LICENSE` | Uso permitido; copiar o modificar el código, no |
| `DECISIONES.md` | Los porqués y los incidentes |

## Reglas que no se rompen

**Verificar.** Después de cualquier cambio, correr las dos capas:
`node pruebas.js` y `node pruebas-app.js`. Después de escribir pruebas
nuevas, **romper el código a propósito y confirmar que salen en rojo**.

**Publicar.** Subir `VERSION` en `sw.js` **y** `VERSION_APP` en `index.html`
en cada publicación con cambio de comportamiento. Una prueba compara los dos.

**Ningún error mudo.** Toda operación sobre los datos del usuario va en
`try/catch` con un aviso visible: texto humano primero, detalle técnico
detrás. Un `catch` vacío solo con un comentario que diga por qué.

**Prohibido `Number(x) || 0`** para leer lo que escribió alguien. Mezcla
vacío, ilegible y cero. Se usa `leerNumero()` de `logica.js`, que separa las
tres cosas. Los campos numéricos son `type="text" inputmode="decimal"`, nunca
`type="number"`.

**Nada de `alert()` ni `confirm()`.** Se usa `avisar(texto)` y
`preguntar(texto, siAcepta, [siNo])`.

**Ningún texto visible suelto en el código.** Va en `TEXTOS` (`textos.js`), en
español y en inglés, y se llama con `t('clave')`. Todo archivo nuevo que cargue
la página (`<script src>` o `<link rel="stylesheet">`) va también en
`ARCHIVOS` de `sw.js` (una prueba lo vigila).

**Texto que escribe la persona dentro de HTML armado a mano:** `escaparHTML()`.
Mejor `textContent` cuando se pueda.

**Los datos son la única verdad.** Cualquier cambio llama a `guardar()` y
luego a `pintar()`. `guardar()` devuelve si lo consiguió; quien cierra una
pantalla después de guardar tiene que comprobarlo.

**Valores por defecto en un solo sitio:** `PREFS_POR_DEFECTO` y
`TRABAJO_POR_DEFECTO`. Los campos nuevos de `trabajo` van sueltos, no dentro de
un objeto anidado. El tema por defecto está duplicado en el script de la
cabecera, con aviso.

**No guardar lo que se puede calcular**, salvo los valores históricos que se
congelan en el turno (`tarifaHora`, `tipOut`, `tipoutDetalle`,
`tipoutTramos`). Un turno por día. Identificadores con `nuevoId()` (UUID).

**Al añadir a `logica.js` una función que use `index.html`**, añadirla a
`FUNCIONES_NECESARIAS` (sección U).

**Sin frameworks, sin npm, sin compilación.** HTML, CSS y JavaScript puro.
Cambiar eso se discute antes.

## Antes de construir una función nueva

Evaluarla primero en cuatro ejes y devolver la evaluación, no el código:

1. **Utilidad** — ¿qué problema real resuelve, hoy?
2. **Fricción** — se usa al final de un turno, cansado, de pie, con una mano.
   Cada toque extra cuenta el doble.
3. **Impacto en el código** — qué se toca y qué pruebas hacen falta.
4. **Lo que no se ve** — límites de iOS, Safari y del plan gratuito de
   Supabase; decisiones de hoy que cierran puertas mañana.

Proponer alternativa si la idea no conviene, y desaconsejar cuando toque.
**Antes de añadir una casilla en Ajustes:** ¿hay dos personas razonables que
quieran cosas distintas? Si no, elegir la buena y no preguntar.

**Para cambios visuales**, mandar una página HTML suelta con el antes y el
después (o dos o tres opciones) en los dos temas, para mirarla en el
teléfono. No va al repositorio.

**Para pasos sobre herramientas de terceros** (GitHub, Supabase, Resend) o
comportamiento del navegador: buscar la documentación actual antes de
escribir un paso, y decir qué se verificó y qué no.

## Lo que no se puede probar aquí

Lo visual, el CSS, los `onclick` escritos en el HTML, compartir y descargar
archivos, y cualquier cosa que dependa del teléfono de verdad. Eso se prueba
publicando y abriéndola en el iPhone.

`mini-dom.js` ya ha mentido tres veces con respuestas plausibles. Si le falta
algo, se completa de forma que lo que no sepa responder **falle**. Sigue sin
conocer los `id` de elementos creados con `createElement`.
