/* ============================================================================
   SERVICE WORKER — Tips Control
   ----------------------------------------------------------------------------
   Un service worker es un ayudante que se queda instalado en el teléfono y se
   mete en medio de cada petición de archivos. Sirve para dos cosas:

     1. Que la app abra sin internet (el sótano del restaurante, el metro).
     2. Que abra rápido, porque los archivos ya están en el teléfono.

   ⚠️ CADA VEZ QUE CAMBIES index.html, logica.js O ESTE ARCHIVO:
      súbele el número a VERSION antes de publicar.
      Si no lo haces, el iPhone puede seguir mostrando la versión vieja y vas a
      creer que tu cambio no se subió. Es el error número uno de este montaje.
   ========================================================================== */

const VERSION = 'v14';
const CACHE = 'tips-control-' + VERSION;

const ARCHIVOS = [
  './',
  './index.html',
  './logica.js',
  './manifest.json',
  './icono-180.png',
  './icono-192.png',
  './icono-512.png'
];

/* Al instalarse, guarda una copia de todo. */
self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ARCHIVOS))
  );
  // No esperes a que se cierren las pestañas viejas para activarte.
  self.skipWaiting();
});

/* Al activarse, borra las copias de versiones anteriores. */
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys().then(nombres => Promise.all(
      nombres.filter(n => n !== CACHE).map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

/* ----------------------------------------------------------------------------
   Estrategia: PRIMERO LA RED, la copia como respaldo.

   Cada vez que la app pide un archivo, intenta bajarlo de internet. Si lo
   consigue, lo usa y actualiza la copia guardada. Si no hay señal, usa la
   copia.

   La alternativa (primero la copia) haría que la app abra más rápido, pero
   mientras estemos cambiando el código a diario, significaría abrir el teléfono
   y ver la versión de ayer. Cuando la app se estabilice se puede revisar esta
   decisión; hoy no.
   -------------------------------------------------------------------------- */
self.addEventListener('fetch', evento => {
  if (evento.request.method !== 'GET') return;

  /* "Primero la red" tenía una gotera, y el 8 de agosto de 2026 nos costó una
     tarde de diagnóstico.

     Este `fetch` no habla directamente con internet: pasa antes por la memoria
     del propio navegador, que guarda los archivos por su cuenta durante unos
     minutos. GitHub Pages le dice que puede quedárselos diez. Así que pedir
     "primero la red" devolvía a veces la copia de hace un rato.

     Con index.html casi nunca pasa, porque una página abierta se revalida. Con
     logica.js sí: es un archivo secundario y el navegador lo da por bueno. El
     resultado fue el peor de los mundos: pantalla nueva, cálculos viejos. La
     app parecía actualizada y no lo estaba.

     `cache: 'reload'` le prohíbe usar esa copia y lo obliga a ir a la red. Se
     aplica solo a los archivos secundarios: una petición de navegación no se
     puede reconstruir así, y da error al intentarlo. */
  const peticion = evento.request.mode === 'navigate'
    ? evento.request
    : new Request(evento.request, { cache: 'reload' });

  evento.respondWith(
    fetch(peticion)
      .then(respuesta => {
        const copia = respuesta.clone();
        caches.open(CACHE).then(c => c.put(evento.request, copia));
        return respuesta;
      })
      // Sin señal: la copia guardada. Se busca por la petición original, que
      // es la clave con la que se guardó.
      .catch(() => caches.match(evento.request))
  );
});
