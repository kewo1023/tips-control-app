# Fase 1 — Publicar Tips Control y meterla en el iPhone

Verificado contra la documentación de GitHub el 6 de agosto de 2026. Las
interfaces cambian: si algo no coincide con lo que ves, **manda una captura de
pantalla en vez de adivinar**.

Ya hiciste esto con `habitos-app`, así que va directo al grano. Lo único
distinto es que aquí son varios archivos, no uno.

---

## Antes de empezar

Los archivos van todos en una carpeta nueva, `~/Desktop/tips-control`:

```
index.html        la app
logica.js         los cálculos
pruebas.js        los tests (no se publica, pero va al repo)
sw.js             el service worker
manifest.json     los datos para instalarla
icono-180.png     ícono para iPhone
icono-192.png     íconos para Android
icono-512.png
hacer-iconos.py   el script que los generó (por si hay que rehacerlos)
```

**Todos en la misma carpeta, sin subcarpetas.** La app busca `logica.js` al
lado de `index.html`; si lo mueves, deja de funcionar.

---

## Paso 1 — Crear el repositorio

1. Entra a github.com y **confirma con qué cuenta estás**. Tienes dos: la buena
   es **`kewo1023`**. En `habitos-app` esto ya causó problemas una vez — GitHub
   autoriza con la sesión del navegador, no con lo que diga tu computadora.
2. Botón **+** arriba a la derecha → **New repository**.
3. Nombre: `tips-control`.
4. Déjalo en **Public**. Tiene que serlo: GitHub Pages gratis solo publica
   repositorios públicos.
5. **No marques** nada de "Add a README", "Add .gitignore" ni licencia. Que
   quede vacío; si no, git se queja al subir la carpeta.
6. **Create repository**.

---

## Paso 2 — Subir los archivos

Igual que con `habitos-app`: abre la carpeta `tips-control` en VS Code, panel
de control de código fuente, escribe un mensaje de commit y sincroniza. Los
pasos detallados están en tu `PASOS-GIT.md` del otro proyecto.

Mensaje del primer commit: `Fase 0 — registro de turnos y cálculo de tip-out`.

Si VS Code te pregunta a qué repositorio subir, es el `tips-control` que
acabas de crear, rama **`main`**.

---

## Paso 3 — Encender GitHub Pages

1. En el repositorio, pestaña **Settings** (arriba, a la derecha del todo).
2. En la barra lateral izquierda, sección **Code and automation**, entra a
   **Pages**.
3. En **Build and deployment** → **Source**, elige **Deploy from a branch**.
4. En **Branch**, elige **`main`** y la carpeta **`/ (root)`**.
5. **Save**.

**Tarda hasta 10 minutos.** Si entras enseguida y ves un 404, no está roto:
espera y recarga. Refresca la página de Settings → Pages hasta que aparezca
arriba el mensaje con tu dirección.

Tu dirección va a ser:

```
https://kewo1023.github.io/tips-control/
```

---

## Paso 4 — Instalarla en el iPhone

1. Abre esa dirección **en Safari** (no en Chrome: en iOS, solo Safari puede
   instalar apps en la pantalla de inicio).
2. Botón **Compartir** (el cuadrito con la flecha hacia arriba).
3. Baja y toca **Añadir a pantalla de inicio**.
4. Debería salir el ícono verde con las barras y el nombre **Tips**. Toca
   **Añadir**.

Ábrela desde la pantalla de inicio. Si se ve a pantalla completa, sin la barra
de direcciones de Safari, quedó bien instalada.

---

## El ciclo de trabajo de aquí en adelante

Cada vez que cambiemos algo:

1. Editas o reemplazas los archivos en `~/Desktop/tips-control`.
2. **Le subes el número a `VERSION` en `sw.js`** (`v1` → `v2` → `v3`…).
3. Commit + Sync en VS Code.
4. Esperas un minuto y recargas en el iPhone.

**El paso 2 no es opcional.** El service worker guarda una copia de la app en
el teléfono; si la versión no cambia, iOS puede seguirte mostrando la de ayer y
vas a pensar que el cambio no se subió. Cuando algo "no se actualizó", revisa
eso antes que nada.

---

## Puntos frágiles

**Si la página sale en blanco.** Casi siempre es que falta un archivo o está
mal escrito el nombre. En Safari del Mac: menú Desarrollo → Consola JavaScript,
y mira el error en rojo. Si no ves el menú Desarrollo, se activa en
Safari → Ajustes → Avanzado.

**Si el ícono sale gris o como una foto de la pantalla.** iOS no encontró
`icono-180.png`. Confirma que subiste el archivo y que está junto a
`index.html`. iOS cachea los íconos con ganas: borra la app de la pantalla de
inicio y vuelve a añadirla.

**Si la app abre pero no guarda nada.** Estás en modo de navegación privada.
`localStorage` no persiste ahí.

**Si Settings → Pages se ve distinto a como está descrito arriba.** GitHub
cambia ese panel de vez en cuando. Manda una captura antes de tocar botones al
azar.

---

## Qué probar en el teléfono, de verdad

Estas cosas solo se comportan de verdad en el iPhone; la vista móvil del
inspector del Mac no las reproduce:

- Que el teclado numérico salga al tocar los campos de dinero (y que la
  pantalla no haga zoom sola).
- Que la barra de pestañas de abajo no quede debajo de la barra del iPhone.
- Que se lea con una mano, de pie, saliendo de un turno.
- Que abra sin señal (modo avión) después de haberla abierto una vez con datos.
- Cuánto tarda de verdad registrar un turno completo. Cronométralo.
