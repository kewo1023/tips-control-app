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

const VERSION = 'v2';
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

  evento.respondWith(
    fetch(evento.request)
      .then(respuesta => {
        const copia = respuesta.clone();
        caches.open(CACHE).then(c => c.put(evento.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(evento.request))
  );
});
